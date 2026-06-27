#!/usr/bin/env python3
"""Create Epic 12 — Arreglos varios in RUM Jira (idempotent).

Usage:
  export JIRA_EMAIL=you@example.com
  export JIRA_API_TOKEN=your_atlassian_api_token
  python3 scripts/seed-jira-fixes-epic.py

Board: https://rumin.atlassian.net/jira/software/projects/RUM/boards/1
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

EPIC_NUM = 12
EPIC_TITLE = "Arreglos varios"
EPIC_DESCRIPTION = (
    "Mejoras incrementales, bugs menores y pulido de UX en admin y storefront. "
    "Incluye filtros del catálogo Fazer, correcciones de imports/rutas y ajustes "
    "operativos que no ameritan una épica dedicada."
)

STORIES = [
    (
        "US-12.1",
        "Filtro por región en catálogo Fazer (admin)",
        "Como operador, quiero filtrar el catálogo por plataforma Fazer también por región, "
        "para revisar ofertas de un mercado específico (BR, US, CO, etc.) sin scroll infinito.",
        [
            "En Proveedor Fazer → Catálogo por plataforma, agregar select Filtrar región junto al filtro de plataforma",
            "Opciones: Todas + regiones distintas presentes en el catálogo sincronizado (ej. BR, US, LATAM)",
            "Combinable con filtro de plataforma (AND): plataforma Free Fire + región BR",
            "Si no hay resultados, mensaje claro Sin ofertas para esta combinación",
            "Persistir selección mientras la sesión admin esté abierta (state local)",
        ],
    ),
    (
        "US-12.2",
        "Filtro activo / inactivo / todos en catálogo Fazer (admin)",
        "Como operador, quiero ver solo categorías u ofertas activas, solo inactivas o todas, "
        "para auditar qué está publicado en tienda y qué quedó deshabilitado.",
        [
            "Select Filtrar estado con opciones: Todos, Solo activos, Solo inactivos",
            "Activo = categoría enabled y/o oferta enabled según nivel mostrado; ocultar grupos vacíos tras filtrar",
            "Combinable con filtros de plataforma y región (US-12.1)",
            "En vista filtrada Solo activos, no mostrar categorías sin ofertas activas ni filas de ofertas inactivas",
            "Contador en tab: ej. Catálogo por plataforma (42 activas / 168 total) opcional",
        ],
    ),
    (
        "US-12.3",
        "Corregir arranque Medusa — imports rutas payment-methods",
        "Como desarrollador, quiero que Medusa arranque sin errores de módulos, "
        "para que el storefront no falle en middleware al fetchear /store/regions.",
        [
            "Imports relativos correctos en /store/customers/me/payment-methods/*",
            "Medusa responde 200 en /health y /store/regions con publishable key",
            "Documentar en README: reiniciar Medusa si EADDRINUSE en :9000",
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
    jql = f'project = {PROJECT} AND issuetype = Epic AND summary ~ "Arreglos varios"'
    encoded = urllib.parse.quote(jql)
    result = request("GET", f"/search/jql?jql={encoded}&maxResults=5&fields=key,summary")
    for issue in result.get("issues") or []:
        summary = issue.get("fields", {}).get("summary", "")
        if "Arreglos varios" in summary or f"Épica {EPIC_NUM}" in summary:
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

    print("Checking for existing fixes epic in RUM...")
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
