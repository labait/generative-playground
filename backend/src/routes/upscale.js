import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { quotaCheck } from "../middleware/quota.js";
import { generateRateLimit } from "../middleware/rateLimit.js";
import { createUpscalePrediction } from "../services/replicate.js";
import { getOne, run } from "../db/client.js";

const router = Router();

function publicMediaUrl(jobId, token) {
  const base = (process.env.PUBLIC_BASE_URL || process.env.FRONTEND_URL || "").replace(/\/$/, "");
  if (!base || !token) return null;
  return `${base}/media/public/${token}`;
}

router.post(
  "/",
  requireAuth,
  generateRateLimit,
  quotaCheck(() => "upscale"),
  async (req, res) => {
    try {
      const { jobId } = req.body || {};
      if (!jobId || typeof jobId !== "string") {
        return res.status(400).json({ error: "job_id_required" });
      }

      const row = await getOne(
        `SELECT * FROM usage_log WHERE job_id = $1 AND user_id = $2 AND status = 'succeeded'`,
        [jobId, req.session.userId]
      );
      if (!row) {
        return res.status(404).json({ error: "source_not_found" });
      }

      if (!row.image_url && !row.local_path) {
        return res.status(400).json({ error: "no_image" });
      }

      let replicateSource = row.image_url;
      if (!replicateSource) {
        replicateSource = publicMediaUrl(jobId, row.media_access_token);
      }
      if (!replicateSource) {
        return res.status(400).json({
          error: "set_PUBLIC_BASE_URL",
          message: "Original image URL expired; set PUBLIC_BASE_URL (same host as Caddy) so Replicate can fetch /media/public/:token",
        });
      }

      const prediction = await createUpscalePrediction(replicateSource);
      const newJobId = prediction.id;

      await run(
        `INSERT INTO usage_log (user_id, job_id, model, prompt, params, status, cost_credits)
         VALUES ($1, $2, 'upscale', $3, $4, 'pending', 1)`,
        [req.session.userId, newJobId, row.prompt || "", JSON.stringify({ sourceJobId: jobId })]
      );

      return res.json({ jobId: newJobId, status: "pending" });
    } catch (e) {
      console.error(e);
      if (e?.status === 429 || e?.response?.status === 429) {
        return res.status(429).json({ error: "replicate_rate_limited" });
      }
      return res.status(500).json({ error: "upscale_failed" });
    }
  }
);

export default router;
