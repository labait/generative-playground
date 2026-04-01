import { Router } from "express";
import { ConfidentialClientApplication } from "@azure/msal-node";
import { getOne, run } from "../db/client.js";
import { authLimiter } from "../middleware/rateLimit.js";

const router = Router();

router.use(authLimiter);

function getRedirectUri() {
  if (process.env.OAUTH_REDIRECT_URI) return process.env.OAUTH_REDIRECT_URI;
  const base = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
  return `${base}/auth/callback`;
}

function getMsal() {
  const clientId = process.env.AZURE_CLIENT_ID;
  const tenantId = process.env.AZURE_TENANT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;
  if (!clientId || !tenantId || !clientSecret) {
    return null;
  }
  return new ConfidentialClientApplication({
    auth: {
      clientId,
      authority: `https://login.microsoftonline.com/consumers`,
      clientSecret,
    },
  });
}

const SCOPES = ["openid", "profile", "email", "User.Read"];

function isBootstrapAdmin(email) {
  const raw = process.env.BOOTSTRAP_ADMIN_EMAILS || "";
  const set = new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );
  return set.has((email || "").toLowerCase());
}

router.get("/login", async (req, res) => {
  const cca = getMsal();
  if (!cca) {
    return res.status(503).send("Azure OAuth is not configured (missing AZURE_* env vars).");
  }
  try {
    const redirectUri = getRedirectUri();
    const authCodeUrl = await cca.getAuthCodeUrl({
      scopes: SCOPES,
      redirectUri,
      prompt: "select_account",
    });
    res.redirect(authCodeUrl);
  } catch (e) {
    console.error(e);
    res.status(500).send("Login failed to start.");
  }
});

router.get("/callback", async (req, res) => {
  const cca = getMsal();
  if (!cca) {
    return res.status(503).send("Azure OAuth is not configured.");
  }
  const code = req.query.code;
  const err = req.query.error;
  if (err) {
    return res.redirect(`${(process.env.FRONTEND_URL || "/").replace(/\/$/, "")}/?error=${encodeURIComponent(String(err))}`);
  }
  if (!code) {
    return res.status(400).send("Missing authorization code.");
  }
  try {
    const redirectUri = getRedirectUri();
    const result = await cca.acquireTokenByCode({
      code: String(code),
      scopes: SCOPES,
      redirectUri,
    });
    const claims = result.idTokenClaims || {};
    const microsoftId = claims.oid || claims.sub;
    const email = (claims.preferred_username || claims.email || claims.upn || "").toLowerCase();
    const displayName = claims.name || email || "User";
    if (!microsoftId || !email) {
      return res.status(400).send("Could not read profile from token.");
    }

    const existing = await getOne("SELECT * FROM users WHERE microsoft_id = $1", [microsoftId]);
    let user;
    if (!existing) {
      const role = isBootstrapAdmin(email) ? "admin" : "student";
      const { rows } = await run(
        `INSERT INTO users (microsoft_id, email, display_name, role, last_login)
         VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
        [microsoftId, email, displayName, role]
      );
      user = rows[0];
      await run(
        `INSERT INTO quota_config (user_id, standard_monthly, hires_monthly, reset_day, active)
         VALUES ($1, 200, 20, 1, TRUE)`,
        [user.id]
      );
    } else {
      let role = existing.role;
      if (isBootstrapAdmin(email)) role = "admin";
      await run(
        `UPDATE users SET email = $1, display_name = $2, role = $3, last_login = NOW() WHERE id = $4`,
        [email, displayName, role, existing.id]
      );
      user = await getOne("SELECT * FROM users WHERE id = $1", [existing.id]);
      const hasCfg = await getOne(
        "SELECT 1 FROM quota_config WHERE user_id = $1 AND active = TRUE",
        [user.id]
      );
      if (!hasCfg) {
        await run(
          `INSERT INTO quota_config (user_id, standard_monthly, hires_monthly, reset_day, active)
           VALUES ($1, 200, 20, 1, TRUE)`,
          [user.id]
        );
      }
    }

    req.session.userId = user.id;
    req.session.email = user.email;
    req.session.displayName = user.display_name;
    req.session.role = user.role;
    req.session.microsoftId = user.microsoft_id;

    const front = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
    res.redirect(`${front}/`);
  } catch (e) {
    console.error(e);
    res.status(500).send("OAuth callback failed.");
  }
});

router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    const front = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
    res.redirect(`${front}/`);
  });
});

router.get("/me", (req, res) => {
  if (!req.session?.userId) {
    return res.status(401).json({ user: null });
  }
  res.json({
    user: {
      id: req.session.userId,
      email: req.session.email,
      displayName: req.session.displayName,
      role: req.session.role,
    },
  });
});

export default router;
