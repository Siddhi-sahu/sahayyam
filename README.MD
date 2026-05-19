# sāhāyyam

**sāhāyyam** is an AI-powered College Intelligence Platform for first-generation students.

First-generation students often miss opportunities not because they lack ability, but because they do not inherit informal campus knowledge: scholarship office timing, faculty preferences, hidden placement circles, club pipelines, and department norms. sāhāyyam turns that invisible curriculum into verified, branch-aware, deadline-sensitive intelligence.


## Key Features

- **Auth and roles**: Fresher, senior, and admin flows with JWT authentication.
- **Personalized intelligence feed**: Tips are filtered by college, branch, status, urgency, and semantic relevance.
- **Senior tip submission**: Seniors submit hidden campus knowledge with category, deadline, evidence quality, and action steps.
- **AI enrichment**: OpenAI extracts urgency, deadline, category, summary, and suggested actions from raw tip text.
- **SignalRank scoring**: Tips are ranked using urgency, deadline proximity, branch match, verification count, dispute count, credibility, evidence quality, and first-generation relevance.
- **Peer verification**: Seniors/admins can verify or dispute tips; credibility and status update automatically.
- **Nudge engine**: Freshers see critical opportunities closing soon.
- **AI Ask**: A RAG-style assistant answers student questions using retrieved tips as grounded sources.

## Architecture

```mermaid
flowchart LR
  A["React + TypeScript Frontend"] --> B["Express TypeScript API"]
  B --> C["Prisma ORM"]
  C --> D["PostgreSQL + pgvector"]
  B --> E["OpenAI + LangChain AI Layer"]
  E --> D
  B --> F["SignalRank + Nudge Services"]
```

### Frontend

- React.js
- TypeScript
- TailwindCSS
- TanStack Query for API fetching, caching, loading states, and refetching
- Zustand for auth token and current-user state

### Backend

- Node.js
- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- pgvector for semantic search
- OpenAI + LangChain.js for AI enrichment and grounded AI Ask

## Repository Structure

```text
.
├── backend
│   ├── prisma
│   │   ├── schema.prisma
│   │   ├── migrations
│   │   └── seed.ts
│   └── src
│       ├── modules
│       │   ├── auth
│       │   ├── tips
│       │   ├── verifications
│       │   ├── nudges
│       │   ├── ai
│       │   ├── search
│       │   └── signal-rank
│       ├── middleware
│       ├── config
│       └── server.ts
├── frontend
│   └── src
│       ├── App.tsx
│       ├── lib
│       └── components
└── docker-compose.yml
```

## Local Setup

Start the database:

```bash
docker compose up -d
```

Set up the backend:

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run seed
npm run dev
```

Backend runs at:

```text
http://localhost:4000
```

Set up the frontend in another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at:

```text
http://localhost:5173
```

## Environment Variables

Create `backend/.env`:

```bash
DATABASE_URL="postgresql://sahayyam:sahayyam@localhost:5432/sahayyam?schema=public"
PORT=4000
NODE_ENV=development
JWT_SECRET="replace-with-a-long-random-secret"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="http://localhost:5173,http://127.0.0.1:5173"
OPENAI_API_KEY="your-openai-key"
OPENAI_CHAT_MODEL="gpt-4o-mini"
OPENAI_EMBEDDING_MODEL="text-embedding-3-small"
```

Create `frontend/.env`:

```bash
VITE_API_URL="http://localhost:4000"
```

Never commit `.env`.

## Demo Accounts

These accounts are seeded only for fast judging.

- Fresher: `fresher@sahayyam.edu` / `password123`
- Senior: `senior@sahayyam.edu` / `password123`
- Admin: `admin@sahayyam.edu` / `password123`

Why demo accounts exist:

- Judges can immediately test all roles without signing up.
- Seed data proves the backend works: auth, role-based actions, feeds, verification, nudges, and AI Ask.

## API Overview

Auth:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

Tips:

- `POST /api/tips`
- `GET /api/tips/feed`
- `GET /api/tips/:id`
- `POST /api/tips/:id/verify`
- `POST /api/tips/:id/dispute`

Nudges:

- `GET /api/nudges`

AI:

- `POST /api/ai/enrich-tip`
- `POST /api/ai/ask`
