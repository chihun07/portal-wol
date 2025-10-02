from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

from ..config import STATIC_DIR, env


def _env_int(key: str, default: int) -> int:
    raw = env(key)
    if raw is None:
        return default
    try:
        return int(raw)
    except (TypeError, ValueError):
        return default


@dataclass(frozen=True)
class Settings:
    lan_iface: str
    broadcast: str
    wol_method: str
    log_path: Path
    log_retention_days: int
    log_max_limit: int
    host: str
    port: int
    static_dir: Path


@lru_cache()
def get_settings() -> Settings:
    log_path = Path(env("LOG_PATH", "logs/wol-web.jsonl"))
    log_path.parent.mkdir(parents=True, exist_ok=True)
    return Settings(
        lan_iface=env("LAN_IFACE", "eno1"),
        broadcast=env("BROADCAST", "192.168.219.255"),
        wol_method=env("WOL_METHOD", "python").lower(),
        log_path=log_path,
        log_retention_days=_env_int("LOG_RETENTION_DAYS", 7),
        log_max_limit=_env_int("LOG_MAX_LIMIT", 500),
        host=env("HOST", "127.0.0.1"),
        port=_env_int("PORT", 8000),
        static_dir=STATIC_DIR,
    )
