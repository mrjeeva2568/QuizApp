# Deployment Guide

## Architecture

```
Browser ──HTTPS──▶ Frontend (static SPA: Vercel/Netlify/S3+CloudFront/Nginx)
                          │
                          │ HTTPS (Axios, JWT in Authorization header)
                          ▼
                    Backend (Spring Boot, any Java-capable host/container)
                          │                          │
                          │ mongodb+srv:// (TLS)      │ HTTPS (OAuth2 or static key)
                          ▼                          ▼
                    MongoDB Atlas                UiPath Agent (Automation Cloud)
```

Three independently-deployable pieces. The frontend never talks to MongoDB
or UiPath directly — everything goes through the backend.

## Prerequisites

- A MongoDB Atlas cluster (free tier is enough to start)
- A hosting target for the backend (anything that runs a Java 21 process or
  a Docker container — Render, Railway, Fly.io, AWS ECS/Elastic Beanstalk,
  Azure App Service, a plain VM, etc.)
- A hosting target for the frontend (any static host — Vercel, Netlify,
  S3+CloudFront, or the included Nginx Docker image)
- UiPath Agent credentials (client ID/secret or API key, agent endpoint URL)
- A domain (or subdomains) for both frontend and backend, with HTTPS —
  most static hosts and PaaS backends provision TLS automatically; if
  self-hosting, put both behind a reverse proxy/load balancer that terminates
  TLS (Caddy, Nginx + Let's Encrypt, or your cloud provider's LB)

## Environment variables

**Every value below must be supplied via real environment variables in your
hosting platform's secret/config management — never commit real values.**
Both `application.properties.example` (backend) and `.env.example` /
`.env.production.example` (frontend) are templates only.

### Backend

| Variable | Required | Notes |
|---|---|---|
| `MONGODB_URI` | Yes | Full `mongodb+srv://` connection string, see MongoDB Atlas section below |
| `JWT_SECRET` | Yes | Base64, ≥256 bits. Generate: `openssl rand -base64 32`. **Never reuse the dev secret in prod.** |
| `JWT_ACCESS_EXP_MS` | No | Default 3,600,000 (1 hour) |
| `JWT_REFRESH_EXP_MS` | No | Default 604,800,000 (7 days) |
| `CORS_ALLOWED_ORIGINS` | Yes | Your deployed frontend's exact origin, e.g. `https://app.examquizai.com`. Never `*` in production (see security checklist) |
| `ADMIN_SEED_ENABLED` | Recommended | `true` on first deploy, then consider `false` afterward |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Yes (if seeding) | The one bootstrap admin account — see backend README for how this works |
| `ADMIN_FULL_NAME` | No | Display name for the bootstrap admin |
| `UIPATH_BASE_URL` | Yes | Base URL of the UiPath Agent REST API |
| `UIPATH_AGENT_ENDPOINT` | Yes | Path to your specific published agent |
| `UIPATH_TOKEN_URL` | Conditional | OAuth2 token endpoint; omit for static-API-key mode |
| `UIPATH_TENANT_NAME` | Conditional | Required if your UiPath setup uses tenant-scoped auth |
| `UIPATH_CLIENT_ID` | Conditional | Required for OAuth2 mode |
| `UIPATH_CLIENT_SECRET` | Yes | OAuth2 secret, or the static bearer token if `UIPATH_TOKEN_URL` is unset |
| `UIPATH_SCOPE` | No | OAuth2 scope, if your identity server requires one |
| `SWAGGER_ENABLED` | No | Default `false` in the prod profile — see `application-prod.properties.example` |
| `SPRING_PROFILES_ACTIVE` | Recommended | Set to `prod` to activate `application-prod.properties` overrides |

### Frontend

| Variable | Required | Notes |
|---|---|---|
| `VITE_API_BASE_URL` | Yes | Public HTTPS URL of your deployed backend. **Baked in at build time** — see `.env.production.example` for why this can never hold a secret |

## MongoDB Atlas setup

1. Create a cluster (Atlas free tier M0 is sufficient to start; upgrade as load grows).
2. **Database Access** → create a user dedicated to this app (not the Atlas
   organization admin). Grant it `readWrite` scoped to the `examquizai`
   database only — not `atlasAdmin`, not project-wide access.
3. **Network Access** → add the IP address(es) or CIDR range of wherever
   your backend runs. Avoid `0.0.0.0/0` in production if your host has a
   stable, known egress IP; if it doesn't (common on serverless/PaaS
   platforms with dynamic IPs), restrict as tightly as the platform allows
   and rely on the dedicated DB user's limited privileges as the real
   boundary.
4. Copy the `mongodb+srv://` connection string from **Connect → Drivers**,
   substitute your app user's credentials, and set it as `MONGODB_URI`.
   `mongodb+srv://` connections use TLS by default — no extra config needed.
5. Enable Atlas's built-in backup (even the free continuous backup tier is
   better than nothing) before real user data accumulates.

## Deploying the backend

### Option A — Docker (recommended, portable across hosts)

```bash
docker build -t examquiz-backend ./backend
docker run -p 8080:8080 \
  -e MONGODB_URI="mongodb+srv://..." \
  -e JWT_SECRET="..." \
  -e CORS_ALLOWED_ORIGINS="https://app.examquizai.com" \
  -e ADMIN_EMAIL="admin@examquizai.com" \
  -e ADMIN_PASSWORD="..." \
  -e UIPATH_BASE_URL="..." \
  -e UIPATH_AGENT_ENDPOINT="..." \
  -e UIPATH_CLIENT_SECRET="..." \
  -e SPRING_PROFILES_ACTIVE=prod \
  examquiz-backend
```

Push the built image to your registry of choice (Docker Hub, ECR, GCR,
GHCR) and point your host's container service at it. The `Dockerfile`
already runs as a non-root user and exposes an Actuator-backed
`HEALTHCHECK` most orchestrators will pick up automatically for
liveness/readiness probes.

### Option B — plain JAR

```bash
cd backend
mvn clean package -DskipTests
java -jar target/examquiz-backend-*.jar
```

Works anywhere with a Java 21 runtime. Set the same environment variables
as above before starting the process (or via your platform's env-config UI).

## Deploying the frontend

The frontend is a static build (`npm run build` → `dist/`) — deploy it to
any static host. **Whichever host you choose, it must serve `index.html` for
every path**, not just `/`: this is a client-side-routed SPA (React
Router's `BrowserRouter`), so a request to e.g. `/admin/students` needs the
webserver to still return `index.html` and let React Router take over,
rather than 404ing because no literal file exists at that path.

### Option A — Vercel

```bash
cd frontend
vercel --prod
```

`vercel.json` (already included) handles the SPA rewrite. Set
`VITE_API_BASE_URL` in Vercel's project environment variables — Vercel runs
the build itself, so the var must be configured there, not just in a local
`.env` file.

### Option B — Netlify

Connect the repo, set build command `npm run build`, publish directory
`dist`. `public/_redirects` (already included, copied into `dist/` by Vite
automatically) handles the SPA rewrite. Set `VITE_API_BASE_URL` in Netlify's
site environment variables.

### Option C — Docker + Nginx (self-hosted)

```bash
docker build -t examquiz-frontend \
  --build-arg VITE_API_BASE_URL=https://api.examquizai.com \
  ./frontend
docker run -p 80:80 examquiz-frontend
```

`nginx.conf` (already included) handles the SPA fallback, gzip, and basic
security headers. `VITE_API_BASE_URL` must be passed as a build arg (not a
runtime env var) — Vite bakes it into the JS bundle at build time, so
setting it after the image is built has no effect.

### Option D — S3 + CloudFront

Upload `dist/` to an S3 bucket, front it with CloudFront. Configure
CloudFront's **custom error response** for both 403 and 404 to return
`/index.html` with a `200` status — this is S3+CloudFront's equivalent of
the Nginx `try_files`/Netlify `_redirects` SPA fallback.

## After deploying: verification checklist

- [ ] `GET https://your-backend/actuator/health` returns `{"status":"UP"}`
- [ ] `POST /api/v1/auth/register` creates a STUDENT account; the JWT it
      returns successfully authenticates a follow-up `GET /api/v1/users/me`
- [ ] Log in as the bootstrap admin (`ADMIN_EMAIL`/`ADMIN_PASSWORD`) and
      confirm `GET /api/admin/dashboard` returns data
- [ ] From the deployed frontend (not localhost), confirm login/register
      actually reach the backend — a CORS misconfiguration will show as a
      browser console error, not a visible UI error
- [ ] Refresh the browser on a non-root route (e.g. `/dashboard`) — a blank
      page or 404 here means the SPA fallback isn't configured on your host
- [ ] Generate a quiz end-to-end to confirm the UiPath credentials are correct
- [ ] Confirm Swagger UI is unreachable at `/swagger-ui.html` unless you
      explicitly set `SWAGGER_ENABLED=true`
- [ ] Rotate `ADMIN_PASSWORD` if the bootstrap value was ever typed in
      plaintext anywhere (chat, ticket, Slack) during setup

## Rollback

Both Docker images are tagged builds — keep the previous image tag around
and `docker run`/redeploy it if a release misbehaves. For the JAR route,
keep the previous `target/*.jar` archived somewhere outside the build
directory. Database migrations aren't a concern here (MongoDB is schemaless
and this app has no migration framework), but a Mongo Atlas backup
snapshot from just before a risky deploy is cheap insurance regardless.

## Best practices applied in this build

- **Every secret is environment-variable-only** — nothing in `pom.xml`,
  `package.json`, or any committed file holds a real credential; only
  `.example` templates are committed.
- **The bootstrap admin is the only way an ADMIN account is created** — no
  public admin-registration endpoint exists (see backend README).
- **CORS is explicit, not wildcarded** — `CORS_ALLOWED_ORIGINS` must name
  your real frontend origin.
- **Errors never leak internals** — `GlobalExceptionHandler` returns generic
  messages to clients; full exceptions are only logged server-side.
- **Frontend secrets don't exist by design** — auth is JWT-in-header, so
  there's nothing sensitive a `VITE_` build-time variable could ever need to hold.
- **Non-root containers** — both Dockerfiles run their process as an
  unprivileged user, not root.
- **Multi-stage Docker builds** — build tooling (Maven, Node/npm) never
  ships in the runtime image; only the compiled artifact does.
- **Immutable, hashed static assets** — Vite's hashed filenames let
  `nginx.conf` cache JS/CSS for a year safely; a new deploy naturally
  produces new hashes, so there's no stale-cache risk.
- **CI runs the same build/lint/test commands documented here** — the
  GitHub Actions workflows aren't a separate, drifting definition of "works."

See `SECURITY_CHECKLIST.md` for the security-specific pass, including known
gaps and recommended (not yet implemented) hardening.
