#!/usr/bin/env python3
"""Transition Jira issues to a target status (default: Listo / Done).

Usage:
  python3 scripts/jira-transition.py RUM-71 RUM-72
  python3 scripts/jira-transition.py --status "En curso" RUM-78
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys

from jira_env import load_jira_env

load_jira_env()

BASE = "https://rumin.atlassian.net/rest/api/3"
EMAIL = os.environ.get("JIRA_EMAIL", "arjul1989@gmail.com")
TOKEN = os.environ.get("JIRA_API_TOKEN")


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
        raise RuntimeError(result.stderr)
    raw = result.stdout.strip()
    if not raw:
        return {}
    parsed = json.loads(raw)
    if parsed.get("errorMessages") or parsed.get("errors"):
        raise RuntimeError(raw)
    return parsed


def find_transition_id(issue_key: str, target_name: str) -> str | None:
    result = request("GET", f"/issue/{issue_key}/transitions")
    target_lower = target_name.lower()
    for t in result.get("transitions") or []:
        if t["name"].lower() == target_lower or t["to"]["name"].lower() == target_lower:
            return t["id"]
    return None


def transition_issue(issue_key: str, target_name: str) -> None:
    tid = find_transition_id(issue_key, target_name)
    if not tid:
        names = [
            f"{t['name']} -> {t['to']['name']}"
            for t in (request("GET", f"/issue/{issue_key}/transitions").get("transitions") or [])
        ]
        raise RuntimeError(f"No transition to '{target_name}' for {issue_key}. Available: {names}")
    request("POST", f"/issue/{issue_key}/transitions", {"transition": {"id": tid}})
    print(f"  {issue_key} -> {target_name}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Transition Jira issues")
    parser.add_argument("issues", nargs="+", help="Issue keys (e.g. RUM-71)")
    parser.add_argument(
        "--status",
        default="Listo",
        help='Transition name or destination status (default: "Listo")',
    )
    args = parser.parse_args()

    if not TOKEN:
        print("Set JIRA_API_TOKEN then re-run.")
        sys.exit(1)

    for key in args.issues:
        try:
            transition_issue(key, args.status)
        except RuntimeError as e:
            print(f"  {key}: FAILED — {e}", file=sys.stderr)
            sys.exit(1)

    print(f"Done ({len(args.issues)} issues).")


if __name__ == "__main__":
    main()
