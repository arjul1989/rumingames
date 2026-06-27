#!/usr/bin/env python3
"""Create Epic 13 — Fondeo por transacción (Fazer + Binance) in RUM Jira (idempotent).

Usage:
  export JIRA_EMAIL=you@example.com
  export JIRA_API_TOKEN=your_atlassian_api_token
  python3 scripts/seed-jira-funding-epic.py
"""
from __future__ import annotations

import json
import os
import subprocess
import sys
import urllib.parse

from jira_env import load_jira_env

load_jira_env()

BASE = "https://rumin.atlassian.net/rest/api/3"
EMAIL = os.environ.get("JIRA_EMAIL", "arjul1989@gmail.com")
TOKEN = os.environ.get("JIRA_API_TOKEN")
PROJECT = "RUM"
EPIC_TYPE = "10001"
STORY_TYPE = "10004"

EPIC_NUM = 13
EPIC_TITLE = "Fondeo por transacción (FazerCards + Binance)"
EPIC_DESCRIPTION = (
    "Automatizar el fondeo individual de cada compra en FazerCards vía Binance antes de "
    "emitir códigos digitales. Incluye orquestación backend, UX de compra en proceso, "
    "cliente Binance y API /payments de Fazer. Ver docs/funding/binance-per-order-funding.md."
)

STORIES = [
    (
        "US-13.1",
        "Orquestación backend fondeo → emisión Fazer",
        "Como sistema Gorumin, quiero tras cada pago capturado fondear Fazer por el costo "
        "mayorista vía Binance y solo entonces emitir el producto, para no mantener saldo prepagado.",
        [
            "Crea funding_run idempotente por línea digital (order_id:line_item_id)",
            "Calcula wholesale_usd desde mapping/oferta Fazer",
            "POST /payments Fazer + poll hasta confirmado",
            "Binance envía fondos según instrucciones Fazer",
            "createOrder Fazer + email + digital_delivery al completar",
            "FUNDING_ENABLED=false mantiene flujo legacy",
        ],
    ),
    (
        "US-13.2",
        "UX cliente — compra en proceso",
        "Como comprador, quiero ver que mi pedido está siendo procesado, para confiar mientras se genera el código.",
        [
            "Checkout éxito: mensaje 'Estamos generando tu código…'",
            "Mis compras: badge En proceso",
            "Detalle: texto tranquilizador mientras processing",
            "Entregado: revelar código como hoy",
        ],
    ),
    (
        "US-13.3",
        "Cliente Binance (env + mock)",
        "Como operador, quiero credenciales Binance en .env para automatizar el envío de fondos.",
        [
            "Variables en .env.example y medusa/.env.template",
            "Cliente aislado con firma HMAC",
            "MOCK_BINANCE=true en dev",
            "Sin secretos en logs",
        ],
    ),
    (
        "US-13.4",
        "API Fazer /payments en cliente",
        "Como desarrollador, quiero métodos tipados para /payments, para crear y consultar fondeos.",
        [
            "listPaymentMethods, createPayment, getPayment en FazerClient",
            "Idempotency-Key por funding_run",
            "Errores tipados propagados",
        ],
    ),
    (
        "US-13.5",
        "Persistencia funding_run + alertas",
        "Como operador, quiero trazabilidad de cada fondeo, para auditar y reintentar fallos.",
        [
            "Tabla funding_run con estados del pipeline",
            "Logs estructurados por funding_run id",
            "Alerta admin en fallo de fondeo o Binance",
        ],
    ),
    (
        "US-13.6",
        "Límites y seguridad de fondeo",
        "Como negocio, quiero topes por orden, para evitar fondeos accidentales grandes.",
        [
            "FUNDING_MAX_USD_PER_ORDER rechaza montos excesivos",
            "Credenciales solo server-side",
            "Verificación opcional de balance Binance",
        ],
    ),
]


def adf(text: str) -> dict:
    return {
        "type": "doc",
        "version": 1,
        "content": [{"type": "paragraph", "content": [{"type": "text", "text": text}]}],
    }


def adf_story(user_story: str, acceptance: list[str]) -> dict:
    content = [
        {
            "type": "heading",
            "attrs": {"level": 3},
            "content": [{"type": "text", "text": "Historia de usuario"}],
        },
        {"type": "paragraph", "content": [{"type": "text", "text": user_story}]},
        {
            "type": "heading",
            "attrs": {"level": 3},
            "content": [{"type": "text", "text": "Criterios de aceptación"}],
        },
    ]
    for item in acceptance:
        content.append(
            {
                "type": "bulletList",
                "content": [
                    {
                        "type": "listItem",
                        "content": [
                            {
                                "type": "paragraph",
                                "content": [{"type": "text", "text": item}],
                            }
                        ],
                    }
                ],
            }
        )
    return {"type": "doc", "version": 1, "content": content}


def request(method: str, path: str, data: dict | None = None) -> dict:
    url = f"{BASE}{path}"
    cmd = [
        "curl",
        "-s",
        "-X",
        method,
        "-u",
        f"{EMAIL}:{TOKEN}",
        "-H",
        "Content-Type: application/json",
        "-H",
        "Accept: application/json",
        url,
    ]
    if data is not None:
        cmd.extend(["-d", json.dumps(data)])
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(result.stderr or result.stdout)
    raw = result.stdout.strip()
    if not raw:
        return {}
    parsed = json.loads(raw)
    if parsed.get("errorMessages") or parsed.get("errors"):
        raise RuntimeError(raw[:800])
    return parsed


def search_existing_epic() -> str | None:
    jql = f'project = {PROJECT} AND issuetype = Epic AND summary ~ "Fondeo por transacción"'
    encoded = urllib.parse.quote(jql)
    result = request("GET", f"/search/jql?jql={encoded}&maxResults=5&fields=key,summary")
    for issue in result.get("issues") or []:
        summary = issue.get("fields", {}).get("summary", "")
        if "Fondeo" in summary or f"Épica {EPIC_NUM}" in summary:
            return issue["key"]
    return None


def search_existing_stories(epic_key: str) -> set[str]:
    jql = f'project = {PROJECT} AND parent = {epic_key}'
    encoded = urllib.parse.quote(jql)
    result = request("GET", f"/search/jql?jql={encoded}&maxResults=50&fields=summary")
    ids: set[str] = set()
    for issue in result.get("issues") or []:
        summary = issue.get("fields", {}).get("summary", "")
        if " — " in summary:
            ids.add(summary.split(" — ", 1)[0])
    return ids


def create_epic() -> str:
    payload = {
        "fields": {
            "project": {"key": PROJECT},
            "issuetype": {"id": EPIC_TYPE},
            "summary": f"[Épica {EPIC_NUM}] {EPIC_TITLE}",
            "description": adf(EPIC_DESCRIPTION),
        }
    }
    result = request("POST", "/issue", payload)
    key = result["key"]
    print(f"Created epic {key}: {EPIC_TITLE}")
    return key


def create_story(epic_key: str, story_id: str, title: str, user_story: str, acceptance: list[str]) -> str:
    payload = {
        "fields": {
            "project": {"key": PROJECT},
            "issuetype": {"id": STORY_TYPE},
            "parent": {"key": epic_key},
            "summary": f"{story_id} — {title}",
            "description": adf_story(user_story, acceptance),
        }
    }
    result = request("POST", "/issue", payload)
    key = result["key"]
    print(f"  {key}: {story_id} — {title}")
    return key


def main() -> None:
    if not TOKEN:
        print("Set JIRA_API_TOKEN (and optionally JIRA_EMAIL) then re-run.")
        sys.exit(1)

    print("Checking for existing funding epic in RUM...")
    epic_key = search_existing_epic()

    if epic_key:
        print(f"Epic already exists: {epic_key} — skipping epic creation.")
    else:
        epic_key = create_epic()

    existing = search_existing_stories(epic_key)
    created = 0
    for story_id, title, user_story, acceptance in STORIES:
        if story_id in existing:
            print(f"  skip {story_id} (already exists under {epic_key})")
            continue
        create_story(epic_key, story_id, title, user_story, acceptance)
        created += 1

    print(f"\nDone. Epic: {epic_key}. New stories: {created}.")
    print(f"https://rumin.atlassian.net/browse/{epic_key}")


if __name__ == "__main__":
    main()
