"""Fetch Pittsburgh PLI permits for 2020-2024 from WPRDC and write a
normalized parcel-level CSV.

Output:
    pipeline/data/permits/pittsburgh.csv

Schema matches the cross-city standard used by fetch_philly_permits.py.

NOTE: Pittsburgh's PLI dataset does NOT store a structured housing-unit
count per permit (only free-text descriptions). We can't compute units
directly. Instead, downstream aggregation uses these geocoded permit
locations to compute each district's SHARE of Pittsburgh's permits,
then multiplies that share by Pittsburgh's BPS-reported 5-year unit
total to allocate units to districts. The `units` column in this CSV
is therefore 0 — it's a marker, not a true count.

Filters applied:
  - issue_date ∈ [2020-01-01, 2024-12-31]
  - work_type matches a normalized "NEW*" form: NEW CONSTRUCTION, NEW,
    NEW SYSTEM, NEW USE  (case-insensitive)
  - commercial_or_residential ∈ {Residential, Commercial}  (drop blanks)
  - has both latitude and longitude
"""

from __future__ import annotations

import argparse
import csv
import logging
import sys
from pathlib import Path

import requests

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("fetch_pittsburgh_permits")

PIPELINE_DIR = Path(__file__).resolve().parents[1]
OUT_DIR = PIPELINE_DIR / "data" / "permits"
RAW_DIR = PIPELINE_DIR / "data" / "raw"
WPRDC_DUMP_URL = (
    "https://data.wprdc.org/datastore/dump/f4d1177a-f597-4c32-8cbf-7885f56253f6"
)

WINDOW_YEARS = {"2020", "2021", "2022", "2023", "2024"}
NEW_TOKENS = {"NEW", "NEW CONSTRUCTION", "NEW SYSTEM", "NEW USE"}


def fetch_csv(refetch: bool) -> Path:
    raw_path = RAW_DIR / "wprdc_pli_permits.csv"
    raw_path.parent.mkdir(parents=True, exist_ok=True)
    if raw_path.exists() and not refetch:
        log.info("cached %s", raw_path.name)
        return raw_path
    log.info("fetching Pittsburgh PLI dump")
    r = requests.get(WPRDC_DUMP_URL, timeout=120)
    r.raise_for_status()
    raw_path.write_bytes(r.content)
    log.info("saved %s (%.1f KB)", raw_path, raw_path.stat().st_size / 1024)
    return raw_path


def is_new_variant(work_type: str) -> bool:
    return (work_type or "").strip().upper() in NEW_TOKENS


def normalize(raw_path: Path) -> list[dict]:
    out = []
    skipped_window = 0
    skipped_type = 0
    skipped_kind = 0
    skipped_geom = 0
    with raw_path.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            issue_date = r.get("issue_date") or ""
            if issue_date[:4] not in WINDOW_YEARS:
                skipped_window += 1
                continue
            if not is_new_variant(r.get("work_type") or ""):
                skipped_type += 1
                continue
            kind = (r.get("commercial_or_residential") or "").strip()
            if kind not in ("Residential", "Commercial"):
                skipped_kind += 1
                continue
            lng = r.get("longitude") or ""
            lat = r.get("latitude") or ""
            if not lng or not lat:
                skipped_geom += 1
                continue
            permit_id = r.get("permit_id") or ""
            out.append(
                {
                    "permit_id": permit_id,
                    "city": "pittsburgh",
                    "permit_date": issue_date[:10],
                    # No structured unit field — see module docstring.
                    "units": 0,
                    "permit_type": r.get("permit_type") or "",
                    "work_kind": (r.get("work_type") or "").strip(),
                    "is_residential": "true" if kind == "Residential" else "false",
                    "status": r.get("status") or "",
                    "lng": lng,
                    "lat": lat,
                    "address": r.get("address") or "",
                    "source_url": (
                        "https://data.wprdc.org/dataset/pli-permits"
                    ),
                }
            )
    log.info(
        "kept %d permits; skipped %d out-of-window, %d non-NEW, %d non-residential/commercial, %d no-geom",
        len(out),
        skipped_window,
        skipped_type,
        skipped_kind,
        skipped_geom,
    )
    return out


def write_csv(rows: list[dict], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fields = [
        "permit_id",
        "city",
        "permit_date",
        "units",
        "permit_type",
        "work_kind",
        "is_residential",
        "status",
        "lng",
        "lat",
        "address",
        "source_url",
    ]
    with path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        for r in rows:
            w.writerow(r)
    log.info("wrote %s — %d permits", path, len(rows))


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument(
        "--output",
        type=Path,
        default=OUT_DIR / "pittsburgh.csv",
    )
    ap.add_argument("--refetch", action="store_true", help="bypass raw CSV cache")
    args = ap.parse_args()
    raw = fetch_csv(args.refetch)
    rows = normalize(raw)
    write_csv(rows, args.output)
    return 0


if __name__ == "__main__":
    sys.exit(main())
