from __future__ import annotations

import socket
import subprocess
from typing import Any, Dict, List, Optional, Tuple, Union

from fastapi import HTTPException

from ..core.settings import get_settings
from .logs import log_event
from .targets import (
    discover_mac_for_ip,
    get_target_or_404,
    record_wake,
    set_target_mac,
)

CommandType = Union[str, List[str], Dict[str, Any]]


def trim_text(value: str, limit: int = 4000) -> str:
    value = value.strip()
    if len(value) <= limit:
        return value
    return value[: max(limit - 3, 0)] + "..."


def normalize_command_spec(spec: CommandType) -> Tuple[Union[List[str], str], bool, Optional[float], str]:
    shell = False
    timeout: Optional[float] = None
    description = ""
    if isinstance(spec, dict):
        cmd = spec.get("cmd") or spec.get("command")
        shell = bool(spec.get("shell", False))
        description = spec.get("desc") or spec.get("description") or ""
        timeout_value = spec.get("timeout")
        if timeout_value is not None:
            try:
                timeout = float(timeout_value)
            except (TypeError, ValueError):
                timeout = None
    elif isinstance(spec, list):
        cmd = spec
    else:
        cmd = spec
        shell = True
    if isinstance(cmd, list):
        cmd = [str(item) for item in cmd]
        if not cmd:
            raise ValueError("empty command list")
        if not description:
            description = " ".join(cmd)
    elif isinstance(cmd, str):
        cmd = cmd.strip()
        if not cmd:
            raise ValueError("empty command string")
        if not description:
            description = cmd
    else:
        raise ValueError("invalid command type")
    return cmd, shell, timeout, description


def send_magic_packet(mac: str, broadcast: str) -> None:
    mac_bytes = bytes.fromhex(mac.replace(":", "").replace("-", ""))
    packet = b"\xff" * 6 + mac_bytes * 16
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
        sock.sendto(packet, (broadcast, 9))
    finally:
        sock.close()


def wake_target(name: str) -> Dict[str, Any]:
    settings = get_settings()
    target = get_target_or_404(name)
    mac = target.get("mac")
    if not mac and target.get("ip"):
        discovered = discover_mac_for_ip(target["ip"])
        if discovered:
            updated = set_target_mac(name, discovered)
            mac = updated.get("mac")
            target = updated
    if not mac:
        raise HTTPException(400, detail={"error": "no mac for target", "target": name})
    if settings.wol_method == "etherwake":
        rc = subprocess.call(["/usr/sbin/etherwake", "-i", settings.lan_iface, mac])
        if rc != 0:
            raise HTTPException(500, "etherwake failed")
        method = "etherwake"
    else:
        send_magic_packet(mac, settings.broadcast)
        method = "magic-packet"
    log_event({
        "evt": "wake",
        "target": name,
        "mac": mac,
        "from": "api",
        "method": method,
    })
    record_wake(name)
    return {"ok": True, "sent": method, "target": name}


def execute_target_command(name: str, action: str) -> Dict[str, Any]:
    target = get_target_or_404(name)
    spec = target.get(action)
    if spec is None:
        raise HTTPException(400, f"no {action} command configured for target")
    try:
        cmd, use_shell, timeout, description = normalize_command_spec(spec)
    except ValueError as exc:
        raise HTTPException(400, detail=f"invalid {action} command: {exc}") from exc
    try:
        result = subprocess.run(
            cmd,
            shell=use_shell,
            timeout=timeout,
            check=False,
            capture_output=True,
            text=True,
        )
    except subprocess.TimeoutExpired as exc:
        log_event({
            "evt": action,
            "target": name,
            "from": "api",
            "command": description,
            "error": "timeout",
            "timeout": timeout,
        })
        raise HTTPException(504, detail=f"{action} command timed out") from exc
    except OSError as exc:
        log_event({
            "evt": action,
            "target": name,
            "from": "api",
            "command": description,
            "error": "oserror",
            "message": str(exc),
        })
        raise HTTPException(500, detail=f"{action} command failed to start") from exc

    stdout = result.stdout or ""
    stderr = result.stderr or ""
    log_payload = {
        "evt": action,
        "target": name,
        "from": "api",
        "command": description,
        "rc": result.returncode,
    }
    if stdout:
        log_payload["stdout"] = trim_text(stdout)
    if stderr:
        log_payload["stderr"] = trim_text(stderr)
    log_event(log_payload)

    if result.returncode != 0:
        raise HTTPException(
            500,
            detail={
                "error": f"{action} command failed",
                "returncode": result.returncode,
                "stdout": trim_text(stdout, 1000),
                "stderr": trim_text(stderr, 1000),
            },
        )
    return {
        "ok": True,
        "action": action,
        "target": name,
        "returncode": result.returncode,
        "stdout": stdout,
        "stderr": stderr,
        "command": description,
    }
