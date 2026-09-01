"""Приём заявок с сайта.

Один POST-роут в том же процессе, что и бот. Сайт шлёт JSON, роут проверяет
его и кладёт заявку в телеграм администраторам. Токен остаётся здесь и в
браузер не попадает.

Подключение в bot.py:

    from lead_endpoint import start_lead_server

    async def main() -> None:
        bot = Bot(token=require_token(), ...)
        ...
        runner = await start_lead_server(bot)
        try:
            await dispatcher.start_polling(bot, ...)
        finally:
            await runner.cleanup()

Переменные окружения:

    LEAD_PORT     порт роута, по умолчанию 8080
    LEAD_ORIGINS  через запятую, кому разрешён запрос. По умолчанию боевой
                  домен сайта. Локальная отладка: добавьте http://localhost:8000

Новых зависимостей нет: aiohttp приходит вместе с aiogram.
"""

from __future__ import annotations

import html
import json
import logging
import os
import re
import time
from collections import deque
from typing import Any

from aiogram import Bot
from aiohttp import web

from config import ADMIN_IDS

log = logging.getLogger("content_bot.lead")

PORT = int(os.getenv("LEAD_PORT", "8080"))

# Пускаем только свой сайт. Браузер не даст прочитать ответ без этого
# заголовка, поэтому список должен совпадать с реальным доменом.
ORIGINS = {
    o.strip()
    for o in os.getenv(
        "LEAD_ORIGINS",
        "https://xn--e1a6ab.xn--80anktkl.xn--p1ai,https://цех.запуск.рф",
    ).split(",")
    if o.strip()
}

MAX_BODY = 8 * 1024           # заявка длиннее — это не заявка
RATE_WINDOW = 600             # окно, секунд
RATE_LIMIT = 5                # столько заявок с одного адреса за окно

_seen: dict[str, deque[float]] = {}

RE_MAIL = re.compile(r"^[^\s@]+@[^\s@]+\.(xn--[a-z0-9\-]{2,}|[a-zа-яё]{2,})$", re.I)
RE_TG = re.compile(r"^@[a-z0-9_]{4,32}$", re.I)
RE_PHONE = re.compile(r"^\+?\d[\d\s\-()]{9,17}$")


def _ok_contact(v: str) -> bool:
    v = re.sub(r"^(https?://)?(t\.me/|telegram\.me/)", "@", v.strip(), flags=re.I)
    return bool(RE_MAIL.match(v) or RE_TG.match(v) or RE_PHONE.match(v))


def _rate_ok(ip: str) -> bool:
    now = time.time()
    hits = _seen.setdefault(ip, deque())
    while hits and now - hits[0] > RATE_WINDOW:
        hits.popleft()
    if len(hits) >= RATE_LIMIT:
        return False
    hits.append(now)
    # чтобы словарь не рос вечно на живом сервере
    if len(_seen) > 5000:
        for key in [k for k, v in _seen.items() if not v]:
            _seen.pop(key, None)
    return True


def _cors(request: web.Request, response: web.Response) -> web.Response:
    origin = request.headers.get("Origin", "")
    if origin in ORIGINS:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Vary"] = "Origin"
    return response


def _clip(v: Any, limit: int) -> str:
    return str(v or "").strip()[:limit]



def _card(d: dict[str, Any]) -> str:
    """Заявка одним сообщением: сверху контакт, потому что по нему отвечают."""
    e = html.escape
    rows = [
        "<b>Заявка с сайта</b>",
        "",
        f"Контакт: <code>{e(d['contact'])}</code>",
        f"Что нужно: {e(d['tier']) or '—'}",
    ]
    if d["link"]:
        rows.append(f"Канал: {e(d['link'])}")
    if d["name"]:
        rows.append(f"Имя: {e(d['name'])}")
    if d["note"]:
        rows.append(f"О задаче: {e(d['note'])}")
    if d["params_text"]:
        rows.append(f"Параметры: {e(d['params_text'])}")
    rows += [
        "",
        f"<i>Ветка {e(d['branch']) or '—'}, "
        f"заполняли {d['seconds']} с, страница {e(d['page'])}</i>",
    ]
    if d["ref"]:
        rows.append(f"<i>Пришёл с {e(d['ref'])}</i>")
    return "\n".join(rows)


async def handle_lead(request: web.Request) -> web.Response:
    bot: Bot = request.app["bot"]

    origin = request.headers.get("Origin", "")
    if origin and origin not in ORIGINS:
        log.warning("Заявка с чужого домена: %s", origin)
        return web.json_response({"ok": False}, status=403)

    raw = await request.content.read(MAX_BODY + 1)
    if len(raw) > MAX_BODY:
        return _cors(request, web.json_response({"ok": False}, status=413))

    try:
        # сайт шлёт text/plain, чтобы браузер не делал preflight
        body = json.loads(raw.decode("utf-8"))
        if not isinstance(body, dict):
            raise ValueError
    except (ValueError, UnicodeDecodeError):
        return _cors(request, web.json_response({"ok": False}, status=400))

    d = {
        "contact": _clip(body.get("contact"), 200),
        "link": _clip(body.get("link"), 300),
        "tier": _clip(body.get("tier"), 200),
        "name": _clip(body.get("name"), 80),
        "note": _clip(body.get("note"), 1500),
        "branch": _clip(body.get("branch"), 40),
        "params_text": _clip(body.get("params_text"), 300),
        "page": _clip(body.get("page"), 300),
        "ref": _clip(body.get("ref"), 300),
        "seconds": int(body.get("seconds") or 0),
    }

    # Ссылка по желанию: отвечают по контакту, он и решает.
    if not _ok_contact(d["contact"]):
        log.info("Заявка без рабочего контакта, отбита: %r", d["contact"])
        return _cors(request, web.json_response({"ok": False}, status=422))

    if not body.get("consent"):
        return _cors(request, web.json_response({"ok": False}, status=422))

    # Частоту считаем только по заявкам, прошедшим проверку. Мусор отбит выше
    # и ничего не стоил, а живой человек, жмущий «Повторить», не должен
    # упереться в лимит из-за чужого спама.
    ip = (
        request.headers.get("CF-Connecting-IP")
        or request.headers.get("X-Forwarded-For", "").split(",")[0].strip()
        or (request.remote or "?")
    )
    if not _rate_ok(ip):
        log.warning("Слишком часто с адреса %s", ip)
        return _cors(request, web.json_response({"ok": False}, status=429))

    if not ADMIN_IDS:
        # Отвечать «принято», когда заявку никто не увидит, нельзя.
        log.error("ADMIN_IDS пуст: заявку некому показать")
        return _cors(request, web.json_response({"ok": False}, status=500))

    card = _card(d)
    delivered = 0
    for admin_id in ADMIN_IDS:
        try:
            await bot.send_message(admin_id, card, disable_web_page_preview=True)
            delivered += 1
        except Exception:
            log.exception("Заявка не дошла до %s", admin_id)

    if not delivered:
        # Сайт покажет «не отправилось» и предложит повторить.
        return _cors(request, web.json_response({"ok": False}, status=502))

    log.info("Заявка принята: %s, %s", d["contact"], d["tier"])
    return _cors(request, web.json_response({"ok": True}))


async def handle_options(request: web.Request) -> web.Response:
    resp = web.Response(status=204)
    resp.headers["Access-Control-Allow-Methods"] = "POST, OPTIONS"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type"
    resp.headers["Access-Control-Max-Age"] = "86400"
    return _cors(request, resp)


async def handle_health(_: web.Request) -> web.Response:
    return web.json_response({"ok": True})


async def start_lead_server(bot: Bot) -> web.AppRunner:
    app = web.Application(client_max_size=MAX_BODY)
    app["bot"] = bot
    app.router.add_post("/lead", handle_lead)
    app.router.add_options("/lead", handle_options)
    app.router.add_get("/health", handle_health)

    runner = web.AppRunner(app)
    await runner.setup()
    await web.TCPSite(runner, "0.0.0.0", PORT).start()
    log.info("Роут заявок слушает :%s, пускаем %s", PORT, ", ".join(sorted(ORIGINS)))
    return runner
