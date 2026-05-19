# sāhāyyam

Sahayyam is an AI-powered college intelligence platform for first-generation students.
Verified seniors contribute practical, time-sensitive campus knowledge; freshers get
branch-aware feeds, nudges, semantic search, and AI answers grounded in real tips.


## Tech Stack

- Backend: Node.js, Express.js, TypeScript
- Database: PostgreSQL, Prisma, pgvector
- AI: OpenAI, LangChain.js
- Validation/security: Zod, JWT, bcrypt, Helmet, CORS

## Setup

```bash
docker compose up -d
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run seed
npm run dev
```

Backend runs at `http://localhost:4000`.

## Environment

Create `backend/.env` from `.env.example` or copy the root values:

```bash
DATABASE_URL="postgresql://sahayyam:sahayyam@localhost:5432/sahayyam?schema=public"
PORT=4000
JWT_SECRET="replace-with-a-long-random-secret"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="http://localhost:5173"
OPENAI_API_KEY="your-key"
OPENAI_CHAT_MODEL="gpt-4o-mini"
OPENAI_EMBEDDING_MODEL="text-embedding-3-small"
```

## Demo Users

After seeding:

- Fresher: `fresher@sahayyam.edu` / `password123`
- Senior: `senior@sahayyam.edu` / `password123`
- Admin: `admin@sahayyam.edu` / `password123`

## API Quick Test

```bash
curl http://localhost:4000/health
```

Login:

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"fresher@sahayyam.edu","password":"password123"}'
```

Use the returned token:

```bash
curl http://localhost:4000/api/tips/feed \
  -H "Authorization: Bearer YOUR_TOKEN"
```