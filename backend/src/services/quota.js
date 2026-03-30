import { getOne, run } from "../db/client.js";

const DEFAULT_QUOTA = {
  standard_monthly: 200,
  hires_monthly: 20,
  reset_day: 1,
};

export function currentMonthString() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function nextResetDate(resetDay = 1) {
  const now = new Date();
  let y = now.getFullYear();
  let mo = now.getMonth();
  const day = Math.min(resetDay, 28);
  let target = new Date(y, mo, day);
  if (now >= target) {
    mo += 1;
    if (mo > 11) {
      mo = 0;
      y += 1;
    }
    target = new Date(y, mo, day);
  }
  return target.toISOString().slice(0, 10);
}

export async function ensureQuotaConfig(userId) {
  let row = await getOne("SELECT * FROM quota_config WHERE user_id = $1 AND active = TRUE", [userId]);
  if (!row) {
    await run(
      `INSERT INTO quota_config (user_id, standard_monthly, hires_monthly, reset_day, active)
       VALUES ($1, $2, $3, $4, TRUE)`,
      [userId, DEFAULT_QUOTA.standard_monthly, DEFAULT_QUOTA.hires_monthly, DEFAULT_QUOTA.reset_day]
    );
    row = await getOne("SELECT * FROM quota_config WHERE user_id = $1 AND active = TRUE", [userId]);
  }
  return row;
}

export async function ensureQuotaUsageRow(userId, month = currentMonthString()) {
  let row = await getOne("SELECT * FROM quota_usage WHERE user_id = $1 AND month = $2", [userId, month]);
  if (!row) {
    await run(
      `INSERT INTO quota_usage (user_id, month, standard_used, hires_used) VALUES ($1, $2, 0, 0)`,
      [userId, month]
    );
    row = await getOne("SELECT * FROM quota_usage WHERE user_id = $1 AND month = $2", [userId, month]);
  }
  return row;
}

export async function checkQuota(userId, modelType) {
  const cfg = await ensureQuotaConfig(userId);
  const month = currentMonthString();
  const usage = await ensureQuotaUsageRow(userId, month);
  if (modelType === "schnell") {
    return usage.standard_used < cfg.standard_monthly;
  }
  if (modelType === "dev") {
    return usage.hires_used < cfg.hires_monthly;
  }
  if (modelType === "upscale") {
    return usage.standard_used < cfg.standard_monthly;
  }
  return false;
}

export async function incrementQuota(userId, modelType, credits = 1) {
  const month = currentMonthString();
  await ensureQuotaUsageRow(userId, month);
  if (modelType === "schnell" || modelType === "upscale") {
    await run(
      `UPDATE quota_usage SET standard_used = standard_used + $1 WHERE user_id = $2 AND month = $3`,
      [credits, userId, month]
    );
  } else if (modelType === "dev") {
    await run(
      `UPDATE quota_usage SET hires_used = hires_used + $1 WHERE user_id = $2 AND month = $3`,
      [credits, userId, month]
    );
  }
}

export async function getQuotaStatus(userId) {
  const cfg = await ensureQuotaConfig(userId);
  const month = currentMonthString();
  const usage = await ensureQuotaUsageRow(userId, month);
  return {
    standard: {
      used: usage.standard_used,
      total: cfg.standard_monthly,
      remaining: Math.max(0, cfg.standard_monthly - usage.standard_used),
    },
    hires: {
      used: usage.hires_used,
      total: cfg.hires_monthly,
      remaining: Math.max(0, cfg.hires_monthly - usage.hires_used),
    },
    resetDate: nextResetDate(cfg.reset_day || 1),
  };
}
