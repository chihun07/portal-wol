from __future__ import annotations

import json
import threading
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from ..core.settings import get_settings

_LOG_LOCK = threading.Lock()
_LAST_PRUNE_TS = 0.0


def _current_ts() -> str:
    return datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds")


def _parse_ts(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    for fmt in ("%Y-%m-%dT%H:%M:%S%z", "%Y-%m-%dT%H:%M:%S.%f%z"):
        try:
            parsed = datetime.strptime(value, fmt)
            return parsed.astimezone(timezone.utc)
        except ValueError:
            continue
    try:
        parsed = datetime.fromisoformat(value)
    except ValueError:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _prune_logs_locked(log_path: Path, cutoff: datetime) -> None:
    if not log_path.exists():
        return
    kept_lines: List[str] = []
    with log_path.open("r", encoding="utf-8") as stream:
        for raw_line in stream:
            line = raw_line.strip()
            if not line:
                continue
            try:
                data = json.loads(line)
            except Exception:
                continue
            ts = _parse_ts(data.get("ts"))
            if ts is None or ts >= cutoff:
                if ts is not None:
                    data["ts"] = ts.astimezone().isoformat(timespec="seconds")
                kept_lines.append(json.dumps(data, ensure_ascii=False))
    output = "\n".join(kept_lines)
    if output:
        output += "\n"
    log_path.write_text(output, encoding="utf-8")


def _maybe_prune_locked(now_epoch: float, retention_days: int, log_path: Path) -> None:
    global _LAST_PRUNE_TS
    if retention_days <= 0:
        return
    if _LAST_PRUNE_TS and now_epoch - _LAST_PRUNE_TS < 600:
        return
    _LAST_PRUNE_TS = now_epoch
    cutoff = datetime.now(timezone.utc) - timedelta(days=retention_days)
    _prune_logs_locked(log_path, cutoff)


def log_event(evt: Dict[str, Any]) -> None:
    settings = get_settings()
    log_path = settings.log_path
    evt["ts"] = _current_ts()
    line = json.dumps(evt, ensure_ascii=False)
    now_epoch = time.time()
    with _LOG_LOCK:
        log_path.parent.mkdir(parents=True, exist_ok=True)
        with log_path.open("a", encoding="utf-8") as stream:
            stream.write(line + "\n")
        _maybe_prune_locked(now_epoch, settings.log_retention_days, log_path)


def read_logs(limit: int) -> List[Dict[str, Any]]:
    settings = get_settings()
    log_path = settings.log_path
    with _LOG_LOCK:
        _maybe_prune_locked(time.time(), settings.log_retention_days, log_path)
        if not log_path.exists():
            return []
        raw_lines = log_path.read_text(encoding="utf-8").splitlines()
    entries: List[Tuple[datetime, Dict[str, Any]]] = []
    for line in raw_lines:
        if not line.strip():
            continue
        try:
            data = json.loads(line)
        except Exception:
            continue
        ts = _parse_ts(data.get("ts"))
        if ts is not None:
            data["ts"] = ts.astimezone().isoformat(timespec="seconds")
        entries.append((ts or datetime.fromtimestamp(0, tz=timezone.utc), data))
    entries.sort(key=lambda item: item[0], reverse=True)
    limit = settings.log_max_limit if limit <= 0 else min(limit, settings.log_max_limit)
    return [item[1] for item in entries[:limit]]
