# JanSetu-AI

## Repository structure

- `frontend/`: Next.js + Tailwind web app
- `backend/ai-service/`: FastAPI service used for complaint drafting/routing (runs on port 8000)
- `docker-compose.yml`: local dependencies (Mongo/Redis) + backend service

Modern Next.js + Tailwind frontend prototype for JanSetu-AI.

## Run

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Then open `http://localhost:3000`.

## Run backend (AI service)

```bash
cd backend/ai-service
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

