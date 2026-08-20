# Backend — FastAPI + PostgreSQL + JWT Auth

## File structure

```
backend/
├── app/
│   ├── main.py                # FastAPI app entrypoint
│   ├── core/
│   │   ├── config.py          # Settings loaded from .env
│   │   └── security.py        # Password hashing, JWT create/decode
│   ├── db/
│   │   ├── base.py            # SQLAlchemy declarative base
│   │   └── session.py         # Engine, SessionLocal, get_db dependency
│   ├── models/
│   │   └── user.py            # User SQLAlchemy model
│   ├── schemas/
│   │   ├── user.py            # Pydantic request/response schemas
│   │   └── token.py           # Token schemas
│   ├── crud/
│   │   └── user.py            # DB access functions
│   └── api/
│       ├── deps.py            # get_current_user, get_current_active_user
│       └── routes/
│           ├── auth.py        # /api/auth/register, /login, /refresh
│           └── users.py       # /api/users/me
├── alembic/                   # DB migrations
├── alembic.ini
├── requirements.txt
└── .env.example
```

## Setup

1. **Create a virtual environment and install dependencies**
   ```bash
   python -m venv venv
   source venv/bin/activate   # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Set up PostgreSQL** and create a database, e.g. `myapp`.

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set `DATABASE_URL` and a strong random `SECRET_KEY`
   (e.g. `python -c "import secrets; print(secrets.token_urlsafe(48))"`).

4. **Run migrations**
   ```bash
   alembic upgrade head
   ```

5. **Run the server**
   ```bash
   uvicorn app.main:app --reload
   ```
   API docs available at `http://localhost:8000/docs`.

## Auth flow

- `POST /api/auth/register` — create a user (`email`, `password`, optional `full_name`)
- `POST /api/auth/login` — returns `access_token` + `refresh_token`
- `POST /api/auth/refresh` — exchange a valid `refresh_token` for a new token pair
- `GET /api/users/me` — protected route, requires `Authorization: Bearer <access_token>`
- `PATCH /api/users/me` — update your own profile/password

Access tokens expire in 30 minutes by default; refresh tokens in 7 days
(both configurable in `.env`).

## Notes on security choices

- Passwords are hashed with **bcrypt** via passlib — never stored in plaintext.
- Access and refresh tokens are separate JWTs with a `type` claim, so a refresh
  token can't be used to call protected endpoints and vice versa.
- Adjust `BACKEND_CORS_ORIGINS` in `.env` to match your frontend's origin(s).
- For production, put this behind HTTPS and consider adding rate limiting on
  `/api/auth/login` and `/api/auth/register`.

## Adding new tables

1. Add a model in `app/models/`.
2. Import it in `alembic/env.py` (so Alembic sees it).
3. Generate a migration:
   ```bash
   alembic revision --autogenerate -m "add something"
   alembic upgrade head
   ```
