import crypto from "crypto";
import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getPrediction } from "../services/replicate.js";
import { downloadImageToFile } from "../services/imageStorage.js";
import { incrementQuota } from "../services/quota.js";
import { getOne, getAll, run } from "../db/client.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const rows = await getAll(
      `SELECT job_id, model, prompt, params, status, created_at
       FROM usage_log WHERE user_id = $1 AND status = 'succeeded'
       ORDER BY created_at DESC LIMIT 50`,
      [req.session.userId]
    );
    const jobs = rows.map((r) => ({
      jobId: r.job_id,
      model: r.model,
      prompt: r.prompt,
      params: r.params ? JSON.parse(r.params) : {},
      status: r.status,
      imageUrl: `/media/${r.job_id}`,
      createdAt: r.created_at,
    }));
    res.json({ jobs });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "fetch_jobs_failed" });
  }
});


function mapStatus(s) {
  if (s === "starting" || s === "processing") return "processing";
  if (s === "succeeded") return "succeeded";
  if (s === "failed" || s === "canceled") return "failed";
  return "processing";
}

function extractImageUrl(prediction) {
  const out = prediction.output;
  if (!out) return null;
  if (typeof out === "string") return out;
  if (Array.isArray(out) && out.length) return out[0];
  return null;
}

router.get("/:jobId", requireAuth, async (req, res) => {
  try {
    const { jobId } = req.params;
    const row = await getOne(
      "SELECT * FROM usage_log WHERE job_id = $1 AND user_id = $2",
      [jobId, req.session.userId]
    );
    if (!row) {
      return res.status(404).json({ error: "not_found" });
    }

    const prediction = await getPrediction(jobId);
    const status = mapStatus(prediction.status);
    const imageUrlRemote = extractImageUrl(prediction);

    if (status === "succeeded" && imageUrlRemote && row.status !== "succeeded") {
      let localPath = row.local_path;
      try {
        if (!localPath) {
          localPath = await downloadImageToFile(imageUrlRemote, jobId);
        }
      } catch (e) {
        console.error("image_download_failed", e);
        return res.status(500).json({ error: "image_store_failed" });
      }

      const mediaToken = crypto.randomBytes(24).toString("hex");
      const upd = await run(
        `UPDATE usage_log SET status = 'succeeded', image_url = $1, local_path = $2, media_access_token = $3, completed_at = NOW()
         WHERE id = $4 AND status != 'succeeded'`,
        [imageUrlRemote, localPath, mediaToken, row.id]
      );

      if (upd.rowCount > 0 && req.session.role !== "admin") {
        await incrementQuota(row.user_id, row.model, 1);
      }

      const publicUrl = `/media/${jobId}`;
      return res.json({
        status: "succeeded",
        progress: null,
        imageUrl: publicUrl,
        error: null,
      });
    }

    if (status === "failed" || prediction.status === "canceled") {
      await run(
        `UPDATE usage_log SET status = 'failed', completed_at = NOW() WHERE id = $1`,
        [row.id]
      );
      return res.json({
        status: "failed",
        progress: null,
        imageUrl: null,
        error: prediction.error || "generation_failed",
      });
    }

    if (row.status === "succeeded" && (row.local_path || row.image_url)) {
      return res.json({
        status: "succeeded",
        progress: null,
        imageUrl: `/media/${jobId}`,
        error: null,
      });
    }

    return res.json({
      status,
      progress: null,
      imageUrl: null,
      error: null,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "job_poll_failed" });
  }
});

router.delete("/:jobId", requireAuth, async (req, res) => {
  try {
    const { jobId } = req.params;
    const result = await run(
      "DELETE FROM usage_log WHERE job_id = $1 AND user_id = $2",
      [jobId, req.session.userId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "not_found" });
    }
    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "delete_failed" });
  }
});

export default router;
