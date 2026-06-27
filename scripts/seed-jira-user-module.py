#!/usr/bin/env python3
"""Create Epic 11 — Módulo de usuario in RUM Jira (idempotent).

Usage:
  export JIRA_EMAIL=you@example.com
  export JIRA_API_TOKEN=your_atlassian_api_token
  python3 scripts/seed-jira-user-module.py

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

EPIC_NUM = 11
EPIC_TITLE = "Módulo de usuario (Mi cuenta)"
EPIC_DESCRIPTION = (
    "Área de cliente Gorumin: acceso visible (login/registro), menú lateral con "
    "Mis datos, Mis compras y Mis métodos de pago (tarjetas tokenizadas Mercado Pago). "
    "Extiende US-1.5, US-7.7 y RUM-69 (Google OAuth) con UX Gorumin y funcionalidad completa."
)

STORIES = [
    (
        "US-11.1",
        "CTA Login / Registro en header",
        "Como visitante, quiero ver botones claros de Iniciar sesión y Registrarme en el header, "
        "para acceder a mi cuenta sin adivinar el ícono.",
        [
            "Header desktop: Iniciar sesión + Registrarme cuando no hay sesión",
            "Header autenticado: avatar/nombre + enlace a Mi cuenta + Cerrar sesión",
            "Mobile menu: mismas opciones según estado de sesión",
            "Rutas: /co/account (login) y /co/account?view=register",
            "Estilo Gorumin (dark, mono caps) coherente con US-7.1",
        ],
    ),
    (
        "US-11.2",
        "Layout Mi cuenta con menú lateral",
        "Como cliente registrado, quiero un área de cuenta con menú lateral fijo, "
        "para navegar entre Mis datos, Mis compras y Mis métodos de pago.",
        [
            "Sidebar desktop + drawer mobile con 3 secciones principales",
            "Eliminar o fusionar ítems Medusa default no usados (Resumen genérico, Direcciones si no aplica)",
            "Tema hyper-glass / dark Gorumin en todas las subpáginas",
            "Breadcrumb o título H1 por sección",
            "noindex en toda el área (US-8.1)",
        ],
    ),
    (
        "US-11.3",
        "Mis datos — perfil del cliente",
        "Como cliente, quiero editar mis datos personales, para mantener mi información actualizada.",
        [
            "Campos: nombre, apellido, email (solo lectura si OAuth), teléfono",
            "Cambio de contraseña (solo cuentas email/password)",
            "Textos y labels en español Colombia",
            "Validación y mensajes de error accesibles",
            "Persistencia vía Medusa Store API /store/customers/me",
        ],
    ),
    (
        "US-11.4",
        "Mis compras — historial y códigos",
        "Como cliente, quiero ver mis compras y revelar códigos digitales, "
        "para usar mis gift cards después del pago.",
        [
            "Listado de órdenes con estado de pago y fulfillment",
            "Detalle de orden con productos, total COP y método de pago",
            "Componente DigitalCodes: reveal, copiar al portapapeles",
            "Estados: pending, processing, delivered, failed",
            "Extiende US-7.7 / RUM-19",
        ],
    ),
    (
        "US-11.5",
        "Google OAuth en storefront",
        "Como cliente, quiero iniciar sesión o registrarme con Google, "
        "para no crear otra contraseña.",
        [
            "Botón Continuar con Google en login y registro",
            "Credenciales GOOGLE_* en Medusa + NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true",
            "Callback /api/auth/google/callback crea sesión Medusa",
            "Vincular cuenta Google a customer existente por email",
            "Cierra RUM-69 / US-1.6",
        ],
    ),
    (
        "US-11.6",
        "Mis métodos de pago — guardar tarjetas",
        "Como cliente, quiero guardar tarjetas tokenizadas de Mercado Pago, "
        "para pagar más rápido en futuras compras.",
        [
            "Modelo/API: customer_payment_methods (customer_id, mp_customer_id, card_id, last_four, brand, exp_month, exp_year)",
            "Página /account/payment-methods: listar, agregar, eliminar",
            "Agregar tarjeta vía MP Card Form / Customers API (token nunca en backend)",
            "Solo tarjetas; PSE/Efecty no se guardan",
            "PCI: solo tokens MP, nunca PAN en logs ni DB",
        ],
    ),
    (
        "US-11.7",
        "Checkout con tarjeta guardada",
        "Como cliente con tarjetas guardadas, quiero elegir una en checkout, "
        "para completar la compra en un clic.",
        [
            "Checkout muestra tarjetas guardadas si hay sesión",
            "Opción Usar otra tarjeta abre Payment Brick",
            "Pago con card_id tokenizado sin re-ingresar datos",
            "Fallback a flujo normal si token expiró",
        ],
    ),
    (
        "US-11.8",
        "Emails transaccionales de cuenta",
        "Como cliente, quiero recibir emails de bienvenida y verificación, "
        "para confirmar mi cuenta y ver resumen de compras.",
        [
            "Email verificación al registrarse (Brevo template email-verification)",
            "Email order-placed al completar compra (ya existe, validar en cuenta)",
            "Email digital-code-delivered cuando código listo",
            "Links en emails apuntan a /co/account/orders/[id]",
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
    jql = f'project = {PROJECT} AND issuetype = Epic AND summary ~ "Módulo de usuario"'
    encoded = urllib.parse.quote(jql)
    result = request("GET", f"/search/jql?jql={encoded}&maxResults=5&fields=key,summary")
    issues = result.get("issues") or []
    for issue in issues:
        summary = issue.get("fields", {}).get("summary", "")
        if "Módulo de usuario" in summary or f"Épica {EPIC_NUM}" in summary:
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

    print("Checking for existing user-module epic in RUM...")
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
