import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { quotaCheck } from "../middleware/quota.js";
import { generateRateLimit } from "../middleware/rateLimit.js";
import { sanitizePrompt } from "../util/sanitize.js";
import { buildFluxInput, createPrediction, STYLE_PREFIXES } from "../services/replicate.js";
import { run } from "../db/client.js";

const router = Router();

router.post(
  "/",
  requireAuth,
  generateRateLimit,
  quotaCheck((req) => req.body?.model),
  async (req, res) => {
    try {
      const {
        prompt: rawPrompt,
        negative_prompt,
        model,
        aspect_ratio = "1:1",
        style = "none",
        guidance,
        seed,
      } = req.body || {};

      if (!rawPrompt || typeof rawPrompt !== "string") {
        return res.status(400).json({ error: "prompt_required" });
      }
      if (!model || !["schnell", "dev"].includes(model)) {
        return res.status(400).json({ error: "invalid_model" });
      }
      const validAspects = ["1:1", "16:9", "9:16", "21:9", "9:21", "4:3", "3:4", "4:5", "5:4", "3:2", "2:3"];
      if (!validAspects.includes(aspect_ratio)) {
        return res.status(400).json({ error: "invalid_aspect_ratio" });
      }
      const validStyles = Object.keys(STYLE_PREFIXES);
      if (!validStyles.includes(style)) {
        return res.status(400).json({ error: "invalid_style" });
      }

      const prompt = sanitizePrompt(rawPrompt);
      if (!prompt) {
        return res.status(400).json({ error: "prompt_invalid" });
      }

      const neg = negative_prompt ? sanitizePrompt(String(negative_prompt), 500) : "";
      const input = buildFluxInput(model, {
        prompt,
        negative_prompt: neg,
        aspect_ratio,
        style,
        guidance: guidance != null ? Number(guidance) : undefined,
        seed: seed != null ? Number(seed) : undefined,
      });

      const prediction = await createPrediction(model, input);
      const jobId = prediction.id;
      const params = JSON.stringify({
        aspect_ratio,
        style,
        guidance,
        seed,
        negative_prompt: neg,
      });
      const costCredits = model === "dev" ? 25 : 1;

      await run(
        `INSERT INTO usage_log (user_id, job_id, model, prompt, params, status, cost_credits)
         VALUES ($1, $2, $3, $4, $5, 'pending', $6)`,
        [req.session.userId, jobId, model, prompt, params, costCredits]
      );

      return res.json({ jobId, status: "pending" });
    } catch (e) {
      console.error(e);
      if (e?.status === 429 || e?.response?.status === 429) {
        return res.status(429).json({ error: "replicate_rate_limited" });
      }
      return res.status(500).json({ error: "generate_failed" });
    }
  }
);

export default router;
