"""
Zentinel Redis Cache Service
Caches frequently-read Supabase data to reduce egress costs.

Usage:
    from app.services.cache import get_cached, set_cached, invalidate

    # Read
    stats = get_cached(f"issue_stats:{org_id}")

    # Write (TTL in seconds)
    set_cached(f"issue_stats:{org_id}", stats, ttl=60)

    # Invalidate when data changes (e.g. after a scan completes)
    invalidate(f"issue_stats:{org_id}")
"""
import json
import os
from typing import Any, Optional

import redis

_client: Optional[redis.Redis] = None


def _get_client() -> redis.Redis:
    global _client
    if _client is None:
        _client = redis.from_url(
            os.environ.get("REDIS_URL", "redis://localhost:6379"),
            decode_responses=True,
            socket_connect_timeout=2,
            socket_timeout=2,
        )
    return _client


def get_cached(key: str) -> Optional[Any]:
    """Return parsed JSON value from cache, or None if missing/expired/error."""
    try:
        raw = _get_client().get(key)
        return json.loads(raw) if raw else None
    except Exception as e:
        print(f"[Cache] get error for {key}: {e}")
        return None


def set_cached(key: str, value: Any, ttl: int = 60) -> None:
    """Store JSON value with TTL (seconds). Fails silently — cache is best-effort."""
    try:
        _get_client().setex(key, ttl, json.dumps(value))
    except Exception as e:
        print(f"[Cache] set error for {key}: {e}")


def invalidate(key: str) -> None:
    """Delete a single cache key (call after writes that change the data)."""
    try:
        _get_client().delete(key)
    except Exception as e:
        print(f"[Cache] invalidate error for {key}: {e}")


def invalidate_org(org_id: str) -> None:
    """Invalidate all cache keys for an org (call after Day Zero scan completes)."""
    keys = [
        f"issue_stats:{org_id}",
        f"dayzero:scan_runs:{org_id}",
    ]
    try:
        _get_client().delete(*keys)
    except Exception as e:
        print(f"[Cache] invalidate_org error for {org_id}: {e}")


# ── Convenience wrappers for common patterns ──────────────────────────────────

def get_issue_stats(org_id: str) -> Optional[dict]:
    return get_cached(f"issue_stats:{org_id}")


def set_issue_stats(org_id: str, stats: dict, ttl: int = 60) -> None:
    set_cached(f"issue_stats:{org_id}", stats, ttl=ttl)
