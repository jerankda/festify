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


async def _spotify_get(
    client: httpx.AsyncClient,
    token: str,
    url: str,
    params: dict | None = None,
    max_retries: int = 3,
    max_wait: int = 10,
) -> httpx.Response:
    """GET with automatic 429 Retry-After back-off. Fails fast if Retry-After exceeds max_wait."""
    headers = {"Authorization": f"Bearer {token}"}
    for attempt in range(max_retries):
        resp = await client.get(url, headers=headers, params=params)
        if resp.status_code != 429:
            return resp
        wait = int(resp.headers.get("retry-after", 2)) + 1
        if wait > max_wait:
            print(f"[SPOTIFY] 429 Retry-After={wait}s exceeds cap ({max_wait}s) — aborting", flush=True)
            raise HTTPException(
                status_code=429,
                detail=f"Spotify rate limit exceeded. Try again in ~{wait // 60} minutes.",
            )
        print(f"[SPOTIFY] 429 rate-limited on {url}, waiting {wait}s (attempt {attempt + 1})", flush=True)
        await asyncio.sleep(wait)
    return resp  # return the last 429 if all retries exhausted


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

    # Run two searches in parallel: strict (artist: field) + broad (name only)
    async with httpx.AsyncClient() as client:
        strict, broad = await asyncio.gather(
            client.get(
                f"{SPOTIFY_API_BASE}/search",
                headers=headers,
                params={"q": f"artist:{artist_name}", "type": "track", "market": market, "limit": 10},
            ),
            client.get(
                f"{SPOTIFY_API_BASE}/search",
                headers=headers,
                params={"q": artist_name, "type": "track", "market": market, "limit": 10},
            ),
        )

    seen_uris: set[str] = set()
    all_tracks: list[dict] = []
    for resp in (strict, broad):
        if resp.status_code == 200:
            for t in resp.json().get("tracks", {}).get("items", []):
                if t["uri"] not in seen_uris:
                    seen_uris.add(t["uri"])
                    all_tracks.append(t)

    filtered = [t for t in all_tracks if any(a["id"] == artist_id for a in t.get("artists", []))]
    filtered.sort(key=lambda t: t.get("popularity", 0), reverse=True)
    print(f"[SPOTIFY] get_top_tracks: {len(all_tracks)} combined results, {len(filtered)} after artist filter, returning {min(len(filtered), limit)}", flush=True)
    return [t["uri"] for t in filtered[:limit]]


async def get_discography_tracks(token: str, artist_id: str, market: str = "US") -> list[str]:
    """Fetch all track URIs from an artist's albums/singles with rate-limit handling."""
    uris: list[str] = []
    album_ids: list[str] = []

    async with httpx.AsyncClient(timeout=60.0) as client:
        # --- Page through artist albums ---
        next_url: str | None = f"{SPOTIFY_API_BASE}/artists/{artist_id}/albums"
        params: dict | None = {"include_groups": "album,single", "market": market, "limit": 10}

        while next_url:
            resp = await _spotify_get(client, token, next_url, params=params)
            print(f"[SPOTIFY] discography albums {artist_id} → {resp.status_code}: {resp.text[:200]}", flush=True)
            if resp.status_code != 200:
                break
            data = resp.json()
            album_ids.extend(a["id"] for a in data["items"])
            next_url = data.get("next")
            params = None  # next URL already contains all params
            await asyncio.sleep(0.1)  # light pacing between pages

        print(f"[SPOTIFY] discography {artist_id}: {len(album_ids)} albums/singles found", flush=True)

        # --- Fetch tracks for each album in batches of 20 ---
        for i in range(0, len(album_ids), 20):
            batch = album_ids[i:i + 20]
            resp = await _spotify_get(
                client, token,
                f"{SPOTIFY_API_BASE}/albums",
                params={"ids": ",".join(batch), "market": market},
            )
            print(f"[SPOTIFY] discography album-tracks batch {i // 20 + 1} → {resp.status_code}", flush=True)
            if resp.status_code == 200:
                for album in resp.json().get("albums", []):
                    for track in album.get("tracks", {}).get("items", []):
                        uris.append(track["uri"])
            await asyncio.sleep(0.1)  # light pacing between batches

    print(f"[SPOTIFY] discography {artist_id}: {len(uris)} total track URIs", flush=True)
    return uris


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
