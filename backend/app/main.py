from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import ai, auth, dashboard, users, health
from app.core.config import settings

app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(ai.router)
app.include_router(dashboard.router)
app.include_router(users.router)
app.include_router(health.router)


@app.get("/")
def root():
    return {"status": "ok", "message": f"{settings.PROJECT_NAME} API is running"}



