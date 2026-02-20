import base64
import hashlib
import os
import time
import urllib.parse

import httpx
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse, RedirectResponse

from config import (
    SECRET_KEY,
    SPOTIFY_API_BASE,
    SPOTIFY_AUTH_URL,
    SPOTIFY_CLIENT_ID,
    SPOTIFY_CLIENT_SECRET,
    SPOTIFY_REDIRECT_URI,
    SPOTIFY_SCOPES,
    SPOTIFY_TOKEN_URL,
)

router = APIRouter(prefix="/auth")

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _basic_auth_header() -> str:
    raw = f"{SPOTIFY_CLIENT_ID}:{SPOTIFY_CLIENT_SECRET}"
    return "Basic " + base64.b64encode(raw.encode()).decode()


def _generate_state() -> str:
    return base64.urlsafe_b64encode(os.urandom(16)).decode()


def _set_tokens(session: dict, data: dict) -> None:
    """Store token data in the session, adding an absolute expiry timestamp."""
    session["access_token"] = data["access_token"]
    session["refresh_token"] = data.get("refresh_token") or session.get("refresh_token")
    session["expires_at"] = int(time.time()) + int(data["expires_in"]) - 60  # 60s buffer


async def _refresh_access_token(session: dict) -> None:
    """Exchange a refresh token for a new access token and update the session."""
    refresh_token = session.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=401, detail="No refresh token — please log in again.")

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            SPOTIFY_TOKEN_URL,
            headers={"Authorization": _basic_auth_header()},
            data={"grant_type": "refresh_token", "refresh_token": refresh_token},
        )

    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Token refresh failed — please log in again.")

    _set_tokens(session, resp.json())


async def get_valid_token(session: dict) -> str:
    """Return a valid access token, refreshing it first if expired."""
    if not session.get("access_token"):
        raise HTTPException(status_code=401, detail="Not authenticated.")

    if time.time() >= session.get("expires_at", 0):
        await _refresh_access_token(session)

    return session["access_token"]


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get("/login")
def login(request: Request):
    """Redirect the user to the Spotify authorization page."""
    state = _generate_state()
    request.session["oauth_state"] = state

    params = {
        "client_id": SPOTIFY_CLIENT_ID,
        "response_type": "code",
        "redirect_uri": SPOTIFY_REDIRECT_URI,
        "scope": SPOTIFY_SCOPES,
        "state": state,
        "show_dialog": "true",
    }
    url = SPOTIFY_AUTH_URL + "?" + urllib.parse.urlencode(params)
    return RedirectResponse(url)


@router.get("/callback")
async def callback(request: Request, code: str = None, state: str = None, error: str = None):
    """Handle the OAuth callback from Spotify."""
    if error:
        raise HTTPException(status_code=400, detail=f"Spotify auth error: {error}")

    stored_state = request.session.pop("oauth_state", None)
    if not state or state != stored_state:
        raise HTTPException(status_code=400, detail="State mismatch — possible CSRF attack.")

    if not code:
        raise HTTPException(status_code=400, detail="No authorization code received.")

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            SPOTIFY_TOKEN_URL,
            headers={"Authorization": _basic_auth_header()},
            data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": SPOTIFY_REDIRECT_URI,
            },
        )

    if resp.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to exchange code for token.")

    _set_tokens(request.session, resp.json())

    # Redirect to the frontend after successful login
    return RedirectResponse("http://127.0.0.1:5173")


@router.get("/logout")
def logout(request: Request):
    request.session.clear()
    return RedirectResponse("http://127.0.0.1:5173")


@router.get("/me")
async def me(request: Request):
    """Return the currently authenticated Spotify user's profile."""
    token = await get_valid_token(request.session)

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{SPOTIFY_API_BASE}/me",
            headers={"Authorization": f"Bearer {token}"},
        )

    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail="Failed to fetch user profile.")

    data = resp.json()
    return {
        "id": data["id"],
        "display_name": data.get("display_name"),
        "email": data.get("email"),
        "image": data["images"][0]["url"] if data.get("images") else None,
    }


@router.get("/status")
async def status(request: Request):
    """Quick check — is the session authenticated?"""
    if not request.session.get("access_token"):
        return {"authenticated": False}
    return {"authenticated": True}
