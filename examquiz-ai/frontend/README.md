# ExamQuiz AI — Frontend

React 19 + Vite + Tailwind CSS frontend for ExamQuiz AI.

## Getting started

```bash
npm install
cp .env.example .env      # then set VITE_API_BASE_URL to your backend
npm run dev
```

Build for production: `npm run build` (output in `dist/`).

Verified in this environment: `npm install`, `npm run build`, and `npm run lint`
all pass cleanly (2 harmless ESLint warnings remain — see "Known warnings" below).

## Quiz Result view

`components/quiz/QuizResultSummary.jsx` (rendered by `QuizScreenPage` after a
successful `POST /api/quizzes/{id}/submit` — not a separate route; see
"routing reality" note below) now covers the full requested checklist:

| Requested | How |
|---|---|
| Score / Percentage | Read directly off the attempt (`score/maxScore`), percentage computed once and reused everywhere (ring + stat + grade) |
| Grade | `utils/resultInsights.js#getGrade` — A/B/C/D/F bands with a label and message per band |
| Correct / Wrong / Skipped | `utils/resultInsights.js#getResultBreakdown` — the backend only distinguishes correct/incorrect, not "incorrect because skipped" vs. "incorrect because attempted wrong", so this split happens client-side using whether an answer has any recorded content at all |
| Performance Message | Part of the grade band (`grade.message`) |
| Recommendations | `utils/resultInsights.js#getRecommendations` — contextual based on skipped count, wrong count, and score band (e.g. "you skipped N questions", "try a harder difficulty") |
| Question Review | Filterable (All / Wrong / Skipped) via local tab state, each card shows correctness + the answer key |
| Retry Quiz | See below — genuinely re-attempts the *same* quiz, not a new one |
| Dashboard Button | Links to `/dashboard` |

**Retry Quiz required a real fix, not just a button.** Navigating to the same
`/quizzes/:id/take` URL you're already on doesn't remount anything — React
Router treats it as a no-op, so old answers/timer/current-question state
would linger. `QuizScreenPage` now holds an `attemptKey` counter that's part
of `QuizTakingFlow`'s `key` prop; retry increments it, forcing React to fully
discard and remount the subtree (fresh answers, fresh 60s/question timer,
back to question 1) rather than trying to manually reset six pieces of state.

**Routing reality, stated plainly:** this result view only ever appears
immediately after submitting, in the same page/component — it is *not* a
separately-navigable route backed by stored data. The backend has no
`GET` endpoint for a single past attempt's full detail (only
`GET /api/quizzes/history`, which returns summaries with no per-question
breakdown). Building a fake "past result" route without that backend support
would mean either broken navigation or fabricated data, so I didn't.

**Verified with real assertions**, same discipline as the dashboard/quiz-answer
logic: `getGrade`'s band boundaries (89.9 vs 90, etc.), `getResultBreakdown`'s
correct/wrong/skipped math (including that wrong+skipped can't go negative),
and `getRecommendations`'s conditional logic were all run directly with
`node` against hand-built cases before shipping — not just eyeballed.

## Quiz pages: Setup → Screen → Result

Three-step flow, two routes (setup and taking share the generate-then-navigate
pattern; taking and result share one page/component):

1. **Quiz Setup** (`pages/quiz/GenerateQuizPage.jsx`, `/quizzes/generate`) —
   the form from the previous round. On success it now navigates straight
   into the taking screen (`navigate(ROUTE_PATHS.quizTake(quiz.id))`) instead
   of showing a dead-end preview — setup and taking are one continuous flow.
2. **Quiz Screen** (`pages/quiz/QuizScreenPage.jsx`, `/quizzes/:id/take`) —
   fetches the quiz via `GET /api/quizzes/{id}` (works whether you arrived
   from setup or a direct link/refresh), then renders the interactive
   taking flow. Composed from:
   - `components/quiz/QuestionCard.jsx` — one question at a time, input type
     driven by that question's own `questionType` (a MIXED quiz can have
     different types per question). MULTIPLE_CHOICE renders as checkboxes,
     not radio buttons — the backend's grading requires an *exact-set* match
     against `correctOptionIds`, which could legitimately contain more than
     one id for a "select all that apply" question; single-select would make
     such a question unanswerable correctly. TRUE_FALSE is genuinely
     single-select, so it's a radio group.
   - `components/quiz/ProgressBar.jsx` — question position + answered count.
   - `components/quiz/QuestionPalette.jsx` — numbered jump-to-question
     navigator with answered/unanswered/current state.
   - `components/quiz/QuizTimer.jsx` — **client-side pacing convenience,
     not backend-enforced** — `QuizResponse` has no duration/time-limit
     field, so this is 60 seconds/question, purely local. Hitting zero
     auto-submits whatever's answered so far.
   - Previous/Next navigate between questions without losing answers
     (answers live in one object keyed by question id, independent of
     current position); a "Submit early" link and the final "Submit quiz"
     button both route through the same `ConfirmDialog` (its wording adapts
     if questions are still unanswered).
3. **Result** — same page/component, not a separate route: on successful
   `POST /api/quizzes/{id}/submit`, `QuizTakingFlow` swaps to
   `components/quiz/QuizResultSummary.jsx`, which cross-references the
   attempt's grading data (ids + correctness only) against the `quiz` object
   already held in memory (question/option *text*) to render a full
   per-question breakdown with the answer key revealed — safe specifically
   because this only ever renders after the backend has confirmed grading
   happened, consistent with the "no answer key before submission" rule the
   backend itself enforces.

**Hook-ordering note, since it's an easy mistake here:** `useCountdown` is
called unconditionally at the top of `QuizTakingFlow`, *before* the
`if (result) return <QuizResultSummary ... />` branch — not after. Placing a
hook call after a conditional early return changes how many hooks fire
between renders and breaks the Rules of Hooks. Verified by running
`npm run lint` (which includes `plugin:react-hooks/recommended`) clean, not
just by eyeballing it.

**Verified with real assertions, not just build/lint:** both
`utils/quizAnswers.js#isAnswered` (the logic gating progress/submit-warning
state) and last round's `utils/quizStats.js` were run directly with `node`
against hand-built edge cases (empty state, whitespace-only text answers,
etc.) in-session before shipping.

## Admin Dashboard: audit pass

Most of the admin section (`AdminDashboardPage`, `AdminStudentsPage`,
`AdminAnalyticsPage`, the admin `Sidebar` links, `AdminRoute`, `adminService`
against all four `/api/admin/*` endpoints) already existed from earlier
rounds. Rather than rebuild it, this pass was a focused audit against the
explicit checklist — Sidebar, Cards, Charts, Tables, Search, Pagination,
Responsive — and found/fixed real gaps rather than re-describing what
already worked:

- **Tables had no mobile fallback — the actual gap.** A 5-column `<table>`
  on a 375px screen just overflows. `AdminStudentsPage` now renders the full
  table on `md+` and an equivalent stacked card list below `md` (same data,
  same enable/disable action), matching the exact breakpoint the sidebar
  itself switches on (`md:hidden`/`md:block`), so the whole layout changes
  shape consistently at one point, not several different ones.
- **Search is now debounced, not button-gated.** Previously required
  clicking "Search" to apply (the status-filter `<select>` already applied
  immediately, an inconsistency). New `hooks/useDebounce.js` + a single
  `useEffect` drives both search text and status filter uniformly — types,
  pauses 350ms, results update. Any filter change resets to page 0.
- **Pagination was duplicated markup**, byte-for-byte the same between
  `AdminStudentsPage` and `QuizHistoryPage`. Extracted to
  `components/common/Pagination.jsx`, used by both now.
- **Cards: "Active / disabled" was one card showing two numbers** (`12 / 3`)
  — split into two proper single-metric `StatCard`s, since combining two
  numbers into one card isn't what a stat card is for. Recent-activity rows
  also gained `truncate`/`min-w-0` so a long name or quiz title can't blow
  out the row on narrow screens.
- **The 30-bar daily-trend chart** relied on hover-only tooltips (dead on
  touch) and had no width floor, so on mobile the bars would just get
  squished thin. Now wrapped in `overflow-x-auto` with a width floor, so
  narrow screens scroll horizontally through legible bars instead of
  cramming all 30 into whatever space is left; tooltips now also respond to
  `group-active` (tap-and-hold) alongside hover.

Everything else — the aggregation-backed analytics (score distribution,
subject breakdown via the backend's `$lookup`, top quizzes), the
enable/disable student-status flow, `AdminRoute`'s `hasRole('ADMIN')` guard —
was already correct and is unchanged.

## Student Dashboard

`pages/dashboard/DashboardPage.jsx` assembles every requested section from
`useQuizStats` (fetches `GET /api/quizzes/history`) piped through the pure
`utils/quizStats.js#computeDashboardStats`:

| Section | Source |
|---|---|
| Welcome | `components/dashboard/WelcomeBanner.jsx` |
| Total Quizzes | `PageResponse.totalElements` (accurate even beyond the fetched sample) |
| Average Score / Best Score | Weighted over up to 50 most recent attempts |
| Recent Attempts | `components/dashboard/RecentAttemptsCard.jsx` |
| Weak Topics / Strong Topics | `components/dashboard/TopicsCard.jsx`, ranked by per-topic average |
| Progress Cards | `components/dashboard/ProgressCards.jsx` — one card per topic with a trend arrow (latest attempt vs. the one before it) |
| Charts | `components/common/LineChart.jsx` (score trend) + `components/common/BarChart.jsx` (average by topic) — hand-rolled SVG, no new dependency |
| Quick Actions | `components/dashboard/QuickActions.jsx` — links to the new Generate Quiz page and full history |

**Honest scope note on "topics":** the backend's `QuizAttemptSummaryResponse`
doesn't carry a quiz `subject` field (only `quizTitle` — subject lives on the
`Quiz` document and isn't denormalized onto attempts), and there's no
student-scoped topic-analytics endpoint (the platform-wide subject breakdown
on `/api/admin/analytics` is admin-only). So "topics" here are grouped by
`quizTitle`, the finest-grained label actually available without an N+1 fetch
per attempt. This is called out in `utils/quizStats.js`'s module docstring,
not silently assumed — if true subject-level grouping matters later, the
clean fix is a dedicated backend endpoint mirroring the admin module's
`$lookup`-based aggregation pattern, scoped to the current user.

**New: Generate Quiz page** (`pages/quiz/GenerateQuizPage.jsx`, route
`/quizzes/generate`) — Quick Actions needed somewhere real to send the user,
so this is a fully working form against `POST /api/quizzes/generate`, with
the same validation approach as the auth pages. Each "Practice" link on a
weak-topic row deep-links here with `?topic=` pre-filled.

**Verified, not just written:** `computeDashboardStats` is a pure function
with no React/fetch dependencies, so I ran it directly with `node` against
hand-built test data (see git history / this was run in-session, not
committed as a test file) — caught and fixed two real bugs before shipping:
a topic with an unscoreable attempt (`maxScore: 0`) was leaking into the
weak-topics ranking with a `null` average (comparing `null` numerically
produces `NaN`, undefined sort order), and the score-trend chart trusted
input array order instead of sorting explicitly by `submittedAt`.

## Auth pages: validation details

`LoginPage`/`RegisterPage` validate on blur and on submit (`utils/validators.js`),
not just via HTML5 `required`/`type` attributes:

- Email: format-checked client-side.
- Login password: presence only (the server is the source of truth on whether
  it's *correct* — client-side strength-checking a login password would be
  meaningless and just adds friction).
- Register password: mirrors the backend's exact policy (8–64 chars, one
  uppercase, one lowercase, one digit) via the same regex, plus a live
  checklist (`PasswordRulesList`) so a rejected password is never a surprise
  at submit time.
- Confirm password: re-validated automatically if the password field changes
  after confirm was already touched, so a stale "match" never lingers.

Errors only render after a field has been touched (`FormField`), and inputs
carry `aria-invalid`/`aria-describedby` for screen readers. Submission is
blocked client-side if any field fails validation — the request is never
sent to a state the backend is certain to reject.

## Responsive navigation

`Sidebar` is a static column on `md+` screens and a slide-in drawer (with
backdrop, `Escape`-dismissible via backdrop click, focus-visible close
button) on mobile, opened via the hamburger button in `Navbar`. State lives
in `MainLayout` and is passed down — `Sidebar` itself has no idea *how* it
was opened, just whether it's open.

## Folder structure

```
src/
├── main.jsx                 Entry point
├── App.jsx                  Providers (Router, Theme, Auth) + route table
├── index.css                Tailwind directives, theme tokens, component classes
│
├── components/
│   ├── common/               Spinner, ScoreRing, StatCard - shared, presentational
│   └── layout/                Navbar, Sidebar, Footer, MainLayout, AuthLayout
│
├── pages/
│   ├── auth/                  LoginPage, RegisterPage
│   ├── dashboard/            DashboardPage (student)
│   ├── quiz/                    QuizHistoryPage
│   ├── admin/                 AdminDashboardPage, AdminStudentsPage, AdminAnalyticsPage
│   └── errors/                 NotFoundPage, UnauthorizedPage
│
├── routes/
│   ├── AppRoutes.jsx        Central route table
│   ├── routePaths.js         Path constants + getHomeRoute(user) role-aware redirect
│   ├── ProtectedRoute.jsx   Auth guard (redirects to /login)
│   └── AdminRoute.jsx       Role guard (redirects to /unauthorized)
│
├── context/
│   ├── AuthContext.jsx       User session state, login/register/logout
│   └── ThemeContext.jsx     Light/dark mode, persisted + system-preference aware
│
├── services/
│   ├── apiClient.js            Axios instance: JWT header injection, 401 → refresh → retry
│   ├── authService.js
│   ├── userService.js
│   ├── quizService.js
│   └── adminService.js
│
├── hooks/
│   └── useAuth.js
│
└── utils/
    ├── tokenStorage.js       localStorage wrapper for tokens/user
    └── constants.js           ROLES, API_BASE_URL
```

## How the pieces fit together

**Axios configuration** (`services/apiClient.js`) is the only place that knows
about tokens and refresh logic. A request interceptor attaches the current
access token; a response interceptor catches `401`s, refreshes the token
exactly once (concurrent 401s are coalesced into a single refresh call), and
retries the original request — or clears the session and notifies
`AuthContext` if the refresh itself fails.

**Authentication context** (`context/AuthContext.jsx`) owns `user`,
`isAuthenticated`, `login`, `register`, `logout`, and `hasRole(role)`. On
mount, if a token is already in `localStorage`, it validates it against
`GET /api/v1/users/me` in the background rather than trusting the cached
user blindly — an expired/invalid token logs the user out cleanly instead of
leaving stale state around.

**Protected / Admin routes** are two separate, composable guards:
`ProtectedRoute` checks authentication (→ `/login` if missing, preserving the
attempted URL to return to after login); `AdminRoute` checks the `ADMIN` role
(→ `/unauthorized` if missing) and is nested *inside* the protected tree, so
it never has to re-check authentication itself.

**Registration always produces a STUDENT** (matches the backend contract) —
there's no role selector on `RegisterPage`. Role-aware landing after
login/register is handled once, centrally, via `routePaths.getHomeRoute(user)`.

## Theme

`tailwind.config.js` defines a deliberate token set rather than default
Tailwind indigo/slate: a teal-based `brand` scale, a cooler `ink` neutral
scale, and a restrained `accent` amber used only for scores/highlights.
Typography pairs a serif display face (`Fraunces`, headings/wordmark) with a
sans body face (`Inter`) and a monospace face (`IBM Plex Mono`) reserved for
numbers/scores/timestamps — so "data" reads visually distinct from "prose"
throughout the dashboards. Light/dark mode is class-based (`darkMode: 'class'`)
and toggled via `ThemeContext`, persisted to `localStorage`.

The app's one signature visual element is `ScoreRing` (`components/common/ScoreRing.jsx`)
— a circular percentage gauge used everywhere a score needs to read at a
glance, instead of a generic bar or bare number.

## Known warnings

`npm run lint` reports two `react-refresh/only-export-components` warnings,
both in `context/AuthContext.jsx` and `context/ThemeContext.jsx`. These fire
because each file exports both a context/provider *and* a hook/context object
from the same file — a completely standard React pattern, not a defect. Left
as warnings (not treated as errors) deliberately.

## Backend contract assumptions

Built against the endpoints from the ExamQuiz AI backend: `/api/v1/auth/*`,
`/api/v1/users/me`, `/api/quizzes/*`, `/api/admin/*`. Every service function
unwraps the backend's `ApiResponse` envelope (`response.data.data`) — if your
backend's response shape differs, that's the one place per resource to adjust.
