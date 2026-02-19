from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from config import SECRET_KEY
from auth import router as auth_router

app = FastAPI(title="Festify API")

# ---------------------------------------------------------------------------
# Middleware
# ---------------------------------------------------------------------------

app.add_middleware(
    SessionMiddleware,
    secret_key=SECRET_KEY,
    session_cookie="festify_session",
    max_age=60 * 60 * 24 * 7,  # 1 week
    https_only=False,           # set True in production
    same_site="lax",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

app.include_router(auth_router)


@app.get("/health")
def health():
    return {"status": "ok"}
