"""
Clerk JWT verification for FastAPI routes.

Verifies tokens using Clerk's JWKS (fetched once per process and cached).
Provides a get_current_user dependency that upserts the User in the DB on first contact.
"""

from __future__ import annotations

import logging
import os
import time
from typing import Optional

import httpx
from fastapi import Depends, Header, HTTPException, status
from jose import jwt
from jose.exceptions import JWTError
from sqlalchemy.orm import Session

from db import get_db
from models.database import User

logger = logging.getLogger("ai-trainer.auth")

CLERK_ISSUER = os.getenv("CLERK_ISSUER")  # e.g. https://your-app.clerk.accounts.dev
CLERK_JWKS_URL = os.getenv("CLERK_JWKS_URL")  # optional override; default derives from issuer
CLERK_AUDIENCE = os.getenv("CLERK_AUDIENCE")  # optional; usually unset for Clerk session tokens


def _jwks_url() -> Optional[str]:
    if CLERK_JWKS_URL:
        return CLERK_JWKS_URL
    if CLERK_ISSUER:
        return f"{CLERK_ISSUER.rstrip('/')}/.well-known/jwks.json"
    return None


_jwks_cache: dict = {"keys": [], "fetched_at": 0.0}
JWKS_TTL_SECONDS = 3600  # refresh once per hour


def _get_jwks() -> dict:
    url = _jwks_url()
    if not url:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Auth not configured (missing CLERK_ISSUER / CLERK_JWKS_URL)",
        )
    now = time.time()
    if not _jwks_cache["keys"] or now - _jwks_cache["fetched_at"] > JWKS_TTL_SECONDS:
        try:
            r = httpx.get(url, timeout=10.0)
            r.raise_for_status()
            _jwks_cache["keys"] = r.json().get("keys", [])
            _jwks_cache["fetched_at"] = now
            logger.info("Fetched Clerk JWKS (%d keys)", len(_jwks_cache["keys"]))
        except Exception as e:
            logger.exception("Failed to fetch Clerk JWKS: %s", e)
            if not _jwks_cache["keys"]:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=f"Could not fetch Clerk JWKS: {e}",
                )
    return _jwks_cache


def _verify_jwt(token: str) -> dict:
    jwks = _get_jwks()
    try:
        header = jwt.get_unverified_header(token)
    except JWTError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Malformed token") from e
    kid = header.get("kid")
    key = next((k for k in jwks["keys"] if k.get("kid") == kid), None)
    if not key:
        # Try refreshing JWKS once in case keys rotated.
        _jwks_cache["fetched_at"] = 0
        jwks = _get_jwks()
        key = next((k for k in jwks["keys"] if k.get("kid") == kid), None)
    if not key:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unknown signing key")

    decode_opts = {"verify_aud": False}  # Clerk session tokens use 'azp' instead of 'aud'
    try:
        payload = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            issuer=CLERK_ISSUER,
            audience=CLERK_AUDIENCE,
            options=decode_opts,
        )
    except JWTError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid token: {e}") from e
    return payload


def _extract_token(authorization: Optional[str]) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return authorization.split(" ", 1)[1].strip()


def get_current_user(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
) -> User:
    """
    FastAPI dependency: verifies the Clerk JWT in Authorization header,
    upserts the User in the DB, and returns it. Raises 401 on auth failure.
    """
    token = _extract_token(authorization)
    payload = _verify_jwt(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token missing 'sub'")

    # Clerk includes these in session tokens when configured; otherwise None.
    email = payload.get("email") or payload.get("primary_email") or None
    name = payload.get("name") or payload.get("first_name") or None

    user = db.query(User).filter(User.id == user_id).first()
    from datetime import datetime
    now = datetime.utcnow()
    if not user:
        user = User(id=user_id, email=email, name=name, created_at=now, last_seen_at=now)
        db.add(user)
        db.commit()
        db.refresh(user)
        logger.info("Provisioned new user %s", user_id)
    else:
        # Light update — refresh email/name if Clerk provides them.
        changed = False
        if email and user.email != email:
            user.email = email
            changed = True
        if name and user.name != name:
            user.name = name
            changed = True
        user.last_seen_at = now
        if changed:
            logger.info("Updated user %s metadata", user_id)
        db.commit()
        db.refresh(user)
    return user
