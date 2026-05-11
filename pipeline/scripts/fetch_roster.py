"""Fetch the PA Senate (or House) members directory from palegis.us.

Usage:
    cd pipeline
    uv run python scripts/fetch_roster.py --chamber senate

Outputs:
    pipeline/data/raw/roster/{chamber}-members.html
    pipeline/data/roster/{chamber}-2025.json

The senate roster has no equivalent of a full-roster roll call (votes
typically don't cover all 50 senators), so we have to scrape the
member directory page. Same Chrome-UA trick as fetch_rollcall.py.

For the House we already get the roster as a byproduct of HB 2186's
floor roll call (rc1054), but this script will work for the House too
when the floor-vote shortcut isn't available.
"""

from __future__ import annotations

import argparse
import json
import logging
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

import requests
from bs4 import BeautifulSoup

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("fetch_roster")

PIPELINE_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = PIPELINE_DIR / "data"
RAW_DIR = DATA_DIR / "raw" / "roster"
OUT_DIR = DATA_DIR / "roster"

CHROME_UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)

NAME_SUFFIXES = {"Jr.", "Jr", "Sr.", "Sr", "II", "III", "IV", "V"}
BIO_RE = re.compile(r"/(senate|house)/members/bio/(\d+)/(?:sen|rep)-([a-z0-9\-]+)")
DISTRICT_RE = re.compile(r"District\s+(\d+)")


def _natural_surname(display_name: str) -> str | None:
    if not display_name:
        return None
    tokens = display_name.split()
    while tokens and tokens[-1] in NAME_SUFFIXES:
        tokens.pop()
    return tokens[-1] if tokens else None


def _slugify(display_name: str) -> str:
    s = display_name.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s


def fetch_html(chamber: str, refetch: bool) -> Path:
    url = f"https://www.palegis.us/{chamber}/members"
    raw_path = RAW_DIR / f"{chamber}-members.html"
    raw_path.parent.mkdir(parents=True, exist_ok=True)
    if raw_path.exists() and not refetch:
        log.info("Raw HTML cached at %s (use --refetch to re-download)", raw_path)
        return raw_path
    log.info("Fetching %s", url)
    resp = requests.get(url, headers={"User-Agent": CHROME_UA}, timeout=30)
    resp.raise_for_status()
    raw_path.write_text(resp.text, encoding="utf-8")
    log.info("Saved raw HTML to %s (%d bytes)", raw_path, len(resp.text))
    return raw_path


def parse_roster(html: str, chamber: str) -> list[dict]:
    soup = BeautifulSoup(html, "html.parser")
    members: list[dict] = []
    seen_ids: set[str] = set()

    # Each card has an anchor like /{chamber}/members/bio/{id}/{sen|rep}-{slug}
    # and a sibling badge "thumb-info-type bg-party-{P}" containing the
    # party + "District N".
    for anchor in soup.select("a[href*='/members/bio/']"):
        href = (anchor.get("href") or "").strip()
        m = BIO_RE.search(href)
        if not m:
            continue
        bio_id = m.group(2)
        if bio_id in seen_ids:
            continue

        # Display name comes from the photo alt: "Photo of Senator David G. Argall"
        img = anchor.select_one("img[alt^='Photo of ']")
        if not img:
            continue
        alt = img.get("alt", "")
        display = re.sub(r"^Photo of (?:Senator|Representative|Rep\.|Sen\.)\s+", "", alt).strip()
        if not display:
            continue

        # Party + district live in a sibling .thumb-info-type element.
        badge = anchor.select_one("span.thumb-info-type, .thumb-info-type")
        party = None
        district = None
        if badge:
            for cls in badge.get("class", []):
                if cls.startswith("bg-party-"):
                    party = cls.split("-")[-1]
                    break
            txt = badge.get_text(" ", strip=True)
            dm = DISTRICT_RE.search(txt)
            if dm:
                district = dm.group(1)

        seen_ids.add(bio_id)
        members.append(
            {
                "bioId": bio_id,
                "slug": _slugify(display),
                "displayName": display,
                "lastName": _natural_surname(display),
                "party": party,
                "district": district,
                "chamber": "Senate" if chamber == "senate" else "House",
            }
        )

    return members


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--chamber", required=True, choices=["house", "senate"])
    ap.add_argument("--refetch", action="store_true", help="bypass cached raw HTML")
    args = ap.parse_args()

    raw_path = fetch_html(args.chamber, args.refetch)
    members = parse_roster(raw_path.read_text(encoding="utf-8"), args.chamber)

    out = {
        "chamber": args.chamber,
        "fetchedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "sourceUrl": f"https://www.palegis.us/{args.chamber}/members",
        "count": len(members),
        "members": members,
    }
    out_path = OUT_DIR / f"{args.chamber}-2025.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")

    missing = [m for m in members if not m["district"] or not m["party"]]
    log.info("Wrote %s", out_path)
    log.info("  %d members; missing party/district: %d", len(members), len(missing))
    if missing:
        log.warning("Members with missing fields: %s", [m["displayName"] for m in missing])
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
