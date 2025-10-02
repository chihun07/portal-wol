from __future__ import annotations
import os, json, pathlib, platform, subprocess
from typing import Dict, Optional

ROOT = pathlib.Path(__file__).resolve().parents[1]
APP_DIR = ROOT / "app"
STATIC_DIR = APP_DIR / "static"
TARGETS_FILE = APP_DIR / "targets.json"

def env(key: str, default: Optional[str]=None) -> Optional[str]:
    return os.getenv(key, default)

def ping_once(ip: str) -> bool:
    if not ip:
        return False
    system = platform.system().lower()
    if "windows" in system:
        cmd = ["ping", "-n", "1", "-w", "1000", ip]
    else:
        cmd = ["ping", "-c", "1", "-W", "1", ip]
    try:
        return subprocess.call(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL) == 0
    except Exception:
        return False

def load_targets() -> Dict[str, Dict[str, str]]:
    # 1) from targets.json if present
    t: Dict[str, Dict[str, str]] = {}
    if TARGETS_FILE.exists():
        try:
            t = json.loads(TARGETS_FILE.read_text(encoding="utf-8"))
        except Exception:
            t = {}
    # 2) merge single-target from env
    label = env("PC_LABEL")
    ip = env("PC_IP")
    mac = env("PC_MAC")
    if label and (ip or mac):
        t[label] = {"ip": ip, "mac": mac}
    return t