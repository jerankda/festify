> [!WARNING]
> **Spotify killed public access for independent developers.**
> As of May 2025, Spotify only grants extended API access to registered companies with 250,000+ monthly active users. Individual developers are permanently locked out. The hosted version at [festify.jerankda.dev](https://festify.jerankda.dev) can only serve a handful of allowlisted accounts as a result — not because the app is broken, but because Spotify decided small builders don't get to play anymore.
>
> **You can still use this.** Clone the repo, create your own free Spotify developer app, add your credentials to `.env`, and self-host it. See [Why the hosted version no longer works](#why-the-hosted-version-no-longer-works) below.

# festify

A small side project for building Spotify playlists from festival lineups. Upload a poster image and it reads the artists automatically, or search artists by name yourself. Pick how many tracks per artist, hit create, and the playlist shows up in your Spotify.

Live at [festify.jerankda.dev](https://festify.jerankda.dev)

---

## What it does

- Upload a festival poster — Gemini reads the artist names from the image
- Or search artists manually and add them one by one
- Choose top 5, 10, or 20 tracks per artist
- Toggle individual artists on or off before creating
- Playlist gets saved directly to your Spotify account via OAuth

---

## Stack

- **Frontend** — React + Vite + Tailwind CSS
- **Backend** — Python + FastAPI + uvicorn
- **Image scanning** — Gemini 2.5 Flash
- **Auth** — Spotify OAuth 2.0 (authorization code flow)
- **Deployment** — Docker, Nginx Proxy Manager, VPS

---

## Running locally

**Backend**

```bash
cd backend
cp ../.env.example .env   # fill in your keys
uvicorn main:app --reload --port 8000
```

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://127.0.0.1:5173`, backend at `http://127.0.0.1:8000`.

---

## Environment variables

Copy `.env.example` to `backend/.env` and fill in:

```
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
SPOTIFY_REDIRECT_URI=http://127.0.0.1:8000/auth/callback
GEMINI_API_KEY=
SECRET_KEY=
FRONTEND_URL=http://127.0.0.1:5173
```

For production, update `SPOTIFY_REDIRECT_URI` and `FRONTEND_URL` to your actual domains and add the redirect URI to your Spotify app settings.

---

## Why the hosted version no longer works

Spotify's developer platform has two modes: development mode (up to 5 allowlisted users) and extended quota mode (unlimited users). As of May 2025, Spotify only grants extended quota mode to registered organisations with an active service and at least 250k monthly active users — individuals can no longer apply.

This means the hosted version at [festify.jerankda.dev](https://festify.jerankda.dev) only works for allowlisted accounts. If you want to use it yourself, the easiest path is to self-host: create your own free Spotify developer app at [developer.spotify.com](https://developer.spotify.com), plug your own credentials into `.env`, and run it locally or on your own server. Your app will be in development mode with just you as the user, which works fine.

---

## Spotify notes

This runs under Spotify's development mode, which has a few quirks:

- `GET /artists/{id}/top-tracks` is restricted — top tracks are fetched via the search API instead
- `POST /playlists/{id}/tracks` is deprecated — use `/items`
- `GET /artists/{id}/albums` rejects limits above 10
- Search results are capped at around 10-20 tracks per artist in some markets

---

## Deployment

The repo includes `deploy/website-festify.yml`, a Docker Compose file matching a standard Nginx Proxy Manager setup. Build args pass `VITE_API_URL` into the frontend at build time so the API URL is baked into the static bundle.

```bash
docker-compose -f ~/docker/compose-files/website-festify.yml up -d --build
```

---

## Notes

The poster scanning uses the Gemini API which has a small cost per request. If you find festify useful, a small tip helps cover it: [buymeacoffee.com/jerankda](https://buymeacoffee.com/jerankda)

---

Made by [jerankda](https://jerankda.dev)
