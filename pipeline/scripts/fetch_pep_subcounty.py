"""Fetch Census PEP sub-county population estimates and compute the
2020 → 2024 percent change for every PA county subdivision (MCD).

Why we need this
----------------
The legislative-district vote map answers "how did my legislator vote
on housing bills." The companion /housing-stats page answers "where
in PA is housing being built / where is population growing or
shrinking." For that second question, the Census Building Permits
Survey alone isn't enough — a muni can have low permits because it's
shrinking *or* because it's already built out. Pairing permits with
population change tells the supply-vs-demand story.

The Census Population Estimates Program (PEP) publishes vintage-2024
sub-county estimates (April 2020 base + annual estimates through July
2024) as a single nationwide CSV. We download that file, filter to PA
county subdivisions (SUMLEV=061, STATE=42), compute the percent
change, and emit a normalized cache CSV that build_districts.py
merges into the muni geojson.

Output schema (pipeline/data/cache/pep_subcounty_pa.csv)
--------------------------------------------------------
geoid          : 10-char STATE(2) + COUNTY(3) + COUSUB(5)
name           : muni name as PEP reports it (e.g. "Bethlehem city")
pop2020        : April 2020 estimates base (Decennial-aligned)
pop2024        : July 1, 2024 estimate
pctChange2024  : 100 * (pop2024 - pop2020) / pop2020, rounded to 0.1

If pop2020 is zero or missing, pctChange2024 is left blank (downstream
treats blank as null/"--").
"""

from __future__ import annotations

import csv
import logging
import os
from io import BytesIO, StringIO
from pathlib import Path
from typing import Iterable
from zipfile import ZipFile

import requests

# Repo-relative paths
SCRIPT_DIR = Path(__file__).resolve().parent
PIPELINE_DIR = SCRIPT_DIR.parent
CACHE_DIR = PIPELINE_DIR / "data" / "cache"
OUTPUT_PATH = CACHE_DIR / "pep_subcounty_pa.csv"

# Census PEP sub-county estimates. The Census Bureau publishes these
# bulk files for each vintage; the directory + filename pattern has
# been stable for years but the exact vintage label updates annually.
#
# We try the v2024 location first (the May 2026 release announced
# alongside vintage 2024 estimates), then fall back to older patterns
# in case the URL drifts. The first URL to return HTTP 200 wins.
CANDIDATE_URLS: tuple[str, ...] = (
    # Pattern A — direct CSV, vintage 2024
    "https://www2.census.gov/programs-surveys/popest/datasets/"
    "2020-2024/cities/totals/sub-est2024.csv",
    # Pattern B — capitalized vintage variant
    "https://www2.census.gov/programs-surveys/popest/datasets/"
    "2020-2024/cities/totals/SUB-EST2024.csv",
    # Pattern C — alternate "mcd" subpath some past vintages have used
    "https://www2.census.gov/programs-surveys/popest/datasets/"
    "2020-2024/cities/totals/sub-est2024_all.csv",
)
# Allow override via env (useful for re-running once the user confirms
# the right URL from the Census release notes).
URL_OVERRIDE = os.environ.get("PEP_SUBCOUNTY_URL")

# Summary levels (SUMLEV) in the PEP sub-county CSV:
#   040 state, 050 county, 061 MCD (county subdivision), 071 MCD-in-CE,
#   157 place-within-county (consolidated cities + city-coterminous-
#       with-county cases like Philadelphia), 162 incorporated place.
# PA's munis are county subdivisions (061), with one exception:
# Philadelphia city is coterminous with Philadelphia County and only
# appears under SUMLEV 050/157/162, not 061. We pull SUMLEV 157 too
# so the largest muni in PA isn't a hole in the popchange map.
SUMLEV_MCD = "061"
SUMLEV_PLACE_IN_COUNTY = "157"
PA_STATE_FIPS = "42"

log = logging.getLogger("fetch_pep_subcounty")


def _try_download(url: str) -> bytes | None:
    log.info("trying %s", url)
    try:
        r = requests.get(url, timeout=120)
    except requests.RequestException as exc:
        log.warning("  error: %s", exc)
        return None
    if r.status_code != 200:
        log.info("  HTTP %s", r.status_code)
        return None
    log.info("  OK (%d bytes)", len(r.content))
    return r.content


def _maybe_unzip(payload: bytes) -> bytes:
    """The Census occasionally swaps a .csv URL for a .zip wrapper.
    Handle both transparently so the candidate-URL loop stays simple."""
    if payload[:2] == b"PK":
        with ZipFile(BytesIO(payload)) as zf:
            csv_name = next(
                (n for n in zf.namelist() if n.lower().endswith(".csv")),
                None,
            )
            if not csv_name:
                raise RuntimeError("zip from PEP had no CSV inside")
            return zf.read(csv_name)
    return payload


def _fetch_payload() -> bytes:
    urls: Iterable[str]
    if URL_OVERRIDE:
        urls = [URL_OVERRIDE]
    else:
        urls = CANDIDATE_URLS
    for url in urls:
        data = _try_download(url)
        if data is None:
            continue
        # The Census sometimes serves an HTML error page with status 200
        # (CDN quirk). A real CSV will start with the header row, not "<".
        head = data[:200].lstrip()
        if head.startswith(b"<"):
            log.warning("  got HTML, not CSV — skipping")
            continue
        return _maybe_unzip(data)
    raise RuntimeError(
        "Could not download PEP sub-county estimates from any candidate URL. "
        "Check the latest Census release at "
        "https://www.census.gov/programs-surveys/popest/data/data-sets.html "
        "and set PEP_SUBCOUNTY_URL=<correct url> before re-running."
    )


def _emit(rows: list[dict[str, str]]) -> None:
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_PATH.open("w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["geoid", "name", "pop2020", "pop2024", "pctChange2024"])
        w.writerows(
            [
                r["geoid"],
                r["name"],
                r["pop2020"],
                r["pop2024"],
                r["pctChange2024"],
            ]
            for r in rows
        )
    log.info("wrote %s (%d rows)", OUTPUT_PATH, len(rows))


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    payload = _fetch_payload()
    text = payload.decode("latin-1")  # PEP files are sometimes Latin-1
    reader = csv.DictReader(StringIO(text))
    # Census PEP sub-county CSVs have varied column names slightly
    # across vintages. Standard ones used since vintage 2020:
    #   SUMLEV, STATE, COUNTY, COUSUB, NAME, ESTIMATESBASE2020,
    #   POPESTIMATE2020, POPESTIMATE2021, ..., POPESTIMATE2024
    # Older vintages used POPESTIMATE2010, etc. — we hardcode the
    # vintage-2024 names and let it fail loudly if Census renames.
    required_cols = (
        "SUMLEV",
        "STATE",
        "COUNTY",
        "COUSUB",
        "NAME",
        "ESTIMATESBASE2020",
        "POPESTIMATE2024",
    )
    missing = [c for c in required_cols if c not in reader.fieldnames or []]
    if missing:
        raise RuntimeError(
            f"PEP CSV missing expected columns: {missing}. Got: {reader.fieldnames}"
        )
    out: list[dict[str, str]] = []
    seen_geoids: set[str] = set()
    for row in reader:
        sumlev = row.get("SUMLEV")
        if sumlev not in (SUMLEV_MCD, SUMLEV_PLACE_IN_COUNTY):
            continue
        if row.get("STATE") != PA_STATE_FIPS:
            continue
        # MCD rows construct the geoid from COUSUB; SUMLEV-157 rows
        # (e.g. Philadelphia) construct it from PLACE — TIGER assigns
        # county-coterminous cities a COUSUB code equal to the PLACE
        # code, so this gives us the same geoid the muni shapefile
        # uses (Philadelphia = 4210160000).
        cousub_code = (
            row["COUSUB"]
            if sumlev == SUMLEV_MCD
            else row.get("PLACE", "00000")
        )
        geoid = (
            row["STATE"].zfill(2)
            + row["COUNTY"].zfill(3)
            + cousub_code.zfill(5)
        )
        # Guard against double-counting if Philly somehow appears
        # under both SUMLEVs in a future vintage.
        if geoid in seen_geoids:
            continue
        seen_geoids.add(geoid)
        pop2020_raw = row.get("ESTIMATESBASE2020", "").strip()
        pop2024_raw = row.get("POPESTIMATE2024", "").strip()
        pct = ""
        try:
            pop2020 = int(pop2020_raw)
            pop2024 = int(pop2024_raw)
            if pop2020 > 0:
                pct = f"{round(100 * (pop2024 - pop2020) / pop2020, 1)}"
        except ValueError:
            pop2020 = 0
            pop2024 = 0
        out.append(
            {
                "geoid": geoid,
                "name": row.get("NAME", "").strip(),
                "pop2020": str(pop2020) if pop2020_raw else "",
                "pop2024": str(pop2024) if pop2024_raw else "",
                "pctChange2024": pct,
            }
        )
    if not out:
        raise RuntimeError(
            "Parsed PEP file but found 0 PA county-subdivision rows — "
            "the CSV layout may have changed."
        )
    _emit(out)


if __name__ == "__main__":
    main()
