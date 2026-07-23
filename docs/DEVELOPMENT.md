# Development

## Prerequisites
Node 22+, Python 3.12+, git.

## Backend
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
python -m pytest          # 28 tests as of the production review
```
Create the first admin (interactive, no hardcoded credentials):
```bash
cd backend
python -m app.cli.create_admin
```

## Frontend
```bash
cd frontend
npm install
npm run dev               # http://localhost:3000
npm run typecheck && npm run build
```
`BACKEND_URL` (server) and `NEXT_PUBLIC_BACKEND_URL` (client, login page) default to `http://localhost:8000`.

## Conventions
- Branches: `main` (stable) ← `develop` ← `feat/*`; conventional commit messages.
- Every fixed bug gets a regression test (see `test_regression_failed_task_not_retried_in_same_cycle`).
- Never commit `.env`, DB files, or anything under `backend/data/`.
