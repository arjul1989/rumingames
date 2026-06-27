#!/usr/bin/env python3
"""Create Epic 14 — Wompi + pasarelas por país in RUM Jira (idempotent).

Usage:
  export JIRA_EMAIL=you@example.com
  export JIRA_API_TOKEN=your_atlassian_api_token
  python3 scripts/seed-jira-wompi-epic.py
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

EPIC_NUM = 14
EPIC_TITLE = "Wompi + pasarelas de pago por país"
EPIC_DESCRIPTION = (
    "Integrar Wompi como pasarela alternativa a Mercado Pago en Colombia, con "
    "arquitectura escalable de checkouts encapsulados y selector de pasarela "
    "activa por país en el dashboard de la compañía. Desarrollo y pruebas en "
    "local/sandbox antes de migrar a producción."
)

STORIES = [
    (
        "US-14.1",
        "Selector de pasarela por país (admin)",
        "Como administrador, quiero elegir qué procesador de pagos usa cada país, "
        "para activar Wompi o Mercado Pago en Colombia sin redeploy.",
        [
            "Página admin Pasarelas con selector por país",
            "Colombia: opciones Mercado Pago y Wompi",
            "Validación: no permitir pasarela sin credenciales (salvo mock dev)",
            "Persistencia en country_payment_gateway",
        ],
    ),
    (
        "US-14.2",
        "Checkouts encapsulados en storefront",
        "Como desarrollador, quiero checkouts separados por pasarela, para "
        "evitar lógica condicional frágil en un solo flujo.",
        [
            "/checkout redirige según pasarela activa del país",
            "/checkout/mercadopago — flujo MP existente",
            "/checkout/wompi — flujo Wompi aislado",
            "API store GET /store/payments/gateway?country=co",
        ],
    ),
    (
        "US-14.3",
        "Módulo Medusa payment-wompi",
        "Como sistema, quiero un provider Wompi en Medusa v2, para crear sesiones "
        "y capturar pagos con el mismo contrato que Mercado Pago.",
        [
            "Provider pp_wompi_wompi (initiate, authorize, capture, refund)",
            "Cliente API sandbox/prod configurable",
            "MOCK_WOMPI=true para dev local",
            "Registro en medusa-config.ts junto a MP",
        ],
    ),
    (
        "US-14.4",
        "Webhook Wompi + verificación de integridad",
        "Como operador, quiero recibir eventos de Wompi de forma segura, para "
        "confirmar pagos y disparar fulfillment Fazer.",
        [
            "POST /hooks/wompi con WOMPI_EVENTS_SECRET",
            "Verificación firma integridad (WOMPI_INTEGRITY_SECRET)",
            "Dedupe + rate limit como MP",
            "payment.captured → subscriber fulfillment existente",
        ],
    ),
    (
        "US-14.5",
        "Checkout Wompi (Widget / API)",
        "Como comprador colombiano, quiero pagar con tarjeta, PSE o Nequi vía "
        "Wompi, con la misma UX de confianza que Mercado Pago.",
        [
            "Widget o API Wompi en /checkout/wompi",
            "Tokens de aceptación y transacciones según docs Wompi",
            "Redirect pending/success para métodos async",
            "Tarjetas tokenizadas (fase 2 opcional)",
        ],
    ),
    (
        "US-14.6",
        "Credenciales y variables de entorno",
        "Como desarrollador, quiero las llaves Wompi en .env, para probar en "
        "sandbox antes de producción.",
        [
            "WOMPI_PUBLIC_KEY, WOMPI_PRIVATE_KEY en .env.template",
            "WOMPI_EVENTS_SECRET, WOMPI_INTEGRITY_SECRET",
            "WOMPI_NOTIFICATION_URL apuntando a /hooks/wompi",
            "Documentar en .env.example",
        ],
    ),
    (
        "US-14.7",
        "Admin métodos Wompi (tarjetas, PSE, etc.)",
        "Como administrador, quiero toggles de métodos Wompi, simétricos a la "
        "página Pagos MP.",
        [
            "Config wompi_payment_config o extensión de gateway config",
            "Página admin Pagos Wompi",
            "Store API /store/wompi/settings para el checkout",
        ],
    ),
    (
        "US-14.8",
        "Tests + migración sandbox → prod",
        "Como equipo, queremos pruebas E2E en sandbox y cutover controlado.",
        [
            "Tests unitarios client, firma webhook, status mapping",
            "Checkout E2E sandbox Wompi (tarjeta de prueba)",
            "Runbook: cambiar pasarela activa CO en admin de MP a Wompi",
            "Rollback: volver a Mercado Pago desde dashboard",
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
    jql = f'project = {PROJECT} AND issuetype = Epic AND summary ~ "Wompi"'
    encoded = urllib.parse.quote(jql)
    result = request("GET", f"/search/jql?jql={encoded}&maxResults=5&fields=key,summary")
    for issue in result.get("issues") or []:
        summary = issue.get("fields", {}).get("summary", "")
        if "Wompi" in summary or f"Épica {EPIC_NUM}" in summary:
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

    print("Checking for existing Wompi epic in RUM...")
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
