import base64
import json
import os
import re

import httpx
from fastapi import HTTPException
from config import GEMINI_API_KEY

GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-2.0-flash:generateContent"
)

PROMPT = (
    "Look at this festival poster image. Extract and return ONLY a JSON array "
    "of artist and band names you can see. Ignore sponsor names, presenter text, "
    "stage names, dates, and locations. Return only the performer names. "
    'Example format: ["Arctic Monkeys", "Tame Impala", "Bicep"]. '
    "Return nothing else — no explanation, just the JSON array."
)


async def extract_artists_from_image(image_bytes: bytes, content_type: str) -> list[str]:
    encoded = base64.b64encode(image_bytes).decode()

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": PROMPT},
                    {
                        "inline_data": {
                            "mime_type": content_type,
                            "data": encoded,
                        }
                    },
                ]
            }
        ]
    }

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            GEMINI_URL,
            params={"key": GEMINI_API_KEY},
            json=payload,
        )

    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail=f"Gemini API error {resp.status_code}: {resp.text}")

    text = resp.json()["candidates"][0]["content"]["parts"][0]["text"].strip()

    # Extract the JSON array even if Gemini wraps it in markdown
    match = re.search(r"\[.*\]", text, re.DOTALL)
    if not match:
        raise HTTPException(status_code=422, detail="Could not parse artist list from image.")

    try:
        artists = json.loads(match.group())
        return [a.strip() for a in artists if isinstance(a, str) and a.strip()]
    except json.JSONDecodeError:
        raise HTTPException(status_code=422, detail="Could not parse artist list from image.")
