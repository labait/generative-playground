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
import { globalLimiter, publicMediaLimiter } from "./middleware/rateLimit.js";

const IMAGES_DIR = path.resolve(process.env.IMAGES_DIR || path.join(process.cwd(), "data", "images"));

function isSafePath(filePath) {
  const resolved = path.resolve(filePath);
  return resolved.startsWith(IMAGES_DIR + path.sep) || resolved === IMAGES_DIR;
}

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
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  })
);
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
    secret: (() => {
      const s = process.env.SESSION_SECRET;
      if (!s && process.env.NODE_ENV === "production") {
        console.error("FATAL: SESSION_SECRET is required in production");
        process.exit(1);
      }
      return s || "dev-insecure-change-me";
    })(),
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

app.use(globalLimiter);

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/auth", authMicrosoft);
app.use("/api/generate", generateRoutes);
app.use("/api/jobs", jobsRoutes);
app.use("/api/upscale", upscaleRoutes);
app.use("/api/edit", editRoutes);
app.use("/api/quota", quotaRoutes);
app.use("/api/admin", adminRoutes);

app.get("/media/public/:token", publicMediaLimiter, async (req, res) => {
  const token = req.params.token;
  if (!/^[a-f0-9]{48}$/.test(token)) return res.status(400).end();
  const row = await getOne("SELECT * FROM usage_log WHERE media_access_token = $1", [token]);
  if (!row?.local_path || !isSafePath(row.local_path) || !fs.existsSync(row.local_path)) {
    return res.status(404).end();
  }
  return res.sendFile(path.resolve(row.local_path));
});

app.get("/media/:jobId", requireAuth, async (req, res) => {
  const jobId = req.params.jobId;
  if (!/^[a-z0-9][a-z0-9_-]{0,80}$/.test(jobId)) return res.status(400).end();
  const row = await getOne(
    "SELECT * FROM usage_log WHERE job_id = $1 AND user_id = $2",
    [jobId, req.session.userId]
  );
  if (!row?.local_path || !isSafePath(row.local_path) || !fs.existsSync(row.local_path)) {
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
