import { checkQuota } from "../services/quota.js";

export function quotaCheck(modelResolver) {
  return async (req, res, next) => {
    if (req.session?.role === "admin") {
      return next();
    }
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const modelType = modelResolver(req);
    if (!modelType || !["schnell", "dev", "upscale", "edit"].includes(modelType)) {
      return res.status(400).json({ error: "invalid_model" });
    }
    const ok = await checkQuota(userId, modelType);
    if (!ok) {
      return res.status(429).json({
        error: "quota_exceeded",
        type: (modelType === "dev" || modelType === "edit") ? "hires" : "standard",
      });
    }
    next();
  };
}
