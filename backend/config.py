import os
from pathlib import Path
from dotenv import load_dotenv

_env_path = Path(__file__).resolve().parent / ".env"
if not _env_path.exists():
    raise FileNotFoundError(f".env file not found at {_env_path}")
load_dotenv(_env_path, override=True)

SPOTIFY_CLIENT_ID = os.environ["SPOTIFY_CLIENT_ID"]
SPOTIFY_CLIENT_SECRET = os.environ["SPOTIFY_CLIENT_SECRET"]
SPOTIFY_REDIRECT_URI = os.environ["SPOTIFY_REDIRECT_URI"]
GEMINI_API_KEY = os.environ["GEMINI_API_KEY"]
SECRET_KEY = os.environ["SECRET_KEY"]

SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize"
SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"
SPOTIFY_API_BASE = "https://api.spotify.com/v1"

SPOTIFY_SCOPES = " ".join([
    "playlist-modify-public",
    "playlist-modify-private",
    "user-read-private",
    "user-read-email",
])
