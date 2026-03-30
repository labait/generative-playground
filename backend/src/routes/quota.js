import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getQuotaStatus } from "../services/quota.js";

const router = Router();

router.get("/me", requireAuth, async (req, res) => {
  if (req.session.role === "admin") {
    return res.json({
      standard: { used: 0, total: null, remaining: null },
      hires: { used: 0, total: null, remaining: null },
      resetDate: null,
      unlimited: true,
    });
  }
  const q = await getQuotaStatus(req.session.userId);
  res.json({ ...q, unlimited: false });
});

export default router;
