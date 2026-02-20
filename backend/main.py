import httpx
import traceback
from fastapi import FastAPI, HTTPException, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from starlette.middleware.sessions import SessionMiddleware

from config import SECRET_KEY, SPOTIFY_API_BASE
from auth import router as auth_router, get_valid_token
import spotify
from gemini import extract_artists_from_image

app = FastAPI(title="Festify API")

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    tb = "".join(traceback.format_exception(type(exc), exc, exc.__traceback__))
    print(f"\n--- UNHANDLED ERROR ---\n{tb}\n-----------------------\n", flush=True)
    return JSONResponse(status_code=500, content={"detail": tb})

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
    allow_origins=["http://127.0.0.1:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

app.include_router(auth_router)

# ---------------------------------------------------------------------------
# Search
# ---------------------------------------------------------------------------

@app.get("/search")
async def search(q: str, request: Request):
    token = await get_valid_token(request.session)
    artists = await spotify.search_artists(token, q)
    return {"artists": artists}

# ---------------------------------------------------------------------------
# Playlist creation
# ---------------------------------------------------------------------------

class ArtistInput(BaseModel):
    id: str | None = None
    name: str

class PlaylistRequest(BaseModel):
    artists: list[ArtistInput]
    track_count: int | str = 10          # int or "discography"
    per_artist_counts: dict[str, int | str] | None = None
    playlist_name: str = "Festify Playlist"

@app.post("/playlist/create")
async def create_playlist(body: PlaylistRequest, request: Request):
    try:
        return await _create_playlist(body, request)
    except HTTPException:
        raise
    except Exception as exc:
        tb = "".join(traceback.format_exception(type(exc), exc, exc.__traceback__))
        print(f"\n--- PLAYLIST ERROR ---\n{tb}\n----------------------\n", flush=True)
        raise HTTPException(status_code=500, detail=tb)

async def _create_playlist(body: PlaylistRequest, request: Request):
    token = await get_valid_token(request.session)
    user_id = request.session.get("spotify_user_id")

    # Cache user_id in session so we don't fetch it every time
    if not user_id:
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f"{SPOTIFY_API_BASE}/me",
                headers={"Authorization": f"Bearer {token}"},
            )
        if r.status_code != 200:
            raise HTTPException(status_code=401, detail="Could not fetch user profile.")
        request.session["spotify_user_id"] = r.json()["id"]
        user_id = request.session["spotify_user_id"]

    # Create the playlist
    playlist = await spotify.create_playlist(token, user_id, body.playlist_name)
    playlist_id = playlist["id"]
    playlist_url = playlist["external_urls"]["spotify"]

    # Collect track URIs for each artist
    all_uris = []
    for artist in body.artists:
        count = (
            body.per_artist_counts.get(artist.name, body.track_count)
            if body.per_artist_counts
            else body.track_count
        )

        # Resolve name → id if needed
        artist_id = artist.id
        if not artist_id:
            artist_id = await spotify.resolve_artist_id(token, artist.name)
        if not artist_id:
            continue

        if count == "discography":
            uris = await spotify.get_discography_tracks(token, artist_id)
        else:
            uris = await spotify.get_top_tracks(token, artist_id, int(count))

        all_uris.extend(uris)

    try:
        total = await spotify.add_tracks_to_playlist(token, playlist_id, all_uris)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"add_tracks error: {traceback.format_exc()}")

    return {
        "playlist_name": body.playlist_name,
        "track_count": total,
        "url": playlist_url,
    }

# ---------------------------------------------------------------------------
# Poster scan
# ---------------------------------------------------------------------------

@app.post("/scan-poster")
async def scan_poster(request: Request, file: UploadFile = File(...)):
    await get_valid_token(request.session)  # ensure authenticated

    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")

    data = await file.read()
    if len(data) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image must be under 10MB.")

    artists = await extract_artists_from_image(data, file.content_type)
    return {"artists": artists}

# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/debug/gemini-models")
async def gemini_models():
    from config import GEMINI_API_KEY
    async with httpx.AsyncClient() as client:
        r = await client.get(
            "https://generativelanguage.googleapis.com/v1beta/models",
            params={"key": GEMINI_API_KEY},
        )
    return r.json()
