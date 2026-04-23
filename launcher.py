import asyncio
import json
import os
import socket
import subprocess
import sys
import threading
import time
import webbrowser
from pathlib import Path
from urllib import error, request as urllib_request

import webview
import websockets
from aiohttp import web
from license_manager import LicenseManager

APP_NAME = "AlbionMaster"
APP_VERSION = "1.5.2"
UI_PORT = 8000
WS_PORT = 8080
ADC_PORT = 4223

clients = set()
stats = {"packets_received": 0, "orders_forwarded": 0, "start_time": time.time()}
adc_process = None
server_error = None
adc_status_message = "ADC durumu bilinmiyor."
license_manager = None
main_window_api = None


def app_base_dir() -> Path:
    if getattr(sys, "frozen", False):
        return Path(sys._MEIPASS)  # type: ignore[attr-defined]
    return Path(__file__).resolve().parent


def runtime_base_dir() -> Path:
    if getattr(sys, "frozen", False):
        return Path(sys.executable).resolve().parent
    return Path(__file__).resolve().parent


def resolve_resource(*parts: str) -> Path:
    runtime_candidate = runtime_base_dir().joinpath(*parts)
    if runtime_candidate.exists():
        return runtime_candidate
    bundled_candidate = app_base_dir().joinpath(*parts)
    if bundled_candidate.exists():
        return bundled_candidate
    return runtime_candidate


def config_dir() -> Path:
    base = Path(os.getenv("APPDATA", Path.home()))
    target = base / APP_NAME
    target.mkdir(parents=True, exist_ok=True)
    return target


def config_path() -> Path:
    return config_dir() / "config.json"


def profit_log_path() -> Path:
    return config_dir() / "profit_log.json"


def cleanup_runtime_logs() -> int:
    deleted = 0
    for path in config_dir().glob("*.log"):
        if path.name == "license_debug.log":
            continue
        try:
            if path.is_file():
                path.unlink()
                deleted += 1
        except Exception:
            pass
    return deleted


def normalize_config(data: dict) -> tuple[dict, bool]:
    cfg = dict(data or {})
    changed = False

    raw_license_api_url = str(cfg.get("license_api_url") or "").strip()
    if raw_license_api_url and "albion-license-api.albionlicense.workers.dev" in raw_license_api_url:
        cfg["license_api_url"] = raw_license_api_url.replace(
            "albion-license-api.albionlicense.workers.dev",
            "albion-license-api.albionmaster.workers.dev",
        )
        changed = True

    return cfg, changed


def load_config() -> dict:
    path = config_path()
    if not path.exists():
        return {}
    try:
        loaded = json.loads(path.read_text(encoding="utf-8"))
        normalized, changed = normalize_config(loaded)
        if changed:
            save_config(normalized)
        return normalized
    except Exception:
        return {}


def save_config(data: dict) -> None:
    config_path().write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def load_profit_log() -> list:
    path = profit_log_path()
    if not path.exists():
        return []
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return data if isinstance(data, list) else []
    except Exception:
        return []


def save_profit_log(entries: list) -> None:
    safe_entries = entries if isinstance(entries, list) else []
    profit_log_path().write_text(
        json.dumps(safe_entries, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def get_license_manager() -> LicenseManager:
    global license_manager
    if license_manager is None:
        license_manager = LicenseManager(config_dir(), load_config)
    return license_manager


def _parse_version(value: str) -> tuple[int, ...]:
    cleaned = "".join(ch if (ch.isdigit() or ch == ".") else "" for ch in str(value or "").strip())
    parts = [part for part in cleaned.split(".") if part != ""]
    if not parts:
        return (0,)
    try:
        return tuple(int(part) for part in parts)
    except Exception:
        return (0,)


def get_update_status() -> dict:
    cfg = load_config() or {}
    default_manifest_url = "https://silvermaker.albionmaster.workers.dev/update.json"
    manifest_url = str(cfg.get("update_manifest_url") or default_manifest_url).strip()
    current_version = str(cfg.get("app_version") or APP_VERSION).strip() or APP_VERSION

    base_payload = {
        "enabled": bool(manifest_url),
        "current_version": current_version,
        "update_available": False,
        "latest_version": current_version,
        "notes": "",
        "url": "",
        "changelog_url": "",
        "message": "",
    }

    if not manifest_url:
        base_payload["message"] = "Update manifest not configured."
        return base_payload

    req = urllib_request.Request(
        manifest_url,
        headers={
            "Accept": "application/json",
            "User-Agent": f"AlbionMaster/{APP_VERSION}",
        },
        method="GET",
    )
    try:
        with urllib_request.urlopen(req, timeout=8) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except error.HTTPError as exc:
        base_payload["message"] = f"Update check failed ({exc.code})."
        return base_payload
    except Exception:
        base_payload["message"] = "Update status could not be checked."
        return base_payload

    latest_version = str(data.get("version") or current_version).strip() or current_version
    download_url = str(data.get("url") or "").strip()
    changelog_url = str(data.get("changelog_url") or "").strip()
    notes = str(data.get("notes") or "").strip()
    force_update = bool(data.get("force_update"))
    update_available = _parse_version(latest_version) > _parse_version(current_version)

    return {
        "enabled": True,
        "current_version": current_version,
        "update_available": update_available,
        "latest_version": latest_version,
        "notes": notes,
        "url": download_url,
        "changelog_url": changelog_url,
        "force_update": force_update,
        "message": "Update available." if update_available else "App is up to date.",
    }


def open_update_url(url: str) -> dict:
    clean_url = str(url or "").strip()
    if not clean_url:
        return {"ok": False, "message": "Update URL missing."}
    try:
        opened = webbrowser.open(clean_url)
        return {
            "ok": bool(opened),
            "message": "Download page opened." if opened else "Browser could not be opened.",
        }
    except Exception:
        return {"ok": False, "message": "Download page could not be opened."}


def default_adc_path() -> str:
    return r"C:\Program Files\Albion Data Client\albiondata-client.exe"


def pick_adc_path(initial_path: str = "") -> str:
    if os.name == "nt":
        try:
            initial_path = initial_path or default_adc_path()
            ps_script = r"""
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
$form = New-Object System.Windows.Forms.Form
$form.Text = 'Albion Data Client Path'
$form.StartPosition = 'CenterScreen'
$form.ClientSize = New-Object System.Drawing.Size(520,145)
$form.FormBorderStyle = 'FixedDialog'
$form.MaximizeBox = $false
$form.MinimizeBox = $false
$form.TopMost = $true
$form.BackColor = [System.Drawing.Color]::FromArgb(18,15,10)
$form.ForeColor = [System.Drawing.Color]::FromArgb(212,196,160)
$form.Font = New-Object System.Drawing.Font('Segoe UI', 9)

$label = New-Object System.Windows.Forms.Label
$label.Text = 'AlbionDataClient.exe dosyasini secin:'
$label.Location = New-Object System.Drawing.Point(18,16)
$label.Size = New-Object System.Drawing.Size(330,20)
$label.ForeColor = [System.Drawing.Color]::FromArgb(212,196,160)
$form.Controls.Add($label)

$hint = New-Object System.Windows.Forms.Label
$hint.Text = 'Genelde: C:\Program Files\Albion Data Client\albiondata-client.exe'
$hint.Location = New-Object System.Drawing.Point(18,36)
$hint.Size = New-Object System.Drawing.Size(470,18)
$hint.ForeColor = [System.Drawing.Color]::FromArgb(150,136,112)
$hint.Font = New-Object System.Drawing.Font('Segoe UI', 8.5)
$form.Controls.Add($hint)

$pathBox = New-Object System.Windows.Forms.TextBox
$pathBox.Location = New-Object System.Drawing.Point(18,66)
$pathBox.Size = New-Object System.Drawing.Size(392,30)
$pathBox.Text = '__INITIAL_PATH__'
$pathBox.BorderStyle = 'FixedSingle'
$pathBox.BackColor = [System.Drawing.Color]::FromArgb(26,21,16)
$pathBox.ForeColor = [System.Drawing.Color]::FromArgb(212,196,160)
$form.Controls.Add($pathBox)

$browseButton = New-Object System.Windows.Forms.Button
$browseButton.Text = 'Gozat'
$browseButton.Location = New-Object System.Drawing.Point(420,64)
$browseButton.Size = New-Object System.Drawing.Size(82,32)
$browseButton.FlatStyle = 'Flat'
$browseButton.FlatAppearance.BorderColor = [System.Drawing.Color]::FromArgb(122,96,48)
$browseButton.FlatAppearance.MouseOverBackColor = [System.Drawing.Color]::FromArgb(36,29,20)
$browseButton.BackColor = [System.Drawing.Color]::Transparent
$browseButton.ForeColor = [System.Drawing.Color]::FromArgb(201,168,76)
$browseButton.Add_Click({
  $dialog = New-Object System.Windows.Forms.OpenFileDialog
  $dialog.Title = 'Albion Data Client exe sec'
  $dialog.Filter = 'Executable (*.exe)|*.exe'
  $dialog.InitialDirectory = 'C:\Program Files'
  if (Test-Path $pathBox.Text) {
    try {
      $dialog.InitialDirectory = [System.IO.Path]::GetDirectoryName($pathBox.Text)
      $dialog.FileName = [System.IO.Path]::GetFileName($pathBox.Text)
    } catch {}
  }
  if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
    $pathBox.Text = $dialog.FileName
  }
})
$form.Controls.Add($browseButton)

$okButton = New-Object System.Windows.Forms.Button
$okButton.Text = 'Tamam'
$okButton.Location = New-Object System.Drawing.Point(330,104)
$okButton.Size = New-Object System.Drawing.Size(82,30)
$okButton.DialogResult = [System.Windows.Forms.DialogResult]::OK
$okButton.FlatStyle = 'Flat'
$okButton.FlatAppearance.BorderColor = [System.Drawing.Color]::FromArgb(122,96,48)
$okButton.FlatAppearance.MouseOverBackColor = [System.Drawing.Color]::FromArgb(36,29,20)
$okButton.BackColor = [System.Drawing.Color]::Transparent
$okButton.ForeColor = [System.Drawing.Color]::FromArgb(201,168,76)
$form.Controls.Add($okButton)

$cancelButton = New-Object System.Windows.Forms.Button
$cancelButton.Text = 'Atla'
$cancelButton.Location = New-Object System.Drawing.Point(420,104)
$cancelButton.Size = New-Object System.Drawing.Size(82,30)
$cancelButton.DialogResult = [System.Windows.Forms.DialogResult]::Cancel
$cancelButton.FlatStyle = 'Flat'
$cancelButton.FlatAppearance.BorderColor = [System.Drawing.Color]::FromArgb(122,96,48)
$cancelButton.FlatAppearance.MouseOverBackColor = [System.Drawing.Color]::FromArgb(36,29,20)
$cancelButton.BackColor = [System.Drawing.Color]::Transparent
$cancelButton.ForeColor = [System.Drawing.Color]::FromArgb(201,168,76)
$form.Controls.Add($cancelButton)

$form.AcceptButton = $okButton
$form.CancelButton = $cancelButton

if ($form.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
  [Console]::Out.Write($pathBox.Text)
}
"""
            ps_script = ps_script.replace('__INITIAL_PATH__', initial_path.replace("'", "''"))
            result = subprocess.run(
                [
                    "powershell",
                    "-NoProfile",
                    "-STA",
                    "-ExecutionPolicy",
                    "Bypass",
                    "-Command",
                    ps_script,
                ],
                capture_output=True,
                text=True,
                creationflags=subprocess.CREATE_NO_WINDOW,  # type: ignore[attr-defined]
            )
            selected = (result.stdout or "").strip()
            if selected:
                return selected
        except Exception:
            pass

    try:
        import tkinter as tk
        from tkinter import filedialog, messagebox

        root = tk.Tk()
        root.withdraw()
        messagebox.showinfo(
            "ADC Secimi",
            "Albion Data Client exe dosyasini secin.\n\nGenelde yol:\nC:\\Program Files\\Albion Data Client\\albiondata-client.exe",
        )
        selected = filedialog.askopenfilename(
            title="Albion Data Client exe sec",
            filetypes=[("Executable", "*.exe")],
        )
        root.destroy()
        return selected or ""
    except Exception:
        return ""


def ensure_adc_path() -> str:
    cfg = load_config()
    adc_path = cfg.get("adc_path", "")
    if adc_path and Path(adc_path).exists():
        return adc_path

    fallback_path = default_adc_path()
    initial_path = fallback_path if Path(fallback_path).exists() else ""
    selected = pick_adc_path(initial_path)
    if selected:
        cfg["adc_path"] = selected
        save_config(cfg)
    return selected


def start_adc() -> None:
    global adc_process, adc_status_message
    adc_path = ensure_adc_path()
    if not adc_path:
        adc_status_message = "ADC exe yolu secilmedi ya da bulunamadi."
        return

    creation_flags = 0
    startupinfo = None
    if os.name == "nt":
        creation_flags = subprocess.CREATE_NO_WINDOW  # type: ignore[attr-defined]
        startupinfo = subprocess.STARTUPINFO()
        startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW

    try:
        adc_process = subprocess.Popen(
            [adc_path, "-i", f"http://localhost:{ADC_PORT}"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            stdin=subprocess.DEVNULL,
            creationflags=creation_flags,
            startupinfo=startupinfo,
        )
        adc_status_message = f"ADC arka planda baslatildi. Yol: {adc_path}"
    except Exception:
        adc_process = None
        adc_status_message = "ADC baslatilamadi."


def stop_adc() -> None:
    global adc_process
    if not adc_process:
        return
    try:
        adc_process.terminate()
        adc_process.wait(timeout=5)
    except Exception:
        try:
            adc_process.kill()
        except Exception:
            pass
    adc_process = None


def cleanup_adc_logs() -> int:
    deleted = 0
    seen = set()
    for base_dir in (runtime_base_dir(), app_base_dir()):
        if base_dir in seen:
            continue
        seen.add(base_dir)
        for path in base_dir.glob("albiondata-client.log*"):
            try:
                if path.is_file():
                    path.unlink()
                    deleted += 1
            except Exception:
                pass
    return deleted


class WindowControlsAPI:
    def __init__(self):
        self.window = None

    def bind_window(self, window) -> None:
        self.window = window

    def minimize(self) -> dict:
        if self.window is not None:
            self.window.minimize()
        return {"ok": True}

    def toggle_maximize(self) -> dict:
        if self.window is not None:
            if getattr(self.window, "maximized", False):
                self.window.restore()
            else:
                self.window.maximize()
        return {"ok": True, "maximized": bool(getattr(self.window, "maximized", False))}

    def is_maximized(self) -> dict:
        return {"ok": True, "maximized": bool(getattr(self.window, "maximized", False))}

    def close(self) -> dict:
        if self.window is not None:
            self.window.destroy()
        return {"ok": True}


def set_adc_path_and_restart() -> dict:
    current_path = load_config().get("adc_path", "")
    initial_path = current_path or default_adc_path()
    selected = pick_adc_path(initial_path)
    if not selected:
        return {
            "ok": False,
            "cancelled": True,
            "message": "ADC yolu degistirme iptal edildi.",
        }

    cfg = load_config()
    cfg["adc_path"] = selected
    save_config(cfg)
    stop_adc()
    start_adc()
    return {
        "ok": True,
        "path": selected,
        "message": adc_status_message,
    }


def port_in_use(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(0.2)
        return sock.connect_ex(("127.0.0.1", port)) == 0


async def ws_handler(websocket):
    clients.add(websocket)
    try:
        await websocket.wait_closed()
    finally:
        clients.discard(websocket)


async def handle_ingest(request):
    try:
        body = await request.text()
        if not body.strip():
            return web.Response(text="OK")

        stats["packets_received"] += 1
        if clients:
          await asyncio.gather(*(ws.send(body) for ws in list(clients)))
        return web.Response(text="OK")
    except Exception:
        return web.Response(text="OK")


async def handle_status(request):
    uptime = int(time.time() - stats["start_time"])
    h, m, s = uptime // 3600, (uptime % 3600) // 60, uptime % 60
    adc_running = bool(adc_process and adc_process.poll() is None)
    adc_path = load_config().get("adc_path", "")
    return web.json_response(
        {
            "status": "ok",
            "uptime": f"{h:02d}:{m:02d}:{s:02d}",
            "clients": len(clients),
            "adc_running": adc_running,
            "adc_path_configured": bool(adc_path and Path(adc_path).exists()),
            "adc_status_message": adc_status_message,
            **stats,
        }
    )


async def handle_adc_select(request):
    result = await asyncio.to_thread(set_adc_path_and_restart)
    status_code = 200 if result.get("ok") else 400
    return web.json_response(result, status=status_code)


async def handle_root(request):
    manager = get_license_manager()
    status = manager.get_status()
    preview_mode = request.query.get("preview") == "1"
    target = "index.html" if (status.get("valid") or preview_mode) else "views/license.html"
    return web.FileResponse(
        resolve_resource(target),
        headers={
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            "Pragma": "no-cache",
        },
    )


async def handle_license_status(request):
    return web.json_response(get_license_manager().get_status())


async def handle_license_activate(request):
    try:
        payload = await request.json()
    except Exception:
        payload = {}
    result = get_license_manager().activate(payload.get("license_key", ""))
    status_code = 200 if result.get("ok") else 400
    return web.json_response(result, status=status_code)


async def handle_update_status(request):
    return web.json_response(await asyncio.to_thread(get_update_status))


async def handle_update_open(request):
    try:
        payload = await request.json()
    except Exception:
        payload = {}
    result = await asyncio.to_thread(open_update_url, payload.get("url", ""))
    status_code = 200 if result.get("ok") else 400
    return web.json_response(result, status=status_code)


async def handle_logs_cleanup(request):
    deleted_count = await asyncio.to_thread(cleanup_runtime_logs)
    return web.json_response({"ok": True, "deleted_count": deleted_count})


async def handle_profit_log_get(request):
    return web.json_response({"entries": await asyncio.to_thread(load_profit_log)})


async def handle_profit_log_save(request):
    try:
        payload = await request.json()
    except Exception:
        payload = {}
    entries = payload.get("entries", [])
    await asyncio.to_thread(save_profit_log, entries)
    return web.json_response({"ok": True, "count": len(entries) if isinstance(entries, list) else 0})


async def handle_static_resource(request, base_dir: str):
    tail = str(request.match_info.get("tail", "")).replace("\\", "/").strip("/")
    rel_path = Path(base_dir) / Path(*tail.split("/")) if tail else Path(base_dir)
    target = resolve_resource(*rel_path.parts)
    if not target.exists() or not target.is_file():
        return web.Response(status=404, text="Not found")
    return web.FileResponse(target)


def build_static_app() -> web.Application:
    app = web.Application()

    async def handle_views(request):
        return await handle_static_resource(request, "views")

    async def handle_data(request):
        return await handle_static_resource(request, "data")

    async def handle_icons(request):
        return await handle_static_resource(request, "icons")

    app.router.add_get("/", handle_root)
    app.router.add_get("/status", handle_status)
    app.router.add_post("/adc/select", handle_adc_select)
    app.router.add_get("/api/license/status", handle_license_status)
    app.router.add_post("/api/license/activate", handle_license_activate)
    app.router.add_get("/api/update/status", handle_update_status)
    app.router.add_post("/api/update/open", handle_update_open)
    app.router.add_post("/api/logs/cleanup", handle_logs_cleanup)
    app.router.add_get("/api/profit-log", handle_profit_log_get)
    app.router.add_post("/api/profit-log", handle_profit_log_save)
    app.router.add_get("/views/{tail:.*}", handle_views)
    app.router.add_get("/data/{tail:.*}", handle_data)
    app.router.add_get("/icons/{tail:.*}", handle_icons)
    app.router.add_get("/app.js", lambda request: web.FileResponse(resolve_resource("app.js")))
    app.router.add_get("/license.js", lambda request: web.FileResponse(resolve_resource("license.js")))
    app.router.add_get("/membership.js", lambda request: web.FileResponse(resolve_resource("membership.js")))
    app.router.add_get("/membership.css", lambda request: web.FileResponse(resolve_resource("membership.css")))
    app.router.add_get("/style.css", lambda request: web.FileResponse(resolve_resource("style.css")))
    app.router.add_get("/english-strings.txt", lambda request: web.FileResponse(resolve_resource("english-strings.txt")))
    app.router.add_get("/icon.ico", lambda request: web.FileResponse(resolve_resource("icon.ico")))
    app.router.add_get("/index.html", handle_root)
    return app


def build_ingest_app() -> web.Application:
    app = web.Application()
    app.router.add_get("/status", handle_status)
    app.router.add_route("*", "/{tail:.*}", handle_ingest)
    return app


async def start_servers():
    global server_error
    await websockets.serve(ws_handler, "localhost", WS_PORT)

    ingest_runner = web.AppRunner(build_ingest_app())
    await ingest_runner.setup()
    ingest_site = web.TCPSite(ingest_runner, "localhost", ADC_PORT)
    await ingest_site.start()

    ui_runner = web.AppRunner(build_static_app())
    await ui_runner.setup()
    ui_site = web.TCPSite(ui_runner, "localhost", UI_PORT)
    await ui_site.start()

    await asyncio.Future()

def run_servers():
    global server_error
    try:
        asyncio.run(start_servers())
    except Exception as exc:
        server_error = exc


def show_port_warning_and_exit():
    try:
        import tkinter as tk
        from tkinter import messagebox

        root = tk.Tk()
        root.withdraw()
        messagebox.showwarning(
            "Uygulama Zaten Acik",
            "AlbionMaster zaten calisiyor gibi gorunuyor.\n\nMevcut pencereyi kullan ya da eski instance'i kapatip tekrar dene.",
        )
        root.destroy()
    except Exception:
        pass


def wait_for_ui():
    for _ in range(40):
        if port_in_use(UI_PORT):
            return True
        if server_error is not None:
            return False
        time.sleep(0.25)
    return False


def on_window_closed():
    stop_adc()
    cleanup_adc_logs()


if __name__ == "__main__":
    if port_in_use(UI_PORT) or port_in_use(WS_PORT) or port_in_use(ADC_PORT):
        show_port_warning_and_exit()
        raise SystemExit(0)

    start_adc()
    threading.Thread(target=run_servers, daemon=True).start()

    if not wait_for_ui():
        stop_adc()
        raise SystemExit(1)

    window = webview.create_window(
        APP_NAME,
        f"http://localhost:{UI_PORT}",
        width=1920,
        height=1080,
        min_size=(1280, 820),
        shadow=True,
        maximized=True,
    )
    window.events.closed += on_window_closed
    webview.start()
    stop_adc()
    cleanup_adc_logs()
