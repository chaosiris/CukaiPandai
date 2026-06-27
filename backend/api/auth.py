"""Auth primitives — password hashing, signed JWTs, and Google ID-token verification.

Dependency-light by design: password hashing (PBKDF2-HMAC) and the HS256 JWT use only the
stdlib, so no network ``uv lock`` is forced for the prelim. Google ID-token verification needs
``google-auth`` (the optional ``auth-google`` extra) and a ``GOOGLE_CLIENT_ID``; it is lazy-imported
and config-gated, so the app, the email/password flow, and the tests run without it.
"""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import logging
import os
import secrets
import time

_PBKDF2_ROUNDS = 240_000
_TOKEN_TTL_SECONDS = 7 * 24 * 3600  # 7 days

_log = logging.getLogger("cukaipandai.auth")
_DEV_INSECURE_SECRET = "dev-insecure-secret-change-me"  # the old hardcoded default — never used as a key now
_ephemeral_secret: str | None = None


def _jwt_secret() -> str:
    """The HMAC key for signing/verifying JWTs.

    NEVER signs with a publicly-known or empty key (that would make every token forgeable -> account
    takeover; AUTH-1/AUTH-2). A configured AUTH_JWT_SECRET is used only if it is strong (>=32 chars and
    not the legacy dev value). Otherwise a RANDOM per-process secret is generated so tokens stay
    unforgeable; they will not survive a restart, so production / multi-instance deploys MUST set a
    strong AUTH_JWT_SECRET.
    """
    configured = os.getenv("AUTH_JWT_SECRET", "").strip()
    if configured and configured != _DEV_INSECURE_SECRET and len(configured) >= 32:
        return configured
    global _ephemeral_secret
    if _ephemeral_secret is None:
        _ephemeral_secret = secrets.token_hex(32)
        _log.warning(
            "AUTH_JWT_SECRET is unset/empty/weak (<32 chars) or the legacy dev value; using a random "
            "per-process key. Set a strong AUTH_JWT_SECRET (>=32 chars) for production / multi-instance."
        )
    return _ephemeral_secret


# --- Password hashing (PBKDF2-HMAC-SHA256) ---

def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, _PBKDF2_ROUNDS)
    return f"pbkdf2_sha256${_PBKDF2_ROUNDS}${salt.hex()}${dk.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        algo, rounds, salt_hex, hash_hex = stored.split("$")
        if algo != "pbkdf2_sha256":
            return False
        dk = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt_hex), int(rounds))
    except (ValueError, AttributeError):
        return False
    return hmac.compare_digest(dk.hex(), hash_hex)


# --- HS256 JWT (stdlib) ---

def _b64url(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode()


def _b64url_decode(seg: str) -> bytes:
    return base64.urlsafe_b64decode(seg + "=" * (-len(seg) % 4))


def create_token(sub: str, email: str, name: str) -> str:
    header = _b64url(json.dumps({"alg": "HS256", "typ": "JWT"}, separators=(",", ":")).encode())
    now = int(time.time())
    payload = _b64url(
        json.dumps(
            {"sub": sub, "email": email, "name": name, "iat": now, "exp": now + _TOKEN_TTL_SECONDS},
            separators=(",", ":"),
        ).encode()
    )
    signing_input = f"{header}.{payload}".encode()
    sig = _b64url(hmac.new(_jwt_secret().encode(), signing_input, hashlib.sha256).digest())
    return f"{header}.{payload}.{sig}"


def decode_token(token: str) -> dict | None:
    """Return the verified claims, or None if the signature is bad or the token is expired/malformed."""
    try:
        header, payload, sig = token.split(".")
    except (ValueError, AttributeError):
        return None
    expected = _b64url(
        hmac.new(_jwt_secret().encode(), f"{header}.{payload}".encode(), hashlib.sha256).digest()
    )
    if not hmac.compare_digest(sig, expected):
        return None
    try:
        claims = json.loads(_b64url_decode(payload))
    except (ValueError, json.JSONDecodeError):
        return None
    if int(claims.get("exp", 0)) < int(time.time()):
        return None
    return claims


# --- Google SSO (optional extra: google-auth; config-gated) ---

def google_configured() -> bool:
    return bool(os.getenv("GOOGLE_CLIENT_ID"))


def verify_google_id_token(id_token: str) -> dict | None:
    """Verify a Google ID token against GOOGLE_CLIENT_ID. Returns {email, name, sub} or None.

    None means "not configured / google-auth not installed / invalid token" — the caller maps the
    unconfigured case to 503 and an invalid token to 401.
    """
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    if not client_id:
        return None
    try:
        from google.auth.transport import requests as google_requests
        from google.oauth2 import id_token as google_id_token
    except ImportError:
        return None
    try:
        info = google_id_token.verify_oauth2_token(id_token, google_requests.Request(), client_id)
    except (ValueError, Exception):  # noqa: BLE001 — google-auth raises ValueError; be defensive
        return None
    if not info.get("email"):
        return None
    return {"email": info["email"], "name": info.get("name") or info["email"].split("@")[0], "sub": info.get("sub", "")}
