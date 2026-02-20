import asyncio
import httpx
from fastapi import HTTPException
from config import SPOTIFY_API_BASE


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


async def get_top_tracks(token: str, artist_id: str, limit: int) -> list[str]:
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{SPOTIFY_API_BASE}/artists/{artist_id}/top-tracks",
            headers={"Authorization": f"Bearer {token}"},
            params={"market": "US"},
        )
    if resp.status_code != 200:
        return []
    tracks = resp.json().get("tracks", [])
    return [t["uri"] for t in tracks[:limit]]


async def get_discography_tracks(token: str, artist_id: str) -> list[str]:
    """Fetch all track URIs from an artist's albums (albums + singles)."""
    uris = []
    async with httpx.AsyncClient() as client:
        # Fetch all albums
        albums_url = f"{SPOTIFY_API_BASE}/artists/{artist_id}/albums"
        params = {"include_groups": "album,single", "market": "US", "limit": 50}
        album_ids = []

        while albums_url:
            resp = await client.get(
                albums_url,
                headers={"Authorization": f"Bearer {token}"},
                params=params,
            )
            if resp.status_code != 200:
                break
            data = resp.json()
            album_ids.extend([a["id"] for a in data["items"]])
            albums_url = data.get("next")
            params = {}  # next URL already has params

        # Fetch tracks for each album in batches of 20
        for i in range(0, len(album_ids), 20):
            batch = album_ids[i:i + 20]
            resp = await client.get(
                f"{SPOTIFY_API_BASE}/albums",
                headers={"Authorization": f"Bearer {token}"},
                params={"ids": ",".join(batch), "market": "US"},
            )
            if resp.status_code != 200:
                continue
            for album in resp.json().get("albums", []):
                for track in album.get("tracks", {}).get("items", []):
                    uris.append(track["uri"])

    return uris


async def resolve_artist_id(token: str, name: str) -> str | None:
    """Search for an artist by name and return their Spotify ID."""
    results = await search_artists(token, name, limit=1)
    return results[0]["id"] if results else None


async def create_playlist(token: str, user_id: str, name: str) -> dict:
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{SPOTIFY_API_BASE}/users/{user_id}/playlists",
            headers={"Authorization": f"Bearer {token}"},
            json={"name": name, "public": True, "description": "Created with Festify"},
        )
    print(f"[SPOTIFY] create_playlist → {resp.status_code}: {resp.text[:300]}", flush=True)
    if resp.status_code not in (200, 201):
        raise HTTPException(status_code=500, detail=f"Failed to create playlist: {resp.status_code} {resp.text}")
    return resp.json()


async def add_tracks_to_playlist(token: str, playlist_id: str, uris: list[str]) -> int:
    """Add tracks in batches of 100 (Spotify limit). Returns total added."""
    added = 0
    async with httpx.AsyncClient() as client:
        for i in range(0, len(uris), 100):
            batch = uris[i:i + 100]
            resp = await client.post(
                f"{SPOTIFY_API_BASE}/playlists/{playlist_id}/tracks",
                headers={"Authorization": f"Bearer {token}"},
                json={"uris": batch},
            )
            if resp.status_code in (200, 201):
                added += len(batch)
    return added
