import { Router } from "express";
import { requireAdmin } from "../middleware/auth.js";
import { getOne, getAll, run } from "../db/client.js";
import { currentMonthString, ensureQuotaConfig, ensureQuotaUsageRow } from "../services/quota.js";

const router = Router();

router.use(requireAdmin);

router.get("/users", async (req, res) => {
  const month = currentMonthString();
  const rows = await getAll(
    `SELECT u.id, u.email, u.display_name, u.role, u.created_at,
            qc.standard_monthly, qc.hires_monthly,
            COALESCE(qu.standard_used, 0) AS standard_used,
            COALESCE(qu.hires_used, 0) AS hires_used
     FROM users u
     LEFT JOIN quota_config qc ON qc.user_id = u.id AND qc.active = TRUE
     LEFT JOIN quota_usage qu ON qu.user_id = u.id AND qu.month = $1
     ORDER BY u.email ASC`,
    [month]
  );
  res.json({ users: rows });
});

router.put("/users/:id/quota", async (req, res) => {
  const id = Number(req.params.id);
  const { standard_monthly, hires_monthly } = req.body || {};
  const sm = Number(standard_monthly);
  const hm = Number(hires_monthly);
  if (!Number.isFinite(id) || !Number.isFinite(sm) || !Number.isFinite(hm)) {
    return res.status(400).json({ error: "invalid_body" });
  }
  if (sm < 0 || hm < 0 || sm > 100000 || hm > 100000) {
    return res.status(400).json({ error: "quota_out_of_range" });
  }
  await ensureQuotaConfig(id);
  await run(
    `UPDATE quota_config SET standard_monthly = $1, hires_monthly = $2 WHERE user_id = $3 AND active = TRUE`,
    [sm, hm, id]
  );
  res.json({ ok: true });
});

router.put("/users/:id/role", async (req, res) => {
  const id = Number(req.params.id);
  const { role } = req.body || {};
  if (!Number.isFinite(id) || !["student", "admin"].includes(role)) {
    return res.status(400).json({ error: "invalid_body" });
  }
  await run(`UPDATE users SET role = $1 WHERE id = $2`, [role, id]);
  res.json({ ok: true });
});

router.post("/users/:id/reset", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: "invalid_id" });
  }
  const month = currentMonthString();
  await ensureQuotaUsageRow(id, month);
  await run(
    `UPDATE quota_usage SET standard_used = 0, hires_used = 0 WHERE user_id = $1 AND month = $2`,
    [id, month]
  );
  res.json({ ok: true });
});

router.get("/stats", async (req, res) => {
  const month = currentMonthString();
  const totalUsersRow = await getOne(`SELECT COUNT(*) AS c FROM users`);
  const usageThisMonth = await getOne(
    `SELECT SUM(standard_used) AS s, SUM(hires_used) AS h FROM quota_usage WHERE month = $1`,
    [month]
  );
  const jobsTodayRow = await getOne(
    `SELECT COUNT(*) AS c FROM usage_log WHERE created_at::date = CURRENT_DATE AND status = 'succeeded'`
  );
  res.json({
    totalUsers: Number(totalUsersRow?.c || 0),
    month,
    standardUsedSum: Number(usageThisMonth?.s || 0),
    hiresUsedSum: Number(usageThisMonth?.h || 0),
    succeededJobsToday: Number(jobsTodayRow?.c || 0),
  });
});

export default router;
