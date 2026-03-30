# LABA AI Image Studio — Implementation Plan
> Feed this document to Cursor with model `claude-opus-4-6` as the primary context.

---

## Project Overview

Build a web-based AI image generation platform for LABA academy students. Students log in with their Microsoft institutional account, generate images via a Midjourney-like interface, and are subject to per-student monthly quotas enforced server-side. The system uses FLUX.1 models via Replicate API for image generation.

**Stack:**
- Frontend: React + Vite + TailwindCSS
- Backend: Node.js + Express
- Auth: Microsoft Entra ID (Azure AD) via OAuth 2.0 / MSAL
- Quota/Governance: New-API (self-hosted, Docker)
- Image Generation: Replicate API (FLUX.1-schnell + FLUX.1-dev)
- Upscale: Real-ESRGAN via Replicate
- Reverse Proxy: Caddy with automatic HTTPS
- Infrastructure: Single VPS Linux (Ubuntu 24), Docker Compose

---

## Repository Structure

```
laba-ai-studio/
├── docker-compose.yml
├── caddy/
│   └── Caddyfile
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── src/
│   │   ├── index.js              # Express entry point
│   │   ├── auth/
│   │   │   └── microsoft.js      # MSAL config + OAuth routes
│   │   ├── routes/
│   │   │   ├── generate.js       # POST /api/generate
│   │   │   ├── upscale.js        # POST /api/upscale
│   │   │   ├── jobs.js           # GET /api/jobs/:id (polling)
│   │   │   ├── quota.js          # GET /api/quota/me
│   │   │   └── admin.js          # Admin routes (quota mgmt)
│   │   ├── middleware/
│   │   │   ├── auth.js           # JWT session validation
│   │   │   ├── quota.js          # Quota enforcement middleware
│   │   │   └── rateLimit.js      # Per-IP rate limiting
│   │   ├── services/
│   │   │   ├── replicate.js      # Replicate API wrapper
│   │   │   └── quota.js          # Quota read/write logic
│   │   └── db/
│   │       ├── schema.sql        # SQLite schema
│   │       └── client.js         # better-sqlite3 client
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── components/
│       │   ├── PromptBox.jsx     # Main prompt input + params
│       │   ├── ParamBar.jsx      # Ratio, style, chaos, stylize sliders
│       │   ├── ModeToggle.jsx    # Relax / Fast toggle
│       │   ├── Gallery.jsx       # Image grid
│       │   ├── ImageCard.jsx     # Single result with U/V buttons
│       │   ├── ImageModal.jsx    # Fullscreen view + actions
│       │   ├── QuotaBar.jsx      # Live quota display
│       │   └── AdminPanel.jsx    # Admin-only quota management UI
│       ├── hooks/
│       │   ├── useAuth.js        # Auth state + MSAL
│       │   ├── useGenerate.js    # Generation + polling logic
│       │   └── useQuota.js       # Quota fetch + cache
│       └── lib/
│           └── api.js            # Fetch wrapper with auth headers
```

---

## 1. Infrastructure — docker-compose.yml

```yaml
version: '3.9'

services:
  caddy:
    image: caddy:2-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./caddy/Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - backend
      - frontend

  backend:
    build: ./backend
    environment:
      - NODE_ENV=production
      - PORT=3001
      - DATABASE_PATH=/data/db.sqlite
      - REPLICATE_API_TOKEN=${REPLICATE_API_TOKEN}
      - AZURE_CLIENT_ID=${AZURE_CLIENT_ID}
      - AZURE_TENANT_ID=${AZURE_TENANT_ID}
      - AZURE_CLIENT_SECRET=${AZURE_CLIENT_SECRET}
      - SESSION_SECRET=${SESSION_SECRET}
      - FRONTEND_URL=https://ai.laba.edu
    volumes:
      - backend_data:/data
    restart: unless-stopped

  frontend:
    build: ./frontend
    environment:
      - VITE_API_URL=https://ai.laba.edu/api
      - VITE_AZURE_CLIENT_ID=${AZURE_CLIENT_ID}
      - VITE_AZURE_TENANT_ID=${AZURE_TENANT_ID}
    restart: unless-stopped

volumes:
  caddy_data:
  caddy_config:
  backend_data:
```

---

## 2. Caddyfile

```
ai.laba.edu {
  handle /api/* {
    reverse_proxy backend:3001
  }
  handle {
    reverse_proxy frontend:80
  }
}
```

---

## 3. Database Schema (SQLite)

```sql
-- Users (populated on first Microsoft SSO login)
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  microsoft_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  role TEXT DEFAULT 'student',        -- 'student' | 'admin'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME
);

-- Quota configuration per user (or defaults from group)
CREATE TABLE quota_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  standard_monthly INTEGER DEFAULT 200,   -- FLUX.1-schnell images
  hires_monthly INTEGER DEFAULT 20,       -- FLUX.1-dev images
  reset_day INTEGER DEFAULT 1,            -- Day of month for reset
  active INTEGER DEFAULT 1
);

-- Usage tracking
CREATE TABLE usage_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) NOT NULL,
  job_id TEXT NOT NULL,
  model TEXT NOT NULL,                    -- 'schnell' | 'dev' | 'upscale'
  prompt TEXT,
  params TEXT,                            -- JSON: aspect_ratio, style, chaos, stylize
  status TEXT DEFAULT 'pending',          -- 'pending' | 'processing' | 'succeeded' | 'failed'
  image_url TEXT,
  cost_credits INTEGER DEFAULT 1,         -- 1 for standard, 25 for hires
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME
);

-- Monthly quota consumption (pre-aggregated for performance)
CREATE TABLE quota_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) NOT NULL,
  month TEXT NOT NULL,                    -- 'YYYY-MM'
  standard_used INTEGER DEFAULT 0,
  hires_used INTEGER DEFAULT 0,
  UNIQUE(user_id, month)
);
```

---

## 4. Backend — Key Implementations

### 4.1 Microsoft OAuth (src/auth/microsoft.js)

Use `@azure/msal-node` for the OAuth 2.0 Authorization Code flow.

```javascript
// Required env vars:
// AZURE_CLIENT_ID, AZURE_TENANT_ID, AZURE_CLIENT_SECRET

// Routes to implement:
// GET  /auth/login          → redirect to Microsoft login
// GET  /auth/callback       → handle code, create session, redirect to frontend
// GET  /auth/logout         → destroy session
// GET  /auth/me             → return current user from session

// On successful callback:
// 1. Exchange code for tokens via MSAL
// 2. Decode id_token to get: oid (microsoft_id), email, displayName
// 3. Upsert user in DB (create if first login, update last_login)
// 4. Create session with: { userId, email, role, microsoftId }
// 5. Redirect to frontend with session cookie
```

**Azure App Registration requirements:**
- Redirect URI: `https://ai.laba.edu/auth/callback`
- Supported account types: `Accounts in this organizational directory only (LABA only - Single tenant)`
- Scopes: `openid`, `profile`, `email`, `User.Read`

### 4.2 Quota Middleware (src/middleware/quota.js)

```javascript
// Called before every /api/generate and /api/upscale request
// Logic:
// 1. Get userId from session
// 2. Get current month string: YYYY-MM
// 3. Fetch quota_usage for (userId, month) — create row if not exists
// 4. Fetch quota_config for userId
// 5. Determine model type from request body: 'schnell' | 'dev'
// 6. If model === 'schnell': check standard_used < standard_monthly
// 7. If model === 'dev': check hires_used < hires_monthly
// 8. If over quota: return 429 { error: 'quota_exceeded', type: 'standard'|'hires' }
// 9. If ok: call next()
// NOTE: do NOT increment here — increment only on job success (in generate route)
```

### 4.3 Generate Route (src/routes/generate.js)

```javascript
// POST /api/generate
// Body: { prompt, negative_prompt, model, aspect_ratio, style, chaos, stylize }

// model values:
//   'schnell'  → "black-forest-labs/flux-schnell"
//   'dev'      → "black-forest-labs/flux-dev"

// Replicate input mapping:
const replicateInput = {
  prompt: `${prompt} --ar ${aspect_ratio} --style ${style} --chaos ${chaos} --stylize ${stylize}`,
  negative_prompt: negative_prompt || '',
  aspect_ratio: aspect_ratio,              // e.g. "16:9"
  output_format: 'webp',
  output_quality: 90,
  num_outputs: 1,
  // For flux-dev only:
  guidance: 3.5,
  num_inference_steps: model === 'dev' ? 28 : 4
}

// Flow:
// 1. Validate input
// 2. Call quota middleware (already called via Express middleware chain)
// 3. Create prediction via Replicate: replicate.predictions.create({ version, input })
// 4. Insert usage_log row with status 'pending', job_id = prediction.id
// 5. Return { jobId: prediction.id, status: 'pending' }
// 6. Client polls GET /api/jobs/:jobId

// On job completion (checked during polling):
// 7. Update usage_log status + image_url
// 8. Increment quota_usage (standard_used or hires_used += 1)
```

### 4.4 Jobs Polling (src/routes/jobs.js)

```javascript
// GET /api/jobs/:jobId
// 1. Fetch prediction from Replicate: replicate.predictions.get(jobId)
// 2. Map Replicate status: starting|processing → 'processing', succeeded → 'succeeded', failed → 'failed'
// 3. If succeeded: update usage_log, increment quota_usage
// 4. Return { status, progress, imageUrl, error }
// NOTE: Replicate does not provide % progress for FLUX — return indeterminate progress
```

### 4.5 Quota Route (src/routes/quota.js)

```javascript
// GET /api/quota/me
// Returns current user's quota status:
{
  standard: { used: 47, total: 200, remaining: 153 },
  hires: { used: 3, total: 20, remaining: 17 },
  resetDate: '2026-04-01'
}
```

### 4.6 Admin Routes (src/routes/admin.js)

```javascript
// All routes require role === 'admin' middleware

// GET  /api/admin/users               → list all users with quota status
// PUT  /api/admin/users/:id/quota     → update quota_config for user
//   Body: { standard_monthly, hires_monthly }
// PUT  /api/admin/users/:id/role      → change role (student/admin)
// POST /api/admin/users/:id/reset     → reset current month quota to 0
// GET  /api/admin/stats               → aggregate usage stats
```

---

## 5. Replicate Service (src/services/replicate.js)

```javascript
import Replicate from 'replicate'

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })

const MODELS = {
  schnell: 'black-forest-labs/flux-schnell',
  dev: 'black-forest-labs/flux-dev',
  upscale: 'nightmareai/real-esrgan:350d32041630ffbe63c8352783a26d94126809164e684b54e23b5c3d4aa7b4b0'
}

export async function createPrediction(model, input) {
  return replicate.predictions.create({
    model: MODELS[model],
    input
  })
}

export async function getPrediction(id) {
  return replicate.predictions.get(id)
}
```

---

## 6. Frontend — Key Components

### 6.1 useGenerate hook (hooks/useGenerate.js)

```javascript
// State: jobs[] — array of { jobId, status, imageUrl, prompt, params, model }
// 
// generateImage(params):
//   1. POST /api/generate
//   2. Add job to jobs[] with status 'pending'
//   3. Start polling interval (every 2s)
//   4. On each poll: GET /api/jobs/:jobId
//   5. Update job in state
//   6. If succeeded/failed: clear interval
//
// Polling interval: 2000ms
// Timeout: 300000ms (5 min) — mark as failed if exceeded
```

### 6.2 PromptBox component

```jsx
// Props: onGenerate(params)
// State: prompt, negativePrompt, aspectRatio, style, chaos, stylize, mode ('relax'|'fast')
// 
// mode mapping:
//   'relax' → model: 'schnell'
//   'fast'  → model: 'dev'
//
// On submit: call onGenerate({ prompt, negativePrompt, model, aspectRatio, style, chaos, stylize })
// Keyboard: Cmd/Ctrl+Enter to submit
//
// Aspect ratio options: 1:1, 16:9, 4:3, 3:4, 9:16, 2:3, 3:2
// Style options: raw, expressive, cute, scenic (mapped to Replicate style param)
// Chaos: range 0–100
// Stylize: range 0–1000, step 50
```

### 6.3 ImageCard component

```jsx
// Props: job (jobId, status, imageUrl, prompt, params, model)
//
// States:
//   pending/processing → show spinner + indeterminate progress animation
//   succeeded → show image with hover overlay
//   failed → show error state with retry button
//
// Hover overlay shows:
//   - Prompt preview (2 lines max, truncated)
//   - U1 U2 U3 U4 buttons → trigger upscale (opens upscaled image in modal)
//   - V1 V2 V3 V4 buttons → trigger variation (new generation with slight prompt variation)
//
// U button behavior: POST /api/upscale { imageUrl } → poll → open in modal
// V button behavior: POST /api/generate { ...originalParams, seed: random } 
```

### 6.4 AdminPanel component

```jsx
// Only rendered if user.role === 'admin'
// Accessible via sidebar icon
//
// Features:
//   - User list with search
//   - Per-user quota status (used/total for standard + hires)
//   - Inline edit quota limits
//   - Reset month button per user
//   - Aggregate stats: total generations today/week/month
//   - Export usage CSV
```

---

## 7. Auth Flow (Frontend)

Use `@azure/msal-browser` for the frontend auth redirect.

```javascript
// On app load:
// 1. GET /auth/me → if 200: user is logged in, store in context
// 2. If 401: show login screen with "Accedi con Microsoft" button
// 3. Button click: redirect to /auth/login (backend handles MSAL redirect)
// 4. After OAuth callback: backend sets httpOnly session cookie, redirects to /
// 5. Frontend reloads, GET /auth/me succeeds

// Session: httpOnly cookie, 8h expiry, secure, sameSite: lax
// No JWT stored in localStorage
```

---

## 8. Environment Variables

```env
# Backend .env
REPLICATE_API_TOKEN=r8_xxxx
AZURE_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_CLIENT_SECRET=xxxx
SESSION_SECRET=generate-with-openssl-rand-hex-32
DATABASE_PATH=/data/db.sqlite
PORT=3001
FRONTEND_URL=https://ai.laba.edu
NODE_ENV=production

# Frontend .env
VITE_API_URL=https://ai.laba.edu/api
VITE_AZURE_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
VITE_AZURE_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

---

## 9. Default Quota Configuration

```javascript
// Applied to all new users on first login
const DEFAULT_QUOTA = {
  standard_monthly: 200,   // FLUX.1-schnell (Relax mode)
  hires_monthly: 20,       // FLUX.1-dev (Fast mode)
  reset_day: 1             // Reset on 1st of each month
}

// Admin users: unlimited (bypass quota middleware if role === 'admin')
```

---

## 10. Security Checklist

- [ ] All `/api/*` routes require valid session (auth middleware)
- [ ] All `/api/admin/*` routes require `role === 'admin'`
- [ ] Session cookie: `httpOnly: true`, `secure: true`, `sameSite: 'lax'`
- [ ] Input sanitization on prompt (max 2000 chars, strip HTML)
- [ ] Rate limiting: 10 req/min per IP on `/api/generate`
- [ ] Replicate API token never exposed to frontend
- [ ] Image URLs proxied through backend (never expose Replicate URLs directly)
- [ ] CORS: allow only `https://ai.laba.edu`
- [ ] Azure App Registration: single-tenant (LABA only)

---

## 11. Implementation Order

1. **Docker Compose + Caddy** — get infrastructure running locally
2. **Database schema** — SQLite with better-sqlite3
3. **Microsoft OAuth** — login/callback/session/me routes
4. **Replicate service** — createPrediction + getPrediction wrappers
5. **Generate + Jobs routes** — core generation flow with polling
6. **Quota middleware + routes** — enforcement + status endpoint
7. **Frontend auth** — login screen + session management
8. **Frontend generate flow** — PromptBox + useGenerate + polling
9. **Gallery + ImageCard** — display results, U/V actions
10. **QuotaBar** — live display in header
11. **Admin panel** — user list + quota management
12. **Upscale** — Real-ESRGAN integration
13. **Production deploy** — VPS setup, DNS, Caddy HTTPS

---

## 12. Notes for Cursor

- Use `better-sqlite3` (synchronous, no async complexity for a small VPS)
- Use `express-session` with `connect-sqlite3` for session persistence
- Replicate predictions are async — the frontend must poll. Do NOT use webhooks (requires public URL during dev)
- FLUX.1-schnell has no `guidance` param — only flux-dev does
- Image output from Replicate is a temporary URL — download and store locally or on object storage before returning to client. Do NOT return Replicate URLs directly to the frontend (they expire)
- For local dev: use `ngrok` or `cloudflared tunnel` to test Microsoft OAuth callback
- The `chaos` and `stylize` params are Midjourney-specific — map them to Replicate equivalents: chaos → `variation_seed` range, stylize → `guidance` scale adjustment
- Start with `flux-schnell` only to validate the full pipeline, add `flux-dev` after
