# ExamQuiz AI

AI-generated quizzes for students, graded instantly, with an admin console
for managing accounts and reviewing platform-wide analytics.

```
examquiz-ai/
├── backend/                   Spring Boot 3 / Java 21 REST API
├── frontend/                  React 19 / Vite / Tailwind CSS SPA
├── docker-compose.yml          Local integration-testing stack (NOT production - see DEPLOYMENT.md)
├── DEPLOYMENT.md               Full deployment guide: env vars, MongoDB Atlas, hosting options
├── SECURITY_CHECKLIST.md       Pre-launch security checklist
└── .github/workflows/          CI: build+test on push, per project
```

## Tech stack

| Layer | Stack |
|---|---|
| Backend | Java 21, Spring Boot 3, Spring Security (JWT), Spring Data MongoDB, Maven |
| Frontend | React 19, Vite, JavaScript, Tailwind CSS, Axios, React Router |
| Database | MongoDB Atlas |
| AI | UiPath Agentic AI, called over REST (not reimplemented locally) |

## Quick start (local development)

Two options: run both apps directly, or via Docker Compose.

### Option A — directly

```bash
# Backend
cd backend
cp src/main/resources/application.properties.example src/main/resources/application.properties
# edit application.properties: MONGODB_URI, JWT_SECRET, ADMIN_EMAIL/PASSWORD (see backend/README.md)
mvn spring-boot:run          # or: mvn spring-boot:run

# Frontend, in a second terminal
cd frontend
cp .env.example .env             # VITE_API_BASE_URL defaults to http://localhost:8080
npm install
npm run dev
```

Frontend: http://localhost:5173 · Backend: http://localhost:8080 ·
Swagger UI: http://localhost:8080/swagger-ui.html

### Option B — Docker Compose (backend + frontend + local MongoDB)

```bash
export JWT_SECRET=$(openssl rand -base64 32)
export ADMIN_PASSWORD="a-strong-password"
docker compose up --build
```

See `docker-compose.yml` for what each service needs — quiz *generation*
won't work without real `UIPATH_*` credentials, but auth, admin, and every
other flow will.

## Where to go next

| I want to... | Read |
|---|---|
| Understand the backend's modules, endpoints, and MongoDB schema | `backend/README.md` |
| Understand the frontend's routing, pages, and component structure | `frontend/README.md` |
| Deploy this to production | `DEPLOYMENT.md` |
| Review security posture before launch | `SECURITY_CHECKLIST.md` |

## Run commands reference

> **Note on Maven:** this repo doesn't include a Maven wrapper (`mvnw`) —
> commands below use a system-installed `mvn` (3.8+). To add a wrapper for
> version-pinned, install-free builds, run `mvn wrapper:wrapper -Dmaven=3.9.9`
> once from `backend/` and commit the generated `mvnw`/`mvnw.cmd`/`.mvn/`.

| Task | Command |
|---|---|
| Backend: run locally | `cd backend && mvn spring-boot:run` |
| Backend: build a jar | `cd backend && mvn clean package` |
| Backend: run tests | `cd backend && mvn test` |
| Backend: build Docker image | `docker build -t examquiz-backend ./backend` |
| Frontend: run locally | `cd frontend && npm run dev` |
| Frontend: production build | `cd frontend && npm run build` (outputs to `frontend/dist/`) |
| Frontend: lint | `cd frontend && npm run lint` |
| Frontend: preview a production build | `cd frontend && npm run preview` |
| Frontend: build Docker image | `docker build -t examquiz-frontend --build-arg VITE_API_BASE_URL=https://api.example.com ./frontend` |
| Both: local integration stack | `docker compose up --build` |
