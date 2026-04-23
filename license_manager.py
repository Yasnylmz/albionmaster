import hashlib
import json
import os
import platform
import ssl
import socket
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib import error, request

try:
    import certifi
except Exception:  # pragma: no cover - optional at runtime
    certifi = None


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _parse_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        normalized = value.replace("Z", "+00:00")
        parsed = datetime.fromisoformat(normalized)
        if parsed.tzinfo is None:
            # D1 datetime('now', '+N day') often returns timezone-less values.
            parsed = parsed.replace(tzinfo=timezone.utc)
        return parsed
    except Exception:
        return None


def _to_iso(value: datetime | None) -> str | None:
    if not value:
        return None
    return value.astimezone(timezone.utc).isoformat()


def _normalize_membership_type(membership_type: str | None) -> str | None:
    """Map old membership type names to new ones."""
    if not membership_type:
        return membership_type
    
    type_mapping = {
        "flip_100k": "flip_60k",
        "flip_100": "flip_60k",
        "flip_250k": "flip_160k",
        "flip_250": "flip_160k",
    }
    
    normalized = str(membership_type).strip().lower()
    return type_mapping.get(normalized, membership_type)


def _entitlements_from_membership_type(membership_type: str | None) -> dict:
    normalized = str(membership_type or "").strip().lower()
    ent = {
        "package_code": "restricted",
        "modules": {
            "flipper": False,
            "crafting": False,
            "island": False,
        },
        "flip": {
            "max_visible_profit": 0,
            "total_visible_profit_limit": 0,
            "can_edit_profit_filters": False,
            "can_use_basic_profit_filters": False,
            "can_use_direct_action": False,
            "can_view_flip_summary": False,
            "can_view_enchant_detail": False,
        },
        "admin": {
            "is_admin": False,
            "can_seed_demo_data": False,
        },
    }

    if normalized in ("flip_100k", "flip_60k"):
        ent["package_code"] = "flip_60k"
        ent["modules"] = {"flipper": True, "crafting": False, "island": False}
        ent["flip"]["max_visible_profit"] = 50000
        ent["flip"]["total_visible_profit_limit"] = 500000
        return ent
    if normalized in ("flip_250k", "flip_160k"):
        ent["package_code"] = "flip_160k"
        ent["modules"] = {"flipper": True, "crafting": False, "island": False}
        ent["flip"]["max_visible_profit"] = 150000
        ent["flip"]["total_visible_profit_limit"] = 1000000
        ent["flip"]["can_use_basic_profit_filters"] = True
        ent["flip"]["can_use_direct_action"] = True
        ent["flip"]["can_view_flip_summary"] = True
        return ent
    if normalized == "flip_unlimited":
        ent["package_code"] = "flip_unlimited"
        ent["modules"] = {"flipper": True, "crafting": False, "island": False}
        ent["flip"]["max_visible_profit"] = None
        ent["flip"]["can_edit_profit_filters"] = True
        ent["flip"]["can_use_basic_profit_filters"] = True
        ent["flip"]["can_use_direct_action"] = True
        ent["flip"]["can_view_flip_summary"] = True
        ent["flip"]["can_view_enchant_detail"] = True
        return ent
    if normalized == "craft_only":
        ent["package_code"] = "craft_only"
        ent["modules"] = {"flipper": False, "crafting": True, "island": False}
        return ent
    if normalized == "island_only":
        ent["package_code"] = "island_only"
        ent["modules"] = {"flipper": False, "crafting": False, "island": True}
        return ent
    if normalized == "craft_island":
        ent["package_code"] = "craft_island"
        ent["modules"] = {"flipper": False, "crafting": True, "island": True}
        return ent
    if normalized == "all_access":
        ent["package_code"] = "all_access"
        ent["modules"] = {"flipper": True, "crafting": True, "island": True}
        ent["flip"]["max_visible_profit"] = None
        ent["flip"]["can_edit_profit_filters"] = True
        ent["flip"]["can_use_basic_profit_filters"] = True
        ent["flip"]["can_use_direct_action"] = True
        ent["flip"]["can_view_flip_summary"] = True
        ent["flip"]["can_view_enchant_detail"] = True
        return ent
    if normalized == "admin":
        ent["package_code"] = "admin"
        ent["modules"] = {"flipper": True, "crafting": True, "island": True}
        ent["flip"]["max_visible_profit"] = None
        ent["flip"]["can_edit_profit_filters"] = True
        ent["flip"]["can_use_basic_profit_filters"] = True
        ent["flip"]["can_use_direct_action"] = True
        ent["flip"]["can_view_flip_summary"] = True
        ent["flip"]["can_view_enchant_detail"] = True
        ent["admin"] = {
            "is_admin": True,
            "can_seed_demo_data": True,
        }
        return ent
    return ent


def _resolved_entitlements(membership_type: str | None, raw_entitlements: dict | None) -> dict:
    base = _entitlements_from_membership_type(membership_type)
    raw = raw_entitlements if isinstance(raw_entitlements, dict) else {}
    if not raw:
        return base

    raw_package = str(raw.get("package_code") or "").strip().lower()
    base_package = str(base.get("package_code") or "").strip().lower()

    # If server/cache still returns old restricted entitlements for a newer package,
    # trust the membership_type-derived package instead of locking the user out.
    if base_package != "restricted" and raw_package in ("", "restricted"):
        return base

    modules = raw.get("modules") if isinstance(raw.get("modules"), dict) else {}
    flip = raw.get("flip") if isinstance(raw.get("flip"), dict) else {}
    admin = raw.get("admin") if isinstance(raw.get("admin"), dict) else {}

    merged = {
        "package_code": raw.get("package_code") or base.get("package_code"),
        "modules": {
            "flipper": bool(modules.get("flipper", base["modules"]["flipper"])),
            "crafting": bool(modules.get("crafting", base["modules"]["crafting"])),
            "island": bool(modules.get("island", base["modules"]["island"])),
        },
        "flip": {
            "max_visible_profit": flip.get("max_visible_profit", base["flip"]["max_visible_profit"]),
            "total_visible_profit_limit": flip.get(
                "total_visible_profit_limit",
                base["flip"]["total_visible_profit_limit"],
            ),
            "can_edit_profit_filters": bool(
                flip.get("can_edit_profit_filters", base["flip"]["can_edit_profit_filters"])
            ),
            "can_use_basic_profit_filters": bool(
                flip.get(
                    "can_use_basic_profit_filters",
                    base["flip"]["can_use_basic_profit_filters"],
                )
            ),
            "can_use_direct_action": bool(
                flip.get("can_use_direct_action", base["flip"]["can_use_direct_action"])
            ),
            "can_view_flip_summary": bool(
                flip.get("can_view_flip_summary", base["flip"]["can_view_flip_summary"])
            ),
            "can_view_enchant_detail": bool(
                flip.get("can_view_enchant_detail", base["flip"]["can_view_enchant_detail"])
            ),
        },
        "admin": {
            "is_admin": bool(admin.get("is_admin", base.get("admin", {}).get("is_admin", False))),
            "can_seed_demo_data": bool(
                admin.get(
                    "can_seed_demo_data",
                    base.get("admin", {}).get("can_seed_demo_data", False),
                )
            ),
        },
    }
    return merged



class LicenseManager:
    DEFAULT_LICENSE_API_URL = "https://albion-license-api.albionmaster.workers.dev/verify-license"
    CLOCK_SKEW_TOLERANCE = timedelta(minutes=5)

    def __init__(self, config_dir: Path, load_config):
        self._config_dir = config_dir
        self._load_config = load_config
        self._cache_path = config_dir / "license_cache.json"
        self._debug_log_path = config_dir / "license_debug.log"

    def is_enabled(self) -> bool:
        cfg = self._load_config() or {}
        return bool(cfg.get("license_enabled", True))

    def get_device_id(self) -> str:
        raw = "|".join(
            [
                os.getenv("USERNAME", ""),
                socket.gethostname(),
                platform.system(),
                platform.release(),
                str(uuid.getnode()),
            ]
        )
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:24]

    def load_cache(self) -> dict:
        if not self._cache_path.exists():
            return {}
        try:
            return json.loads(self._cache_path.read_text(encoding="utf-8"))
        except Exception:
            return {}

    def save_cache(self, data: dict) -> None:
        self._cache_path.write_text(
            json.dumps(data, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

    def clear_cache(self) -> None:
        try:
            if self._cache_path.exists():
                self._cache_path.unlink()
        except Exception:
            pass

    def _write_debug_log(self, event: str, details: dict | None = None) -> None:
        payload = {
            "time": _utc_now().isoformat(),
            "event": event,
            "details": details or {},
        }
        try:
            with self._debug_log_path.open("a", encoding="utf-8") as handle:
                handle.write(json.dumps(payload, ensure_ascii=False) + "\n")
        except Exception:
            pass

    def _ssl_context(self):
        if certifi is not None:
            try:
                return ssl.create_default_context(cafile=certifi.where())
            except Exception:
                pass
        try:
            return ssl.create_default_context()
        except Exception:
            return None

    def _friendly_network_error_message(self, exc: Exception) -> str:
        name = type(exc).__name__
        text = str(exc or "").strip().lower()

        if "timed out" in text or name == "TimeoutError":
            return "License server unavailable. Connection timed out."
        if "certificate" in text or "ssl" in text or name == "SSLCertVerificationError":
            return "License server unavailable. SSL verification failed."
        if "name or service not known" in text or "nodename nor servname" in text or "getaddrinfo" in text or name == "gaierror":
            return "License server unavailable. DNS lookup failed."
        if "connection refused" in text:
            return "License server unavailable. Connection was refused."
        if "reset" in text:
            return "License server unavailable. Connection was reset."
        if "unreachable" in text:
            return "License server unavailable. Network is unreachable."
        if "urlopen error" in text or name == "URLError":
            return "License server unavailable. Network request failed."
        return "License server unavailable. Unexpected network error."

    def get_status(self) -> dict:
        device_id = self.get_device_id()
        if not self.is_enabled():
            return {
                "enabled": False,
                "valid": True,
                "device_id": device_id,
                "message": "License system disabled.",
                "bypassed": True,
            }

        cache = self.load_cache()
        expires_at = _parse_dt(cache.get("expires_at"))
        grace_until = _parse_dt(cache.get("grace_until"))
        last_verified_at = _parse_dt(cache.get("last_verified_at"))
        now = _utc_now()

        if (
            last_verified_at
            and now + self.CLOCK_SKEW_TOLERANCE < last_verified_at
        ):
            self._write_debug_log(
                "clock_rollback_detected",
                {
                    "now": _to_iso(now),
                    "last_verified_at": _to_iso(last_verified_at),
                    "tolerance_seconds": int(self.CLOCK_SKEW_TOLERANCE.total_seconds()),
                },
            )
            return {
                "enabled": True,
                "valid": False,
                "device_id": device_id,
                "license_key": cache.get("license_key", ""),
                "expires_at": cache.get("expires_at"),
                "membership_type": _normalize_membership_type(cache.get("membership_type")),
                "duration_days": cache.get("duration_days"),
                "entitlements": cache.get("entitlements") or _entitlements_from_membership_type(cache.get("membership_type")),
                "grace_until": cache.get("grace_until"),
                "last_verified_at": cache.get("last_verified_at"),
                "message": "System clock appears to be behind the last verification time. Please correct your date/time settings.",
                "bypassed": False,
            }

        is_valid = False
        message = "No active license."
        if expires_at and expires_at > now:
            is_valid = True
            message = "License active."
        elif grace_until and grace_until > now:
            is_valid = True
            message = "Offline grace active."
        elif cache.get("license_key"):
            message = "License expired."

        status = {
            "enabled": True,
            "valid": is_valid,
            "device_id": device_id,
            "license_key": cache.get("license_key", ""),
            "expires_at": cache.get("expires_at"),
            "membership_type": _normalize_membership_type(cache.get("membership_type")),
            "duration_days": cache.get("duration_days"),
            "entitlements": _resolved_entitlements(cache.get("membership_type"), cache.get("entitlements")),
            "grace_until": cache.get("grace_until"),
            "last_verified_at": cache.get("last_verified_at"),
            "message": message,
            "bypassed": False,
        }

        # Always re-validate cached key against server when possible.
        # This ensures admin-side disable/revoke takes effect immediately.
        cached_key = str(cache.get("license_key") or "").strip()
        if not cached_key:
            return status

        verify = self._verify_with_server(cached_key, cached_status=status)
        if verify.get("ok") and verify.get("valid"):
            grace_days = int(verify.get("grace_days") or 7)
            refreshed = {
                "license_key": cached_key,
                "device_id": device_id,
                "expires_at": verify.get("expires_at") or cache.get("expires_at"),
                "membership_type": _normalize_membership_type(verify.get("membership_type") or cache.get("membership_type")),
                "duration_days": verify.get("duration_days") or cache.get("duration_days"),
                "entitlements": _resolved_entitlements(
                    verify.get("membership_type") or cache.get("membership_type"),
                    verify.get("entitlements") or cache.get("entitlements"),
                ),
                "grace_until": _to_iso(now + timedelta(days=grace_days)),
                "last_verified_at": _to_iso(now),
            }
            self.save_cache(refreshed)
            status.update(
                {
                    "valid": True,
                    "expires_at": refreshed["expires_at"],
                    "membership_type": refreshed.get("membership_type"),
                    "duration_days": refreshed.get("duration_days"),
                    "entitlements": refreshed.get("entitlements") or {},
                    "grace_until": refreshed["grace_until"],
                    "last_verified_at": refreshed["last_verified_at"],
                    "message": verify.get("message") or "License active.",
                }
            )
            return status

        lowered = (verify.get("message") or "").lower()
        should_revoke = any(
            key in lowered
            for key in (
                "disabled",
                "expired",
                "invalid",
                "not found",
                "another device",
            )
        )
        if should_revoke:
            self.clear_cache()
            return {
                "enabled": True,
                "valid": False,
                "device_id": device_id,
                "license_key": "",
                "expires_at": None,
                "grace_until": None,
                "last_verified_at": None,
                "message": verify.get("message") or "License invalid.",
                "bypassed": False,
            }

        # Keep cached status only for temporary server/network problems.
        if verify.get("message"):
            status["message"] = verify.get("message")
        return status

    def activate(self, license_key: str) -> dict:
        license_key = str(license_key or "").strip()
        if not self.is_enabled():
            return {
                "ok": True,
                "valid": True,
                "message": "License system disabled.",
                "bypassed": True,
            }
        if not license_key:
            return {
                "ok": False,
                "valid": False,
                "message": "License key required.",
            }

        verify = self._verify_with_server(license_key)
        if not verify.get("ok"):
            return verify

        now = _utc_now()
        grace_days = int(verify.get("grace_days") or 7)
        payload = {
            "license_key": license_key,
            "device_id": self.get_device_id(),
            "expires_at": verify.get("expires_at"),
            "membership_type": _normalize_membership_type(verify.get("membership_type")),
            "duration_days": verify.get("duration_days"),
            "entitlements": _resolved_entitlements(
                verify.get("membership_type"),
                verify.get("entitlements"),
            ),
            "grace_until": _to_iso(now + timedelta(days=grace_days)),
            "last_verified_at": _to_iso(now),
        }
        self.save_cache(payload)
        return {
            "ok": True,
            "valid": True,
            "message": verify.get("message") or "License activated.",
            "expires_at": payload["expires_at"],
            "membership_type": payload.get("membership_type"),
            "duration_days": payload.get("duration_days"),
            "entitlements": payload.get("entitlements") or _entitlements_from_membership_type(payload.get("membership_type")),
            "grace_until": payload["grace_until"],
        }

    def _verify_with_server(self, license_key: str, cached_status: dict | None = None) -> dict:
        cfg = self._load_config() or {}
        api_url = str(cfg.get("license_api_url") or self.DEFAULT_LICENSE_API_URL).strip()
        if not api_url:
            self._write_debug_log(
                "license_api_missing",
                {
                    "has_config": bool(cfg),
                },
            )
            return {
                "ok": False,
                "valid": False,
                "message": "License API not configured.",
            }

        payload = {
            "license_key": license_key,
            "device_id": self.get_device_id(),
            "app_version": str(cfg.get("app_version") or "local"),
        }
        body = json.dumps(payload).encode("utf-8")
        req = request.Request(
            api_url,
            data=body,
            headers={
                "Content-Type": "application/json",
                "Accept": "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) AlbionMaster/5.1 Safari/537.36",
            },
            method="POST",
        )
        try:
            with request.urlopen(req, timeout=8, context=self._ssl_context()) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            self._write_debug_log(
                "verify_success",
                {
                    "api_url": api_url,
                    "http_valid": bool(data.get("valid")),
                    "message": data.get("message"),
                    "membership_type": data.get("membership_type"),
                },
            )
        except error.HTTPError as exc:
            raw_body = ""
            try:
                raw_body = exc.read().decode("utf-8")
            except Exception:
                raw_body = ""
            try:
                data = json.loads(raw_body)
            except Exception:
                data = {}
            self._write_debug_log(
                "verify_http_error",
                {
                    "api_url": api_url,
                    "status": exc.code,
                    "body": raw_body[:500],
                    "message": data.get("message"),
                },
            )
            return {
                "ok": False,
                "valid": False,
                "message": data.get("message")
                or f"License verification failed. HTTP {exc.code}{(': ' + raw_body[:220]) if raw_body else ''}",
            }
        except Exception as exc:
            self._write_debug_log(
                "verify_exception",
                {
                    "api_url": api_url,
                    "error_type": type(exc).__name__,
                    "error": str(exc),
                    "offline_grace": bool((cached_status or {}).get("valid")),
                },
            )
            current = cached_status or {}
            if current.get("valid"):
                return {
                    "ok": True,
                    "valid": True,
                    "message": "Server unavailable. Offline grace active.",
                    "expires_at": current.get("expires_at"),
                    "grace_days": 7,
                }
            return {
                "ok": False,
                "valid": False,
                "message": self._friendly_network_error_message(exc),
            }

        if not data.get("valid"):
            return {
                "ok": False,
                "valid": False,
                "message": data.get("message") or "License invalid.",
            }

        return {
            "ok": True,
            "valid": True,
            "message": data.get("message") or "License verified.",
            "expires_at": data.get("expires_at"),
            "membership_type": data.get("membership_type"),
            "duration_days": data.get("duration_days"),
            "entitlements": data.get("entitlements") or {},
            "grace_days": data.get("grace_days", 7),
        }
