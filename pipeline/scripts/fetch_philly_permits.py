"""Fetch Philadelphia L&I building permits for the housing-supply window
2020-2024 and write a normalized parcel-level CSV.

Output:
    pipeline/data/permits/philadelphia.csv

Schema (the cross-city standard):
    permit_id        e.g. "RP-2021-020279"
    city             "philadelphia"
    permit_date      ISO YYYY-MM-DD
    units            int — net housing units permitted by this permit
    permit_type      raw L&I permittype  (audit trail)
    work_kind        raw L&I typeofwork  (audit trail)
    is_residential   true (we filter to housing-relevant permits)
    status           raw L&I status      (audit trail)
    lng / lat        WGS84
    address          display only
    source_url       canonical L&I link

Filters applied:
  - permitissuedate ∈ [2020-01-01, 2024-12-31]
  - typeofwork LIKE 'New Construction%'  (excludes alterations whose
    `numberofunits` represents pre-existing units in the building, not
    units added)
  - numberofunits > 0  (must actually add housing)
  - status NOT IN ('Cancelled', 'Denied', 'Withdrawn')  (the permit
    must have been issued — completed, currently active, or expired
    after issuance all count)

Note: PA UCC treats 3+ unit residential buildings as commercial code,
so we don't filter on commercialorresidential — multifamily projects
are typically tagged "Commercial" here. The numberofunits > 0 + work
kind filter is more reliable.
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
log = logging.getLogger("fetch_philly_permits")

PIPELINE_DIR = Path(__file__).resolve().parents[1]
OUT_DIR = PIPELINE_DIR / "data" / "permits"
CARTO_URL = "https://phl.carto.com/api/v2/sql"

QUERY = """
SELECT
  permitnumber,
  permitissuedate,
  permittype,
  typeofwork,
  commercialorresidential,
  numberofunits,
  status,
  address,
  ST_X(the_geom) AS lng,
  ST_Y(the_geom) AS lat
FROM permits
WHERE permitissuedate >= '2020-01-01'
  AND permitissuedate <  '2025-01-01'
  AND typeofwork LIKE 'New Construction%'
  AND numberofunits > 0
  AND status NOT IN ('Cancelled', 'Denied', 'Withdrawn')
"""


def fetch_all() -> list[dict]:
    log.info("querying Philly L&I CARTO for 2020-2024 new-construction permits")
    r = requests.get(CARTO_URL, params={"q": QUERY}, timeout=120)
    r.raise_for_status()
    data = r.json()
    if "error" in data:
        raise RuntimeError(f"CARTO error: {data['error']}")
    rows = data.get("rows", [])
    log.info("fetched %d rows from CARTO", len(rows))
    return rows


def normalize(rows: list[dict]) -> list[dict]:
    out = []
    skipped_no_geom = 0
    for r in rows:
        lng = r.get("lng")
        lat = r.get("lat")
        if lng is None or lat is None:
            skipped_no_geom += 1
            continue
        permit_date = (r.get("permitissuedate") or "")[:10]
        permit_id = r.get("permitnumber") or ""
        out.append(
            {
                "permit_id": permit_id,
                "city": "philadelphia",
                "permit_date": permit_date,
                "units": int(r.get("numberofunits") or 0),
                "permit_type": r.get("permittype") or "",
                "work_kind": r.get("typeofwork") or "",
                "is_residential": "true",
                "status": r.get("status") or "",
                "lng": lng,
                "lat": lat,
                "address": r.get("address") or "",
                "source_url": (
                    f"https://eclipse.phila.gov/phillylmsprod/int/lms/Login.aspx"
                    if permit_id
                    else ""
                ),
            }
        )
    if skipped_no_geom:
        log.warning(
            "Dropped %d rows missing lat/lng (can't be spatial-joined)",
            skipped_no_geom,
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
    total_units = sum(int(r["units"]) for r in rows)
    log.info(
        "wrote %s — %d permits, %d total housing units 2020-2024",
        path,
        len(rows),
        total_units,
    )


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument(
        "--output",
        type=Path,
        default=OUT_DIR / "philadelphia.csv",
        help="Output CSV path (default: pipeline/data/permits/philadelphia.csv)",
    )
    args = ap.parse_args()
    rows = fetch_all()
    normalized = normalize(rows)
    write_csv(normalized, args.output)
    return 0


if __name__ == "__main__":
    sys.exit(main())
