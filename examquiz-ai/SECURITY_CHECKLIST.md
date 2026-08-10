# Security Checklist

Scannable pass before going live. Checked items are things this build
already does; unchecked items are genuine gaps with a recommended path,
stated plainly rather than glossed over.

## Secrets & configuration

- [x] JWT secret, MongoDB URI, UiPath credentials, and admin bootstrap
      password all come from environment variables — never hardcoded, never
      committed (only `.example` templates are in the repo)
- [x] `UiPathProperties` uses `@Getter`/`@Setter`, deliberately not `@Data` —
      no auto-generated `toString()` that could leak the client secret if the
      object were ever accidentally logged
- [ ] **Generate a fresh `JWT_SECRET` for production** — `openssl rand -base64
      32` — and confirm it differs from whatever was used in development.
      Nothing enforces this automatically; it's a manual step at deploy time.
- [ ] **Rotate `ADMIN_PASSWORD` after first login** if it was ever typed in
      plaintext somewhere outside your secret manager (a ticket, a chat
      message, a terminal shared over screen-share) during setup
- [ ] Put real secrets in your platform's secret manager (not plain env vars
      in a dashboard, where feasible) — AWS Secrets Manager, Doppler, your
      host's built-in encrypted config, etc.

## Authentication & authorization

- [x] Passwords hashed with BCrypt, never stored or logged in plaintext
- [x] JWT access tokens are short-lived (1 hour default); refresh tokens
      longer-lived (7 days default) — both configurable via env vars
- [x] Registration can only ever create `STUDENT` accounts — no client input
      path can request `ADMIN`; the one bootstrap admin comes from
      `AdminAccountInitializer`, driven by `ADMIN_EMAIL`/`ADMIN_PASSWORD`,
      not a public endpoint
- [x] Role checks enforced server-side (`@PreAuthorize("hasRole('ADMIN')")`
      on `AdminController`), not just hidden in the frontend UI — a
      `STUDENT` JWT gets a real `403` against admin endpoints, not just a
      hidden nav link
- [ ] **No brute-force protection on `/api/v1/auth/login`.** Nothing in this
      build rate-limits or locks out repeated failed login attempts.
      Recommended: `bucket4j` (in-process) for a single-instance deploy, or
      your reverse proxy / API gateway / WAF's rate limiting (Cloudflare,
      AWS WAF, Nginx `limit_req`) for anything running behind one — the
      latter is usually less code and easier to tune without a redeploy.
- [ ] **No account lockout after N failed attempts.** `User.accountNonLocked`
      exists as a field but nothing currently sets it to `false`
      automatically — it's only ever toggled indirectly via the admin
      enable/disable endpoint, not by repeated failed logins.

## Transport & network

- [x] MongoDB Atlas connections use `mongodb+srv://`, which is TLS by default
- [x] `SecurityConfig` explicitly configures HSTS (2-year max-age, includes
      subdomains, preload-eligible) for HTTPS requests
- [ ] **HTTPS termination is your responsibility at deploy time** — nothing
      in this codebase terminates TLS itself (that's correct — it shouldn't,
      Spring Boot serving raw TLS in production is unusual). Confirm your
      chosen host/reverse-proxy actually has HTTPS configured; the HSTS
      header above does nothing useful if the connection was never HTTPS in
      the first place.
- [ ] **CORS must be updated from the `.example` default** —
      `CORS_ALLOWED_ORIGINS` defaults to `http://localhost:5173` in the
      template. Set it to your real deployed frontend origin, and only that
      origin — never `*` alongside `allow-credentials=true` (browsers
      reject that combination anyway, but don't rely on the browser to save you).

## Data exposure

- [x] `GlobalExceptionHandler` returns generic messages to clients on
      unexpected errors; full stack traces are only ever logged server-side
- [x] `server.error.include-stacktrace=never` / `include-message=never` /
      `include-binding-errors=never` set explicitly in the prod profile
      (these match Spring Boot's own defaults, but made explicit rather than
      left as an unreviewed default)
- [x] Quiz answer keys are structurally incapable of leaking pre-submission —
      `QuizResponse`/`QuizQuestionPublicResponse`/`QuizOptionPublicResponse`
      have no `correct`/`correctAnswer`/`explanation` fields at all; only
      the post-submission `QuestionAnswerResponse` carries them, populated
      only after grading has actually happened
- [x] Swagger UI / OpenAPI JSON disabled by default in the prod profile
      (`SWAGGER_ENABLED` defaults `false`) — every documented endpoint shape
      is also reconnaissance value for an attacker
- [ ] **No API rate limiting on quiz generation.** `POST /api/quizzes/generate`
      calls out to the UiPath agent, which likely has its own cost/quota —
      nothing here stops a compromised or malicious account from hammering
      it. Same recommended fix as login brute-forcing above.

## Frontend

- [x] No secrets exist in frontend code by design — JWT auth means there's
      nothing sensitive a build-time `VITE_` variable would ever need to hold
- [x] `nginx.conf` sets `X-Content-Type-Options`, `X-Frame-Options: DENY`,
      `Referrer-Policy`, and a `Content-Security-Policy` (self + Google
      Fonts only) for the Docker/self-hosted deployment path
- [ ] **If deploying via Vercel/Netlify instead of the included Nginx
      config, those headers aren't applied automatically** — both platforms
      support custom headers via their own config (`vercel.json` `headers`
      key, Netlify `_headers` file); port the same header set over if you
      choose that path instead of Docker.
- [x] Tokens stored in `localStorage`, not embedded in URLs or logged client-side

## Dependencies

- [ ] **Run `npm audit` and `mvn dependency-check` (or equivalent) before
      first deploy, and periodically after** — neither was run as part of
      this build beyond the incidental `npm audit` output surfaced during
      `npm install` in this sandbox (a handful of moderate/high advisories
      were present in transitive dev-dependencies at time of writing;
      re-check current state before shipping, advisories change over time)
- [ ] Set up Dependabot or Renovate for both `pom.xml` and `package.json` so
      dependency updates aren't a manual, easily-forgotten chore

## Summary of genuine gaps (not implemented, recommended)

1. Rate limiting / brute-force protection on login and quiz generation
2. Automatic account lockout after repeated failed logins
3. Dependency vulnerability scanning as a CI gate (the included workflows
   build/test/lint; they don't currently fail the build on a known CVE)
4. Security headers on non-Docker frontend deploys need porting manually

None of these block a first deployment for a small-to-moderate user base,
but all four are worth addressing before scaling up traffic or handling
higher-stakes data.
