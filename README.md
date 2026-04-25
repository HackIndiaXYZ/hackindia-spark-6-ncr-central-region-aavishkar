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
cp .env.example .env   # (or create .env.local)
uvicorn main:app --host 0.0.0.0 --port 8000
```

Notes:
- This repo is intended for **Python 3.12** (see `.python-version`). Newer versions may work, but some deps can warn/break.
- The service will start even without an LLM key (it falls back to rule-based drafting), but for GPT-powered drafting set `EMERGENT_LLM_KEY` (or `OPENAI_API_KEY`) in `.env` / `.env.local`.

