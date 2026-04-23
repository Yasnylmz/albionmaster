import asyncio
import json
import time

import websockets
from aiohttp import web

clients = set()
stats = {"packets_received": 0, "orders_forwarded": 0, "start_time": time.time()}


async def ws_handler(websocket):
    clients.add(websocket)
    print(f"[+] Web arayuzu baglandi! Aktif: {len(clients)}")
    try:
        await websocket.wait_closed()
    finally:
        clients.remove(websocket)
        print(f"[-] Web arayuzu koptu. Kalan: {len(clients)}")


async def handle_all(request):
    try:
        body = await request.text()
        if not body.strip():
            return web.Response(text="OK")

        stats["packets_received"] += 1

        if clients:
            await asyncio.gather(*(ws.send(body) for ws in clients))
            print(
                f"-> Veri yakalandi! (Boyut: {len(body)} karakter) | Paket: {stats['packets_received']}"
            )

        return web.Response(text="OK")
    except Exception as e:
        print(f"Hata olustu: {e}")
        return web.Response(text="OK")


async def handle_status(request):
    uptime = int(time.time() - stats["start_time"])
    h, m, s = uptime // 3600, (uptime % 3600) // 60, uptime % 60
    return web.Response(
        content_type="application/json",
        text=json.dumps(
            {
                "status": "ok",
                "uptime": f"{h:02d}:{m:02d}:{s:02d}",
                "clients": len(clients),
                **stats,
            }
        ),
    )


async def main():
    print("=======================================================")
    print("  Albion Scout Bridge - v3.0")
    print("=======================================================")

    await websockets.serve(ws_handler, "localhost", 8080)
    print("[1] WebSocket: ws://localhost:8080")

    app = web.Application()
    app.router.add_get("/status", handle_status)
    app.router.add_route("*", "/{tail:.*}", handle_all)

    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, "localhost", 4223)
    await site.start()
    print("[2] HTTP Dinleyici: http://localhost:4223 (ADC buraya bagli)")
    print("Veri bekleniyor...")

    await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())
