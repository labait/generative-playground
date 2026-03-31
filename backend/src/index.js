import dotenv from "dotenv";
import { fileURLToPath as _fu } from "url";
import { dirname as _dn, resolve as _rs } from "path";
const __srcDir = _dn(_fu(import.meta.url));
dotenv.config({ path: _rs(__srcDir, "../../.env") });
dotenv.config();
import path from "path";
import fs from "fs";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { fileURLToPath } from "url";

import { initSchema, pool, getOne } from "./db/client.js";
import { requireAuth } from "./middleware/auth.js";

import authMicrosoft from "./auth/microsoft.js";
import generateRoutes from "./routes/generate.js";
import jobsRoutes from "./routes/jobs.js";
import upscaleRoutes from "./routes/upscale.js";
import editRoutes from "./routes/edit.js";
import quotaRoutes from "./routes/quota.js";
import adminRoutes from "./routes/admin.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.set("trust proxy", 1);

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5174",
  "http://127.0.0.1:5174",
].filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
    credentials: true,
  })
);
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

const PgStore = connectPg(session);
const sessionStore = new PgStore({
  pool,
  createTableIfMissing: true,
});

const cookieSecure = process.env.NODE_ENV === "production" && process.env.COOKIE_SECURE !== "false";

app.use(
  session({
    store: sessionStore,
    name: "laba.sid",
    secret: process.env.SESSION_SECRET || "dev-insecure-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: cookieSecure,
      sameSite: "lax",
      maxAge: 8 * 60 * 60 * 1000,
    },
  })
);

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/auth", authMicrosoft);
app.use("/api/generate", generateRoutes);
app.use("/api/jobs", jobsRoutes);
app.use("/api/upscale", upscaleRoutes);
app.use("/api/edit", editRoutes);
app.use("/api/quota", quotaRoutes);
app.use("/api/admin", adminRoutes);

app.get("/media/public/:token", async (req, res) => {
  const row = await getOne("SELECT * FROM usage_log WHERE media_access_token = $1", [req.params.token]);
  if (!row?.local_path || !fs.existsSync(row.local_path)) {
    return res.status(404).end();
  }
  return res.sendFile(path.resolve(row.local_path));
});

app.get("/media/:jobId", requireAuth, async (req, res) => {
  const row = await getOne(
    "SELECT * FROM usage_log WHERE job_id = $1 AND user_id = $2",
    [req.params.jobId, req.session.userId]
  );
  if (!row?.local_path || !fs.existsSync(row.local_path)) {
    return res.status(404).end();
  }
  return res.sendFile(path.resolve(row.local_path));
});

const port = Number(process.env.PORT) || 3001;

async function start() {
  await initSchema();
  app.listen(port, () => {
    console.log(`LABA AI backend listening on :${port}`);
  });
}

start().catch((err) => {
  console.error("Failed to start:", err);
  process.exit(1);
});
