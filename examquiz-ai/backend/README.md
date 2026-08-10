# ExamQuiz AI — Backend

Spring Boot 3 / Java 21 backend for the ExamQuiz AI platform.

## Scope of this build

This iteration implements the **complete authentication module**:
- Project structure, configuration, security, and global exception handling
- Full JWT authentication flow (register / login / refresh)
- BCrypt password hashing
- Role-based access control with exactly two roles: `STUDENT` and `ADMIN`
- User profile endpoints (protected + role-gated examples)

Quiz, question, exam, result, and AI-agent (UiPath) logic are **placeholders only**
(interfaces/controllers exist to fix package structure and routes, but contain no
business logic yet), per project requirements.

## Roles

| Role      | How the account is created                                             |
|-----------|---------------------------------------------------------------------------|
| `STUDENT` | `POST /api/v1/auth/register` — the **only** role this endpoint ever assigns |
| `ADMIN`   | Auto-provisioned once at startup from `app.admin.*` config (see below). There is no public admin-registration endpoint. |

## Getting started

1. Copy the properties template:
   ```bash
   cp src/main/resources/application.properties.example src/main/resources/application.properties
   ```
2. Fill in your MongoDB Atlas URI, a strong Base64 JWT secret (min 256-bit), and
   the bootstrap admin credentials — via `application.properties` or env vars:
   ```bash
   export MONGODB_URI="mongodb+srv://<user>:<pass>@<cluster>/examquizai?retryWrites=true&w=majority"
   export JWT_SECRET="$(openssl rand -base64 32)"
   export ADMIN_EMAIL="admin@examquizai.com"
   export ADMIN_PASSWORD="a-strong-password-here"
   ```
3. Run:
   ```bash
   mvn spring-boot:run
   ```
   On first boot, `AdminAccountInitializer` creates the ADMIN account if one with
   that email doesn't already exist (idempotent — safe to restart).
4. API docs: `http://localhost:8080/swagger-ui.html`

## Key endpoints (implemented)

| Method | Path                     | Auth required   | Description                          |
|--------|--------------------------|-----------------|---------------------------------------|
| POST   | `/api/v1/auth/register`  | No              | Create a new account — always `STUDENT` |
| POST   | `/api/v1/auth/login`     | No              | Authenticate (works for STUDENT or ADMIN), receive tokens |
| POST   | `/api/v1/auth/refresh`   | No              | Exchange a valid refresh token for a new access token |
| GET    | `/api/v1/users/me`       | Yes (any role)  | Protected route — get current user profile |
| PUT    | `/api/v1/users/me`       | Yes (any role)  | Protected route — update current user profile |
| GET    | `/api/v1/users/{id}`     | Yes, `ADMIN` only | Role-gated route — get any user by ID |

## UiPath Agent integration

The UiPath agent is already built and hosted externally; this backend only calls
it over REST via `UiPathAgentService` (implements `AiAgentService`).

| Concern | Where |
|---|---|
| Credentials | `UiPathProperties` (`app.uipath.*`), sourced from env vars only — never hardcoded, never logged, no `@Data`/`toString()` exposure |
| Auth (OAuth2 client-credentials, or static API key if `token-url` is blank) | `UiPathAgentService#authenticate` — token cached in-memory, refreshed 60s before expiry |
| Timeouts | `UiPathWebClientConfig` (connect + read/write at the Netty level) *and* a per-call `.timeout()` at the reactive-chain level |
| Retry | `UiPathAgentService#retrySpec` — exponential backoff, only on 5xx/timeout/network errors; never retries auth failures or 4xx |
| Response validation | `UiPathAgentService#validateAndParse` — checks required fields exist *before* trusting the JSON, throws `AiAgentValidationException` otherwise |
| JSON → DTO | Same method, via Jackson `ObjectMapper#treeToValue` into `QuizGenerationResponse` |
| Exceptions | `AiAgentException` (base) → `AiAgentAuthenticationException`, `AiAgentTimeoutException` (504), `AiAgentValidationException` — all mapped to safe, generic client-facing messages by `GlobalExceptionHandler` |

**Adjust before going live:** `app.uipath.agent-endpoint` and the request/response
JSON shape in `toAgentPayload()` / `QuizGenerationResponse` are written generically
since the exact contract of your published UiPath agent wasn't provided — align
the field names in `toAgentPayload()` and the expected JSON keys in
`validateAndParse()` with your agent's actual input/output schema.

## Admin module

| Method | Path | What it returns |
|--------|------|------------------|
| GET | `/api/admin/dashboard` | Totals (students/quizzes/attempts), platform-wide weighted average score, last 5 activity items |
| GET | `/api/admin/students?search=&enabled=&page=&size=` | Paginated STUDENT list with per-student attempt count + weighted average score |
| GET | `/api/admin/analytics` | Score-distribution histogram, subject breakdown, 30-day attempt trend, top 5 quizzes |
| PATCH | `/api/admin/students/{id}/status` | Enable/disable one STUDENT account |

All four require `ADMIN` (class-level `@PreAuthorize("hasRole('ADMIN')")` on `AdminController` — a `STUDENT` JWT gets `403`, not `401`, since they're authenticated, just not authorized).

**"Average score" is always weighted**, not an average of percentages:
`sum(score) / sum(maxScore) * 100`, computed in `AdminServiceImpl` from raw
sums returned by the aggregation layer. This keeps a handful of short quizzes
from skewing the figure the way naively averaging per-attempt percentages would.

**Mongo queries used, and why each shape was chosen:**

| Query | Shape | Why |
|---|---|---|
| Student search (`/students`) | `MongoTemplate` + dynamic `Criteria` (`UserRepositoryCustomImpl`) | Search text and status filter are both optional — method-name derivation can't express "maybe this clause, maybe not" cleanly |
| Role/status counts | Derived queries (`countByRolesContaining`, `countByRolesContainingAndEnabled`) | Fixed shape, no optional parts — derivation is the simpler tool here |
| Per-student stats, overall average, score buckets, subject breakdown, daily trend, top quizzes | Aggregation pipelines (`QuizAttemptRepositoryCustomImpl`) | Grouping, joining (`$lookup` against `quizzes` for subject breakdown), and bucketing aren't expressible as derived queries at all |

Every aggregation ends with a `$project` that renames MongoDB's `_id` (the
group key) to a meaningful field — `subject`, `quizId`, `date`, `userId` —
rather than relying on the "`_id` maps to a field literally named `id`"
convention, so the resulting projection classes stay self-documenting.

**One caveat:** the day-bucketing aggregation (`aggregateAttemptsOverTime`)
uses a string-form `$dateToString` SpEL expression that's the commonly
documented pattern for Spring Data MongoDB, but wasn't verified against a
live MongoDB instance in this sandbox — flagged with a comment at the call
site pointing to the fluent `DateOperators` builder as a fallback if it
doesn't behave as expected against your Spring Data MongoDB version.

## Quiz module

| Method | Path | Auth | Reveals correct answers? |
|--------|------|------|---------------------------|
| POST | `/api/quizzes/generate` | Yes | No — `QuizResponse` has no answer-key fields at all |
| GET | `/api/quizzes/{id}` | Yes | No — same `QuizResponse` shape |
| POST | `/api/quizzes/{id}/submit` | Yes | Yes — only for the attempt just graded |
| GET | `/api/quizzes/history` | Yes | No — summary view only (`QuizAttemptSummaryResponse`) |

**Note on path prefix:** these routes intentionally sit at `/api/quizzes/**`,
not `/api/v1/quizzes/**` like the rest of the API, per the exact paths given
in the module spec. They're still protected: `SecurityConfig`'s default rule
authenticates anything not explicitly listed as public, and `/api/quizzes/**`
isn't on that list.

**How "no correct answers before submission" is enforced structurally, not
just by convention:** `QuizResponse` → `QuizQuestionPublicResponse` →
`QuizOptionPublicResponse` have no `correct`/`correctAnswer`/`explanation`
fields anywhere in that DTO chain — there's nothing to accidentally
serialize. Only `QuestionAnswerResponse` (nested in `QuizAttemptResponse`,
returned solely by `submit`) carries `correctOptionIds` / `correctAnswerText`
/ `explanation`, populated only inside `QuizServiceImpl#submitQuiz` after
grading has happened.

**Submission is single-step:** there's no separate "start attempt" endpoint
in this module — `submit` grades a complete set of answers in one call and
persists the resulting `QuizAttempt` directly as `EVALUATED`. `startedAt`
and `submittedAt` therefore coincide and `durationSeconds` is always `0`; a
future "start attempt" endpoint could track true elapsed time if needed.

**Grading:** MULTIPLE_CHOICE/TRUE_FALSE require an exact match between
selected and correct option ids (no partial credit). SHORT_ANSWER uses a
case-insensitive exact string match — intentionally simple; swapping in
AI-assisted grading later wouldn't require changing the API contract.

**Validation:** submissions are checked against the quiz's actual questions
before grading — unknown `questionId`, duplicate `questionId`, or unknown
`optionId` all reject with `400` via `BadRequestException`, rather than
silently mis-scoring.

## MongoDB collections

| Collection     | Entity          | Notes |
|----------------|-----------------|-------|
| `users`        | `User`          | Unique index on `email`. |
| `quizzes`      | `Quiz`          | Embeds `QuizQuestion[]` → `QuizOption[]` (answer key lives here). Indexed `createdBy` (references `users`). |
| `quizAttempts` | `QuizAttempt`   | References `users` via indexed `userId` (not embedded — a user's attempt history is unbounded). Embeds `QuestionAnswer[]` (bounded, always read/written with the parent). Compound indexes: `{userId, quizId, createdAt}` and `{userId, createdAt}`. Uses `@Version` for optimistic locking since attempts are updated incrementally as a student answers. |

Login is a single endpoint for both roles: the JWT's embedded role claim
(`ROLE_STUDENT` or `ROLE_ADMIN`) is what `@PreAuthorize` checks against, not
separate login flows.

## Architecture

Controller → Service (interface + impl) → Repository → MongoDB document, with DTOs
at every controller boundary (documents are never returned directly). See the root
`pom.xml` for the full dependency list.
