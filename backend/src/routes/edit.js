import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../middleware/auth.js";
import { quotaCheck } from "../middleware/quota.js";
import { generateRateLimit } from "../middleware/rateLimit.js";
import { sanitizePrompt } from "../util/sanitize.js";
import { createEditPrediction } from "../services/replicate.js";
import { run } from "../db/client.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("not_an_image"));
  },
});

router.post(
  "/",
  requireAuth,
  generateRateLimit,
  quotaCheck(() => "edit"),
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "image_required" });
      }

      const rawPrompt = req.body?.prompt;
      if (!rawPrompt || typeof rawPrompt !== "string") {
        return res.status(400).json({ error: "prompt_required" });
      }

      const prompt = sanitizePrompt(rawPrompt);
      if (!prompt) {
        return res.status(400).json({ error: "prompt_invalid" });
      }

      const aspectRatio = req.body?.aspect_ratio || "1:1";
      const imageBlob = new Blob([req.file.buffer], { type: req.file.mimetype });

      const prediction = await createEditPrediction(imageBlob, prompt, aspectRatio);
      const jobId = prediction.id;

      await run(
        `INSERT INTO usage_log (user_id, job_id, model, prompt, params, status, cost_credits)
         VALUES ($1, $2, 'edit', $3, $4, 'pending', 25)`,
        [req.session.userId, jobId, prompt, JSON.stringify({ aspect_ratio: aspectRatio })]
      );

      return res.json({ jobId, status: "pending" });
    } catch (e) {
      console.error(e);
      if (e?.status === 429 || e?.response?.status === 429) {
        return res.status(429).json({ error: "replicate_rate_limited" });
      }
      return res.status(500).json({ error: "edit_failed" });
    }
  }
);

export default router;
