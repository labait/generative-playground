# LABA AI Studio

Web app for LABA students: Microsoft login, FLUX image generation via Replicate, monthly quotas, admin panel.

## Stack

- **Frontend:** React, Vite, TailwindCSS
- **Backend:** Node.js, Express, SQLite (`better-sqlite3`), `express-session` + `connect-sqlite3`
- **Auth:** Microsoft Entra ID (OAuth code flow via `@azure/msal-node`)
- **Images:** Replicate (FLUX Schnell / FLUX Dev, Real-ESRGAN upscale)
- **Deploy:** Docker Compose + Caddy (see `caddy/Caddyfile`)

## Local development

1. Copy `.env.example` to `.env` and fill secrets (at minimum `REPLICATE_API_TOKEN`, `SESSION_SECRET`, Azure app registration values for real login).

2. **Backend** (terminal 1):

   ```bash
   cd backend
   npm install
   cp ../.env .env   # optional: share root .env
   npm run dev
   ```

   Default: `http://127.0.0.1:3001`

3. **Frontend** (terminal 2):

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

   Vite proxies `/api`, `/auth`, and `/media` to the backend.

4. Set `FRONTEND_URL=http://localhost:5173` and register redirect URI `http://localhost:5173/auth/callback` in Azure for OAuth.

5. For upscale after Replicate URLs expire, set `PUBLIC_BASE_URL` to the same origin users use (so Replicate can call `GET /media/public/:token`).

## Build (production assets)

```bash
cd frontend && npm install && npm run build
cd ../backend && npm install && npm start
```

## Docker Compose

```bash
cp .env.example .env
# edit .env — set FRONTEND_URL, PUBLIC_BASE_URL, secrets
docker compose up --build
```

Caddy listens on `:80` (and `443` if you add TLS). Adjust `caddy/Caddyfile` for your domain.

## Documentation

- **[Technical documentation](docs/TECHNICAL.md)** — architecture, API reference, database, auth, env vars, Docker, security.
- **Product / implementation plan:** `LABA-AI-implementation-plan.md`

## Security notes

- Session cookie: `httpOnly`, `sameSite=lax`; set `COOKIE_SECURE=false` only for local HTTP testing.
- Rate limit: 10 `/api/generate` requests per minute per IP.
- Admins bypass quota checks.
- Generated files are served from disk; public fetch tokens are used for Replicate upscale when needed.
