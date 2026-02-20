import asyncio
import httpx
from fastapi import HTTPException
from config import SPOTIFY_API_BASE

async def _spotify_post(token: str, url: str, json: dict) -> httpx.Response:
    """POST to Spotify with one retry on 403 (token propagation delay)."""
    for attempt in range(2):
        async with httpx.AsyncClient() as client:
            resp = await client.post(url, headers={"Authorization": f"Bearer {token}"}, json=json)
        if resp.status_code != 403 or attempt == 1:
            return resp
        await asyncio.sleep(1)
    return resp



async def search_artists(token: str, query: str, limit: int = 8) -> list[dict]:
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{SPOTIFY_API_BASE}/search",
            headers={"Authorization": f"Bearer {token}"},
            params={"q": query, "type": "artist", "limit": limit},
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail="Spotify search failed.")

    artists = resp.json()["artists"]["items"]
    return [
        {
            "id": a["id"],
            "name": a["name"],
            "genres": a.get("genres", []),
            "image": a["images"][0]["url"] if a.get("images") else None,
        }
        for a in artists
    ]


async def get_top_tracks(token: str, artist_id: str, limit: int, market: str = "US") -> list[str]:
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch artist name so we can search by it
    async with httpx.AsyncClient() as client:
        artist_resp = await client.get(f"{SPOTIFY_API_BASE}/artists/{artist_id}", headers=headers)
    if artist_resp.status_code != 200:
        print(f"[SPOTIFY] get_top_tracks: failed to fetch artist {artist_id} → {artist_resp.status_code}: {artist_resp.text}", flush=True)
        return []
    artist_name = artist_resp.json()["name"]

    # Run three searches in parallel: strict + two pages of broad results
    async with httpx.AsyncClient() as client:
        strict, broad0, broad1 = await asyncio.gather(
            client.get(
                f"{SPOTIFY_API_BASE}/search",
                headers=headers,
                params={"q": f"artist:{artist_name}", "type": "track", "market": market, "limit": 10},
            ),
            client.get(
                f"{SPOTIFY_API_BASE}/search",
                headers=headers,
                params={"q": artist_name, "type": "track", "market": market, "limit": 10, "offset": 0},
            ),
            client.get(
                f"{SPOTIFY_API_BASE}/search",
                headers=headers,
                params={"q": artist_name, "type": "track", "market": market, "limit": 10, "offset": 10},
            ),
        )

    seen_uris: set[str] = set()
    all_tracks: list[dict] = []
    for resp in (strict, broad0, broad1):
        if resp.status_code == 200:
            for t in resp.json().get("tracks", {}).get("items", []):
                if t["uri"] not in seen_uris:
                    seen_uris.add(t["uri"])
                    all_tracks.append(t)

    filtered = [t for t in all_tracks if any(a["id"] == artist_id for a in t.get("artists", []))]
    filtered.sort(key=lambda t: t.get("popularity", 0), reverse=True)
    print(f"[SPOTIFY] get_top_tracks: {len(all_tracks)} combined results, {len(filtered)} after artist filter, returning {min(len(filtered), limit)}", flush=True)
    return [t["uri"] for t in filtered[:limit]]



async def resolve_artist_id(token: str, name: str) -> str | None:
    """Search for an artist by name and return their Spotify ID."""
    results = await search_artists(token, name, limit=1)
    return results[0]["id"] if results else None


async def create_playlist(token: str, user_id: str, name: str) -> dict:
    payload = {"name": name, "public": False, "description": "Created with Festify"}

    # Try /me/playlists first (more reliable under Development Mode)
    resp = await _spotify_post(token, f"{SPOTIFY_API_BASE}/me/playlists", payload)
    print(f"[SPOTIFY] create_playlist /me/playlists → {resp.status_code} retry-after={resp.headers.get('retry-after')} body={resp.text[:300]}", flush=True)

    # Fall back to /users/{id}/playlists if needed
    if resp.status_code not in (200, 201):
        resp = await _spotify_post(token, f"{SPOTIFY_API_BASE}/users/{user_id}/playlists", payload)
        print(f"[SPOTIFY] create_playlist /users/{user_id}/playlists → {resp.status_code} retry-after={resp.headers.get('retry-after')} body={resp.text[:300]}", flush=True)

    if resp.status_code not in (200, 201):
        raise HTTPException(status_code=500, detail=f"Failed to create playlist: {resp.status_code} {resp.text}")
    return resp.json()


async def add_tracks_to_playlist(token: str, playlist_id: str, uris: list[str]) -> int:
    """Add tracks in batches of 100. Tries PUT (replace) first, falls back to POST (append)."""
    print(f"[SPOTIFY] add_tracks_to_playlist: {len(uris)} uris to add to {playlist_id}", flush=True)
    added = 0
    for i in range(0, len(uris), 100):
        batch = uris[i:i + 100]
        url = f"{SPOTIFY_API_BASE}/playlists/{playlist_id}/items"
        headers = {"Authorization": f"Bearer {token}"}

        resp = await _spotify_post(token, url, {"uris": batch})
        print(f"[SPOTIFY] add_tracks batch {i//100 + 1} POST /items → {resp.status_code}: {resp.text[:200]}", flush=True)

        if resp.status_code in (200, 201):
            added += len(batch)
    return added
