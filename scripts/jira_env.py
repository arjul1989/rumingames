"""Load JIRA_EMAIL / JIRA_API_TOKEN from repo .env (gitignored)."""
from __future__ import annotations

import os
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent


def load_jira_env() -> None:
    for name in (".env", ".env.local"):
        path = REPO_ROOT / name
        if not path.is_file():
            continue
        for line in path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            key = key.strip()
            if not key.startswith("JIRA_"):
                continue
            if key not in os.environ or not os.environ[key]:
                os.environ[key] = value.strip().strip('"').strip("'")
