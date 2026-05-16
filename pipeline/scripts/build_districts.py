"""Build the enriched PA House districts GeoJSON + PA counties layer.

Outputs:
    public/data/pa_house_districts.geojson  (district polygons + facts)
    public/data/pa_counties.geojson         (county polygons, for layer toggle)

Each district feature has these properties:

    district          str   "1".."203"
    population        int   ACS 2023 5-year total population
    landAreaSqMi      float Land area in square miles
    topMunicipalities list  Up to 5 largest municipalities by pop share;
                            entries: { name, classCode, populationShare }
    topCounties       list  Up to 5 counties by pop share within the
                            district; entries: { name, populationShare }
    classShares       dict  Share of district population in each
                            municipal class (sums to ~1.0).

Each county feature is a PA county polygon with:
    geoid            str   5-char FIPS, e.g. "42101" (Philadelphia)
    name             str   e.g. "Philadelphia"

Method
------
1. Download PA State House district shapefile from US Census TIGER/LINE.
2. Download PA county-subdivision shapefile (municipalities) from TIGER.
3. Download PA county shapefile (national file, filtered to STATEFP=42).
4. Download PA county-subdivision population from ACS 2023 5-year
   (table B01003).
5. Spatially intersect each district with each municipality; apportion
   muni population by area share to get population-in-intersection.
6. Aggregate per-district: top-N municipalities, top-N counties (grouped
   from muni intersections by county FIPS), per-class population shares.
7. Write enriched district GeoJSON + simplified county polygon GeoJSON.

Run:
    cd pipeline
    uv sync
    uv run python scripts/build_districts.py
"""

from __future__ import annotations

import json
import logging
import sys
import zipfile
from io import BytesIO
from pathlib import Path
from typing import Iterable

import geopandas as gpd
import pandas as pd
import requests

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("build_districts")

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

PIPELINE_DIR = Path(__file__).resolve().parents[1]
REPO_DIR = PIPELINE_DIR.parent
DATA_DIR = PIPELINE_DIR / "data"
RAW_DIR = DATA_DIR / "raw"
CACHE_DIR = DATA_DIR / "cache"
OUTPUT_DIR = REPO_DIR / "public" / "data"
OUTPUT_PATH = OUTPUT_DIR / "pa_house_districts.geojson"
SENATE_OUTPUT_PATH = OUTPUT_DIR / "pa_senate_districts.geojson"
COUNTIES_OUTPUT_PATH = OUTPUT_DIR / "pa_counties.geojson"
MUNIS_OUTPUT_PATH = OUTPUT_DIR / "pa_municipalities.geojson"

# Census TIGER/LINE 2024
TIGER_BASE = "https://www2.census.gov/geo/tiger/TIGER2024"
SLDL_URL = f"{TIGER_BASE}/SLDL/tl_2024_42_sldl.zip"  # PA State House
SLDU_URL = f"{TIGER_BASE}/SLDU/tl_2024_42_sldu.zip"  # PA State Senate
COUSUB_URL = f"{TIGER_BASE}/COUSUB/tl_2024_42_cousub.zip"  # PA municipalities
COUNTY_URL = f"{TIGER_BASE}/COUNTY/tl_2024_us_county.zip"  # All counties; filtered to PA

# ACS 2023 5-year. We pull these tables at county-subdivision level for PA
# (state FIPS 42):
#   B01003_001 — total population
#   B19013_001 — median household income (past 12 months)
#   B25077_001 — median value, owner-occupied
#   B25070_001 + _007..010 — gross rent as % of HHI (total + 30%+ buckets)
#   B25091_002, _008..011 (with mortgage) and _013, _019..022 (no mortgage) —
#     selected monthly owner costs as % of HHI
# Census API allows one call up to 50 variables; we fit comfortably.
ACS_VARS = (
    "NAME,"
    "B01003_001E,"  # total population
    "B19013_001E,"  # median household income
    "B25077_001E,"  # median home value
    # Rent-burdened (>=30% of HHI): gross rent buckets
    "B25070_001E,B25070_007E,B25070_008E,B25070_009E,B25070_010E,"
    # Owner cost burden with mortgage
    "B25091_002E,B25091_008E,B25091_009E,B25091_010E,B25091_011E,"
    # Owner cost burden without mortgage
    "B25091_013E,B25091_019E,B25091_020E,B25091_021E,B25091_022E"
)
ACS_URL = (
    "https://api.census.gov/data/2023/acs/acs5"
    f"?get={ACS_VARS}"
    "&for=county%20subdivision:*"
    "&in=state:42&in=county:*"
)

# Building Permits Survey — annual files by Place, organized by region.
# PA is in the Northeast Region. Each file is a CSV with two header rows
# and rows for places nationwide; we filter to State Code = 42 (PA).
BPS_BASE = "https://www2.census.gov/econ/bps/Place/Northeast%20Region"
BPS_YEARS = [2020, 2021, 2022, 2023, 2024]

# Cities for which we have parcel-level permit data, with the muni GEOIDs
# that should be removed from the BPS aggregation to avoid double-counting.
# Per-city CSVs live in pipeline/data/permits/{city}.csv with a shared
# schema (see fetch_philly_permits.py docstring).
PARCEL_CITIES = {
    "philadelphia": "4210160000",  # Philadelphia city
    "pittsburgh":   "4200361000",  # Pittsburgh city
}
PERMITS_DIR = PIPELINE_DIR / "data" / "permits"

# Authoritative PA municipal classifications, maintained by DCED.
# Includes CLASS column with PA legal designation (1st/2nd/2nd-A/3rd City,
# Borough, 1st/2nd Township, Town). The Census CLASSFP code is generic
# across the US and conflates PA cities + boroughs, so we ignore it.
DCED_CSV_URL = "https://dced.pa.gov/wp-content/themes/business2015/csv/municipalities.csv"

# Equal-area projection for PA. EPSG:5070 (NAD83 Conus Albers) is fine.
EQUAL_AREA_CRS = "EPSG:5070"
WGS84 = "EPSG:4326"

# Map DCED CLASS column → MunicipalClass union member in src/lib/types.ts.
DCED_CLASS_MAP: dict[str, str] = {
    "1st City": "first_class_city",
    "2nd City": "second_class_city",
    "2nd-A City": "second_class_a_city",
    "3rd City": "third_class_city",
    "Borough": "borough",
    "1st Township": "first_class_township",
    "2nd Township": "second_class_township",
    "Town": "town",
}

# DCED CLASS → muni "type" (used as part of the join key with Census).
DCED_TYPE: dict[str, str] = {
    "1st City": "city", "2nd City": "city", "2nd-A City": "city", "3rd City": "city",
    "Borough": "borough",
    "1st Township": "township", "2nd Township": "township",
    "Town": "town",
}

# ---------------------------------------------------------------------------
# Download helpers
# ---------------------------------------------------------------------------


def ensure_dirs() -> None:
    for d in (RAW_DIR, CACHE_DIR, OUTPUT_PATH.parent):
        d.mkdir(parents=True, exist_ok=True)


def download(url: str, dest: Path) -> Path:
    if dest.exists():
        log.info("cached: %s", dest.name)
        return dest
    log.info("downloading: %s", url)
    r = requests.get(url, timeout=120)
    r.raise_for_status()
    dest.write_bytes(r.content)
    return dest


def read_zipped_shapefile(zip_path: Path) -> gpd.GeoDataFrame:
    with zipfile.ZipFile(zip_path) as zf:
        shp_name = next(n for n in zf.namelist() if n.endswith(".shp"))
        # geopandas can read directly from a zip:// URI
        return gpd.read_file(f"zip://{zip_path}!{shp_name}")


# ---------------------------------------------------------------------------
# Loaders
# ---------------------------------------------------------------------------


def load_districts() -> gpd.GeoDataFrame:
    sldl_zip = download(SLDL_URL, RAW_DIR / "tl_2024_42_sldl.zip")
    gdf = read_zipped_shapefile(sldl_zip).to_crs(EQUAL_AREA_CRS)
    # Census uses SLDLST as the district number, e.g. "001", "203".
    gdf["district"] = gdf["SLDLST"].str.lstrip("0")
    # Square miles from ALAND (square meters)
    gdf["landAreaSqMi"] = gdf["ALAND"].astype(float) / 2_589_988.110336
    return gdf[["district", "landAreaSqMi", "geometry"]].copy()


def load_senate_districts() -> gpd.GeoDataFrame:
    sldu_zip = download(SLDU_URL, RAW_DIR / "tl_2024_42_sldu.zip")
    gdf = read_zipped_shapefile(sldu_zip).to_crs(EQUAL_AREA_CRS)
    # Census uses SLDUST as the senate district number, e.g. "001", "050".
    gdf["district"] = gdf["SLDUST"].str.lstrip("0")
    gdf["landAreaSqMi"] = gdf["ALAND"].astype(float) / 2_589_988.110336
    return gdf[["district", "landAreaSqMi", "geometry"]].copy()


def _normalize_muni_name(s: str) -> str:
    """Normalize a muni name for fuzzy join. Lowercases, expands "Mt." →
    "Mount" and "St." → "Saint", removes punctuation, collapses whitespace.
    """
    import re

    s = s.lower().strip()
    s = re.sub(r"\bmt\.?\s", "mount ", s)
    s = re.sub(r"\bst\.?\s", "saint ", s)
    # Strip everything that isn't a-z/0-9/space.
    s = re.sub(r"[^a-z0-9 ]+", "", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def _census_muni_type(namelsad: str) -> str | None:
    """Return the muni type from Census NAMELSAD ("Allentown city" → "city").
    Census uses "municipality" for home-rule munis (Monroeville, Bethel
    Park, Murrysville) — those return None and we look them up by name.
    """
    for t in ("city", "borough", "township", "town"):
        if namelsad.lower().endswith(" " + t):
            return t
    return None


def load_dced_classes() -> dict:
    """Download (or read from cache) the DCED municipality classification
    list. Returns a structure usable for joining to Census munis:

        {
            "by_key": {(county_lower, name_norm, type) → DCED_CLASS},
            "by_name_type": {(name_norm, type) → [DCED_CLASS, ...]},
            "by_name_only": {name_norm → [(DCED_CLASS, county), ...]},
        }

    The fallback layers cover cross-county munis (Census splits the
    polygon by county; DCED records it under one home county) and
    home-rule munis (Census NAMELSAD says "municipality", DCED says
    "Borough"/"Township").
    """
    import csv
    import re

    cache = CACHE_DIR / "dced_municipalities.csv"
    if not cache.exists():
        log.info("downloading DCED municipality classifications")
        r = requests.get(
            DCED_CSV_URL,
            headers={"User-Agent": "Mozilla/5.0 (compatible; pa-housing-votes)"},
            timeout=60,
        )
        r.raise_for_status()
        cache.write_bytes(r.content)
    rows = list(csv.DictReader(cache.open(newline="")))

    by_key: dict[tuple[str, str, str], str] = {}
    by_name_type: dict[tuple[str, str], list[str]] = {}
    by_name_only: dict[str, list[tuple[str, str]]] = {}

    for r in rows:
        cls = r["CLASS"]
        if cls not in DCED_CLASS_MAP:
            continue
        ts = DCED_TYPE[cls]
        county = r["COUNTY"].lower().strip()
        muni = r["MUNICIPALITY"]
        # DCED appends the type as a suffix word ("Allentown City",
        # "Bear Creek Township", "Mt Pleasant Borough"). Strip the
        # trailing type word — but ONLY if the result is non-empty and
        # still looks like a name (avoids breaking "Oil City", where
        # "City" is part of the actual name, not the suffix).
        stripped = re.sub(
            rf"\s+{re.escape(ts)}\b.*$", "", muni, flags=re.IGNORECASE
        ).strip()
        if stripped and stripped.lower() != ts:
            base = stripped
        else:
            base = muni
        name_norm = _normalize_muni_name(base)
        by_key[(county, name_norm, ts)] = cls
        by_name_type.setdefault((name_norm, ts), []).append(cls)
        by_name_only.setdefault(name_norm, []).append((cls, county))

    log.info("loaded %d DCED classifications", len(rows))
    return {
        "by_key": by_key,
        "by_name_type": by_name_type,
        "by_name_only": by_name_only,
    }


def _classify(
    *,
    name: str,
    namelsad: str,
    county_lower: str,
    dced: dict,
) -> str:
    """Look up a Census muni's PA class via the DCED CSV, with three
    fallback layers and a final NAMELSAD-only fallback."""
    name_norm = _normalize_muni_name(name)
    mtype = _census_muni_type(namelsad)
    # Layer 1: exact (county, name, type) match — covers ~99% of munis.
    if mtype:
        cls = dced["by_key"].get((county_lower, name_norm, mtype))
        if cls:
            return DCED_CLASS_MAP[cls]
    # Layer 2: (name, type) match if unambiguous — handles cross-county
    # munis like Bethlehem (Lehigh + Northampton).
    if mtype:
        candidates = dced["by_name_type"].get((name_norm, mtype), [])
        if candidates and len(set(candidates)) == 1:
            return DCED_CLASS_MAP[candidates[0]]
    # Layer 3: name-only match — handles home-rule munis where Census
    # NAMELSAD says "X municipality" but DCED records the original class
    # (e.g. Monroeville Borough, Bethel Park Borough).
    candidates = dced["by_name_only"].get(name_norm, [])
    if candidates and len(set(c for c, _ in candidates)) == 1:
        return DCED_CLASS_MAP[candidates[0][0]]
    # Layer 4: NAMELSAD type only (no first/second distinction available).
    if mtype == "city":
        return "third_class_city"  # Reasonable default; Philly/Pittsburgh/Scranton already caught in layer 1.
    if mtype == "borough":
        return "borough"
    if mtype == "township":
        return "second_class_township"  # Majority class for unmatched townships.
    if mtype == "town":
        return "town"
    return "other"


def load_municipalities(dced: dict, county_names: dict[str, str]) -> gpd.GeoDataFrame:
    cousub_zip = download(COUSUB_URL, RAW_DIR / "tl_2024_42_cousub.zip")
    gdf = read_zipped_shapefile(cousub_zip).to_crs(EQUAL_AREA_CRS)
    # GEOID is state(2) + county(3) + cousub(5) = 10 chars
    gdf["geoid"] = gdf["GEOID"]
    gdf["countyGeoid"] = gdf["geoid"].str.slice(0, 5)
    gdf["name"] = gdf["NAME"]
    gdf["namelsad"] = gdf["NAMELSAD"]
    gdf["classCode"] = [
        _classify(
            name=row["name"],
            namelsad=row["namelsad"],
            county_lower=county_names.get(row["countyGeoid"], "").lower(),
            dced=dced,
        )
        for _, row in gdf.iterrows()
    ]
    return gdf[
        ["geoid", "countyGeoid", "name", "classCode", "geometry"]
    ].copy()


def load_counties() -> gpd.GeoDataFrame:
    """Load the PA county polygons from the national TIGER county file.

    The file is ~10MB and contains ~3,200 counties nationwide; we filter
    to STATEFP=42 to get PA's 67 counties.
    """
    county_zip = download(COUNTY_URL, RAW_DIR / "tl_2024_us_county.zip")
    gdf = read_zipped_shapefile(county_zip)
    gdf = gdf[gdf["STATEFP"] == "42"].copy()
    gdf = gdf.to_crs(EQUAL_AREA_CRS)
    gdf["geoid"] = gdf["GEOID"]  # 5-char FIPS
    gdf["name"] = gdf["NAME"]
    return gdf[["geoid", "name", "geometry"]].copy()


def load_acs_housing_facts() -> pd.DataFrame:
    """ACS 2023 5-year — population + housing-affordability facts at
    the county-subdivision level.

    Returns a DataFrame keyed by 10-digit GEOID with columns:
      population, medianIncome, medianHomeValue, rentBurdenedPct,
      ownerBurdenedPct, ownerBurdenedTotal (count, used for weighting).

    Census's negative sentinels (-666666666 etc., used for suppressed
    estimates) are converted to NaN — handled at render time so the
    UI shows "—" rather than a misleading number.

    Requires a Census API key in the CENSUS_API_KEY environment
    variable (free signup at https://api.census.gov/data/key_signup.html).
    """
    import os

    cache = CACHE_DIR / "acs_pa_cousub_housing.json"
    if cache.exists():
        log.info("cached: %s", cache.name)
        rows = json.loads(cache.read_text())
    else:
        api_key = os.environ.get("CENSUS_API_KEY", "").strip()
        if not api_key:
            raise RuntimeError(
                "ACS data requires a Census API key. Sign up at "
                "https://api.census.gov/data/key_signup.html and export "
                "CENSUS_API_KEY=<key> before running the pipeline."
            )
        log.info("fetching ACS housing facts")
        r = requests.get(ACS_URL + f"&key={api_key}", timeout=90)
        r.raise_for_status()
        # Census responds with HTML error pages (Invalid Key, Missing
        # Key, etc.) instead of HTTP error codes — sniff for that here
        # rather than crashing in json.decode().
        if "text/html" in r.headers.get("content-type", "") or r.text.lstrip().startswith("<"):
            raise RuntimeError(
                "Census API returned an HTML error page instead of JSON. "
                "Likely cause: the CENSUS_API_KEY is invalid or not yet "
                "activated. Check your email for an activation link from "
                "Census, then retry. First 200 chars of response: "
                f"{r.text[:200]}"
            )
        rows = r.json()
        cache.write_text(json.dumps(rows))
    header, *body = rows
    df = pd.DataFrame(body, columns=header)

    def numeric(col: str) -> "pd.Series":
        v = pd.to_numeric(df[col], errors="coerce")
        # Census suppression sentinels are large negative numbers.
        return v.where(v >= 0)

    df["population"] = numeric("B01003_001E").fillna(0).astype(int)
    df["medianIncome"] = numeric("B19013_001E")
    df["medianHomeValue"] = numeric("B25077_001E")

    # Rent-burdened = households paying 30%+ of HHI in gross rent.
    rent_total = numeric("B25070_001E")
    rent_burdened = (
        numeric("B25070_007E").fillna(0)
        + numeric("B25070_008E").fillna(0)
        + numeric("B25070_009E").fillna(0)
        + numeric("B25070_010E").fillna(0)
    )
    df["rentBurdenedPct"] = (rent_burdened / rent_total).where(rent_total > 0)
    df["rentHouseholds"] = rent_total.fillna(0).astype(int)

    # Owner-burdened = owner-occupied units paying 30%+ of HHI in
    # selected monthly owner costs. Combine with-mortgage + without-
    # mortgage buckets so the metric covers all homeowners.
    own_w_total = numeric("B25091_002E").fillna(0)
    own_w_burdened = (
        numeric("B25091_008E").fillna(0)
        + numeric("B25091_009E").fillna(0)
        + numeric("B25091_010E").fillna(0)
        + numeric("B25091_011E").fillna(0)
    )
    own_n_total = numeric("B25091_013E").fillna(0)
    own_n_burdened = (
        numeric("B25091_019E").fillna(0)
        + numeric("B25091_020E").fillna(0)
        + numeric("B25091_021E").fillna(0)
        + numeric("B25091_022E").fillna(0)
    )
    own_total = own_w_total + own_n_total
    own_burdened = own_w_burdened + own_n_burdened
    df["ownerBurdenedPct"] = (own_burdened / own_total).where(own_total > 0)
    df["ownerHouseholds"] = own_total.astype(int)

    df["geoid"] = df["state"] + df["county"] + df["county subdivision"]
    return df[
        [
            "geoid",
            "population",
            "medianIncome",
            "medianHomeValue",
            "rentBurdenedPct",
            "rentHouseholds",
            "ownerBurdenedPct",
            "ownerHouseholds",
        ]
    ].copy()


def load_bps_permits(years: list[int] = BPS_YEARS) -> pd.DataFrame:
    """Aggregate housing-unit permit counts per PA muni across the
    given years from the Census Building Permits Survey Place files
    (Northeast Region, one CSV per year).

    Returns a DataFrame keyed by 10-digit GEOID with:
      permitsUnits5yrTotal — sum of housing units permitted (1+2+3-4+5+ unit)
      permitsYearsCovered  — how many years had any reported data (used to
        flag jurisdictions where reporting is sparse)
    """
    import csv
    import io

    per_year_frames: list[pd.DataFrame] = []
    for year in years:
        cache = CACHE_DIR / f"bps_ne_{year}a.txt"
        if cache.exists():
            log.info("cached: %s", cache.name)
            text = cache.read_text()
        else:
            url = f"{BPS_BASE}/ne{year}a.txt"
            log.info("fetching BPS %s", url)
            r = requests.get(url, timeout=60)
            r.raise_for_status()
            text = r.text
            cache.write_text(text)

        # BPS file has two header rows + a blank line, then CSV data.
        # The columns we need are at fixed positions, but the file is
        # comma-delimited so csv reader handles padding fine.
        reader = csv.reader(io.StringIO(text))
        rows = list(reader)
        # Skip the two header rows + any blank rows at top.
        data_rows = [r for r in rows[2:] if r and len(r) > 30 and r[1].strip()]

        records = []
        for row in data_rows:
            # State Code is col 1 (0-indexed). PA = "42".
            state_code = row[1].strip()
            if state_code != "42":
                continue
            try:
                county_code = row[3].strip().zfill(3)
                fips_mcd = row[6].strip().zfill(5)
                # If MCD is all zeros (place-only with no MCD), skip.
                if fips_mcd == "00000":
                    continue
                geoid = "42" + county_code + fips_mcd
                # Total housing units permitted = sum of 1-unit, 2-units,
                # 3-4 units, 5+ units. Columns 18, 21, 24, 27 (0-indexed)
                # for the "Units" sub-column of each unit-type block.
                units = (
                    int(row[18] or 0)
                    + int(row[21] or 0)
                    + int(row[24] or 0)
                    + int(row[27] or 0)
                )
                records.append({"geoid": geoid, "units": units, "year": year})
            except (ValueError, IndexError):
                continue

        year_df = pd.DataFrame(records)
        if not year_df.empty:
            # Sum across any duplicate rows for the same muni in a year
            # (BPS occasionally splits reporting).
            year_df = (
                year_df.groupby("geoid", as_index=False)
                .agg(units=("units", "sum"), year=("year", "first"))
            )
        per_year_frames.append(year_df)
        log.info(
            "BPS %d: %d PA muni rows, %d total units",
            year,
            len(year_df),
            int(year_df["units"].sum()) if not year_df.empty else 0,
        )

    combined = pd.concat(per_year_frames, ignore_index=True)
    if combined.empty:
        return pd.DataFrame(
            columns=["geoid", "permitsUnits5yrTotal", "permitsYearsCovered"]
        )
    grouped = combined.groupby("geoid").agg(
        permitsUnits5yrTotal=("units", "sum"),
        permitsYearsCovered=("year", "nunique"),
    ).reset_index()
    return grouped


def redistribute_bps_across_slices(
    bps_df: pd.DataFrame,
    acs_df: pd.DataFrame,
) -> pd.DataFrame:
    """For cross-county municipalities (a single muni split across two
    county GEOIDs because Census splits the polygon at county lines),
    BPS reports the city's entire permit count under one slice's
    GEOID. Without this fix, the reporting slice over-reports the
    per-1000 rate (denominator is too small) and the other slice
    shows "—".

    The fix: group by MCD code (last 5 chars of GEOID — the
    Census place id within PA), sum BPS permits and ACS population
    across all slices of the same MCD, then redistribute the total
    permits proportionally to each slice's population.

    For single-county munis, the MCD has one slice; the math
    collapses to no change.

    Affected munis include Bethlehem (Lehigh + Northampton),
    Adamstown borough (Berks + Lancaster), Telford borough (Bucks +
    Montgomery), and a handful of other smaller cross-county
    boroughs.
    """
    if bps_df.empty or acs_df.empty:
        return bps_df

    # MCD code is the last 5 chars of a 10-char GEOID
    work = bps_df.copy()
    work["mcd"] = work["geoid"].str[-5:]
    pop = acs_df[["geoid", "population"]].copy()
    pop["mcd"] = pop["geoid"].str[-5:]

    mcd_permits = work.groupby("mcd")["permitsUnits5yrTotal"].sum()
    mcd_years = work.groupby("mcd")["permitsYearsCovered"].max()
    mcd_pop = pop.groupby("mcd")["population"].sum()

    # Build a per-GEOID redistributed series. Start from every ACS GEOID
    # so cross-county slices that had no BPS row still get their share.
    out_rows = []
    n_cross_county = 0
    for _, r in pop.iterrows():
        mcd = r["mcd"]
        slice_pop = float(r["population"])
        total_mcd_pop = float(mcd_pop.get(mcd, 0))
        permits_at_mcd = float(mcd_permits.get(mcd, 0))
        years_at_mcd = int(mcd_years.get(mcd, 0))
        # Count how many GEOIDs share this MCD (cross-county detection)
        slices = (pop["mcd"] == mcd).sum()
        if slices > 1 and permits_at_mcd > 0:
            n_cross_county += 1
        if total_mcd_pop > 0 and permits_at_mcd > 0:
            share = slice_pop / total_mcd_pop
            allocated = permits_at_mcd * share
        else:
            allocated = 0.0
        out_rows.append(
            {
                "geoid": r["geoid"],
                "permitsUnits5yrTotal": allocated,
                "permitsYearsCovered": years_at_mcd,
            }
        )

    if n_cross_county:
        log.info(
            "BPS redistribution touched %d cross-county slices",
            n_cross_county,
        )
    return pd.DataFrame(out_rows)


# ---------------------------------------------------------------------------
# Spatial intersection + apportionment
# ---------------------------------------------------------------------------


def intersect_districts_x_munis(
    districts: gpd.GeoDataFrame,
    munis: gpd.GeoDataFrame,
) -> gpd.GeoDataFrame:
    log.info(
        "intersecting %d districts x %d municipalities",
        len(districts),
        len(munis),
    )
    # Pre-compute muni areas for areal interpolation.
    munis = munis.copy()
    munis["muni_area"] = munis.geometry.area

    # Use overlay (intersection) for a clean partition. This is the
    # expensive step but at PA scale (~203 * ~2,500) it runs in seconds
    # because most district/muni pairs don't intersect.
    inter = gpd.overlay(districts, munis, how="intersection", keep_geom_type=True)
    inter["intersection_area"] = inter.geometry.area
    inter["area_share"] = inter["intersection_area"] / inter["muni_area"]
    return inter


def compute_parcel_overrides(
    house: gpd.GeoDataFrame,
    senate: gpd.GeoDataFrame,
    bps_by_geoid: dict[str, int],
) -> dict[str, dict[str, float]]:
    """For each city with parcel-level permit data, spatial-join its
    geocoded permits onto the House and Senate district polygons and
    return per-district 5-year unit allocations.

    Cities whose CSVs carry real per-permit unit counts (Philly) get
    summed directly. Cities whose CSVs have no structured unit field
    (Pittsburgh; units = 0 throughout) are allocated by spatial share
    of permits multiplied by the city's BPS 5-year unit total.

    Returns: {
      "house":  {hd_id: units_5yr},
      "senate": {sd_id: units_5yr},
    }
    """
    out: dict[str, dict[str, float]] = {"house": {}, "senate": {}}

    if not PERMITS_DIR.exists():
        log.info("no parcel permits dir at %s; skipping overrides", PERMITS_DIR)
        return out

    for city_key, muni_geoid in PARCEL_CITIES.items():
        csv_path = PERMITS_DIR / f"{city_key}.csv"
        if not csv_path.exists():
            log.warning("no parcel CSV for %s at %s — skipping override", city_key, csv_path)
            continue
        df = pd.read_csv(csv_path)
        if df.empty:
            continue
        gdf = gpd.GeoDataFrame(
            df,
            geometry=gpd.points_from_xy(df["lng"], df["lat"]),
            crs=WGS84,
        ).to_crs(EQUAL_AREA_CRS)

        total_units = int(df["units"].sum())
        log.info(
            "parcel override for %s: %d permits, %d structured units",
            city_key,
            len(df),
            total_units,
        )

        for dist_gdf, dist_key in [(house, "house"), (senate, "senate")]:
            joined = gpd.sjoin(
                gdf,
                dist_gdf[["district", "geometry"]],
                how="inner",
                predicate="within",
            )
            if joined.empty:
                continue
            if total_units > 0:
                # Real unit counts — sum per district (Philly path).
                per_district = joined.groupby("district")["units"].sum()
                method = "structured-units"
            else:
                # No unit counts in source — distribute the city's BPS
                # total proportionally to permit-count share (Pittsburgh).
                bps_total = bps_by_geoid.get(muni_geoid, 0)
                if bps_total == 0:
                    log.warning(
                        "%s parcel CSV has no units AND no BPS total for "
                        "GEOID %s — overriding to zero",
                        city_key, muni_geoid,
                    )
                    per_district = joined.groupby("district").size() * 0.0
                else:
                    counts = joined.groupby("district").size()
                    per_district = counts / counts.sum() * bps_total
                method = f"permit-share × BPS total ({bps_by_geoid.get(muni_geoid, 0)} units)"
            log.info(
                "  %s × %d districts (%s)",
                dist_key,
                len(per_district),
                method,
            )
            for d, u in per_district.items():
                out[dist_key][str(d)] = out[dist_key].get(str(d), 0) + float(u)

    return out


def compute_nesting(
    house: gpd.GeoDataFrame,
    senate: gpd.GeoDataFrame,
) -> tuple[dict[str, list[dict]], dict[str, list[dict]]]:
    """Compute House <-> Senate district nesting via spatial overlay.

    For each Senate district, return the list of House districts that
    sit inside it with two share metrics:

      - overlapShareOfHD: what fraction of the HD's area is inside this SD
        (≥0.5 means the HD primarily belongs to this SD).
      - areaShareOfSD: what fraction of the SD's area is covered by this HD.

    Returns (senate_to_house, house_to_senate). The second is a flipped
    view (each HD knows which SDs it touches and by how much).
    """
    log.info(
        "computing nesting: %d house x %d senate districts",
        len(house),
        len(senate),
    )
    h = house[["district", "geometry"]].rename(columns={"district": "houseDistrict"}).copy()
    s = senate[["district", "geometry"]].rename(columns={"district": "senateDistrict"}).copy()
    h["hd_area"] = h.geometry.area
    s["sd_area"] = s.geometry.area
    inter = gpd.overlay(h, s, how="intersection", keep_geom_type=True)
    inter["intersection_area"] = inter.geometry.area
    inter["overlapShareOfHD"] = inter["intersection_area"] / inter["hd_area"]
    inter["areaShareOfSD"] = inter["intersection_area"] / inter["sd_area"]

    # Filter to meaningful slivers (skip tiny floating-point dust).
    inter = inter[inter["overlapShareOfHD"] > 0.005].copy()

    sd_to_hd: dict[str, list[dict]] = {}
    for sd, sub in inter.groupby("senateDistrict"):
        rows = sub.sort_values("areaShareOfSD", ascending=False)
        sd_to_hd[str(sd)] = [
            {
                "district": str(r["houseDistrict"]),
                "overlapShareOfHD": float(r["overlapShareOfHD"]),
                "areaShareOfSD": float(r["areaShareOfSD"]),
            }
            for _, r in rows.iterrows()
        ]

    hd_to_sd: dict[str, list[dict]] = {}
    for hd, sub in inter.groupby("houseDistrict"):
        rows = sub.sort_values("overlapShareOfHD", ascending=False)
        hd_to_sd[str(hd)] = [
            {
                "district": str(r["senateDistrict"]),
                "overlapShareOfHD": float(r["overlapShareOfHD"]),
                "areaShareOfSD": float(r["areaShareOfSD"]),
            }
            for _, r in rows.iterrows()
        ]

    return sd_to_hd, hd_to_sd


def aggregate_district_stats(
    inter: gpd.GeoDataFrame,
    acs_df: pd.DataFrame,
    bps_df: pd.DataFrame,
    county_names: dict[str, str],
    parcel_overrides: dict[str, float] | None = None,
) -> pd.DataFrame:
    """For each district, compute total population, top-5 munis by
    population share, top-5 counties by population share, class shares,
    and population-weighted housing-affordability aggregates."""
    # Attach muni-level ACS + BPS facts
    df = inter.merge(acs_df, on="geoid", how="left")
    df = df.merge(bps_df, on="geoid", how="left")
    df["population_in_intersection"] = df["population"].fillna(0) * df["area_share"]
    # Counts that aggregate cleanly via area_share apportionment.
    df["permits_in_intersection"] = (
        df["permitsUnits5yrTotal"].fillna(0) * df["area_share"]
    )
    df["rent_households_in_intersection"] = (
        df["rentHouseholds"].fillna(0) * df["area_share"]
    )
    df["rent_burdened_in_intersection"] = (
        df["rentBurdenedPct"].fillna(0)
        * df["rentHouseholds"].fillna(0)
        * df["area_share"]
    )
    df["owner_households_in_intersection"] = (
        df["ownerHouseholds"].fillna(0) * df["area_share"]
    )
    df["owner_burdened_in_intersection"] = (
        df["ownerBurdenedPct"].fillna(0)
        * df["ownerHouseholds"].fillna(0)
        * df["area_share"]
    )
    # Median weighted by population-in-intersection. Mixing medians is
    # approximate — but it's a useful district-level signal.
    df["income_weighted"] = (
        df["medianIncome"].fillna(0) * df["population_in_intersection"]
    )
    df["income_weight"] = df["medianIncome"].notna() * df["population_in_intersection"]
    df["home_value_weighted"] = (
        df["medianHomeValue"].fillna(0) * df["population_in_intersection"]
    )
    df["home_value_weight"] = (
        df["medianHomeValue"].notna() * df["population_in_intersection"]
    )

    # District total = sum of all intersection populations
    district_pop = df.groupby("district")["population_in_intersection"].sum()
    district_pop.name = "population"

    # Top munis per district (overlay already produces one row per
    # (district, muni) intersection).
    top_munis: dict[str, list[dict]] = {}
    for district, sub in df.groupby("district"):
        total = district_pop.loc[district]
        if total <= 0:
            top_munis[district] = []
            continue
        sub = sub.assign(
            share=sub["population_in_intersection"] / total
        ).sort_values("share", ascending=False)
        top_munis[district] = [
            {
                "name": str(r["name"]),
                "classCode": str(r["classCode"]),
                "populationShare": float(r["share"]),
            }
            for _, r in sub.head(5).iterrows()
        ]

    # Top counties per district — group muni intersections by countyGeoid
    # (first 5 chars of the muni GEOID). Each PA House district typically
    # touches 1-5 counties.
    top_counties: dict[str, list[dict]] = {}
    for district, sub in df.groupby("district"):
        total = district_pop.loc[district]
        if total <= 0:
            top_counties[district] = []
            continue
        per_county = (
            sub.groupby("countyGeoid")["population_in_intersection"]
            .sum()
            .sort_values(ascending=False)
        )
        top_counties[district] = [
            {
                "name": county_names.get(geoid, geoid),
                "geoid": geoid,
                "populationShare": float(pop / total),
            }
            for geoid, pop in per_county.head(5).items()
        ]

    # Class shares per district
    class_shares: dict[str, dict[str, float]] = {}
    for district, sub in df.groupby("district"):
        total = district_pop.loc[district]
        if total <= 0:
            class_shares[district] = {}
            continue
        grp = sub.groupby("classCode")["population_in_intersection"].sum() / total
        class_shares[district] = {k: float(v) for k, v in grp.items() if v > 0}

    # Per-district housing aggregates
    grp = df.groupby("district")
    permits_total = grp["permits_in_intersection"].sum()
    # Parcel-level overrides: for cities where we have geocoded permit
    # data (Philly, Pittsburgh), add the per-district unit totals from
    # those sources. Those cities' GEOIDs have been removed from
    # bps_df upstream so the area-apportioned permits_total does not
    # double-count them.
    if parcel_overrides:
        overrides_series = pd.Series(parcel_overrides, dtype=float)
        permits_total = permits_total.add(overrides_series, fill_value=0)
    rent_households = grp["rent_households_in_intersection"].sum()
    rent_burdened = grp["rent_burdened_in_intersection"].sum()
    owner_households = grp["owner_households_in_intersection"].sum()
    owner_burdened = grp["owner_burdened_in_intersection"].sum()
    income_w = grp["income_weighted"].sum()
    income_wt = grp["income_weight"].sum()
    home_value_w = grp["home_value_weighted"].sum()
    home_value_wt = grp["home_value_weight"].sum()

    def _maybe_div(num: "pd.Series", den: "pd.Series") -> "pd.Series":
        # Avoid divide-by-zero; rows with den=0 produce NaN.
        return (num / den.where(den > 0)).where(den > 0)

    median_income = _maybe_div(income_w, income_wt)
    median_home_value = _maybe_div(home_value_w, home_value_wt)
    rent_burdened_pct = _maybe_div(rent_burdened, rent_households) * 100
    owner_burdened_pct = _maybe_div(owner_burdened, owner_households) * 100
    # Permits per 1,000 residents per year (5-year window)
    permits_per_1k = _maybe_div(permits_total, district_pop) * (1000 / 5)

    out = pd.DataFrame(
        {
            "population": district_pop.round().astype(int),
            "topMunicipalities": pd.Series(top_munis),
            "topCounties": pd.Series(top_counties),
            "classShares": pd.Series(class_shares),
            "medianIncome": median_income.round(),
            "medianHomeValue": median_home_value.round(),
            "rentBurdenedPct": rent_burdened_pct.round(1),
            "ownerBurdenedPct": owner_burdened_pct.round(1),
            "permitsPer1kPerYear": permits_per_1k.round(1),
            "permits5yrTotal": permits_total.round().astype(int),
        }
    )
    out.index.name = "district"
    return out.reset_index()


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def write_geojson(
    gdf: gpd.GeoDataFrame,
    path: Path,
    *,
    name: str,
    cross_chamber_key: str,
    cross_chamber_data: dict[str, list[dict]] | None = None,
) -> None:
    """Write the district GeoJSON, embedding nested objects as real JSON (not strings).

    cross_chamber_key: property name to use for cross-chamber nesting on
    each feature ("nestedHouseDistricts" for senate features,
    "parentSenateDistricts" for house features).
    """
    path.parent.mkdir(parents=True, exist_ok=True)
    features = []
    for _, row in gdf.iterrows():
        props = {
            "district": row["district"],
            "population": int(row["population"]),
            "landAreaSqMi": round(float(row["landAreaSqMi"]), 1),
            "topMunicipalities": row["topMunicipalities"],
            "topCounties": row["topCounties"],
            "classShares": row["classShares"],
            "medianIncome": _round_or_none(row.get("medianIncome")),
            "medianHomeValue": _round_or_none(row.get("medianHomeValue")),
            "rentBurdenedPct": _nullable_float(row.get("rentBurdenedPct")),
            "ownerBurdenedPct": _nullable_float(row.get("ownerBurdenedPct")),
            "permitsPer1kPerYear": _nullable_float(row.get("permitsPer1kPerYear")),
            "permits5yrTotal": int(row.get("permits5yrTotal") or 0),
        }
        if cross_chamber_data is not None:
            props[cross_chamber_key] = cross_chamber_data.get(str(row["district"]), [])
        features.append(
            {
                "type": "Feature",
                "properties": props,
                "geometry": json.loads(
                    gpd.GeoSeries([row.geometry], crs=gdf.crs)
                    .to_crs(WGS84)
                    .to_json()
                )["features"][0]["geometry"],
            }
        )
    fc = {
        "type": "FeatureCollection",
        "name": name,
        "crs": {"type": "name", "properties": {"name": "EPSG:4326"}},
        "features": features,
    }
    path.write_text(json.dumps(fc, separators=(",", ":")))
    log.info("wrote %s (%d features, %.1f KB)", path, len(features), path.stat().st_size / 1024)


def write_counties_geojson(gdf: gpd.GeoDataFrame, path: Path) -> None:
    """Write the PA counties GeoJSON layer (used for the map's county toggle)."""
    path.parent.mkdir(parents=True, exist_ok=True)
    # Counties are big and we render them as outlines only — heavy
    # simplification is fine.
    simplified = gdf.copy()
    simplified["geometry"] = simplified.geometry.simplify(150, preserve_topology=True)
    simplified = simplified.to_crs(WGS84)
    fc = json.loads(simplified.to_json())
    # Trim the per-feature properties to just the fields the UI needs.
    for feat in fc["features"]:
        props = feat.get("properties", {})
        feat["properties"] = {
            "geoid": props.get("geoid", ""),
            "name": props.get("name", ""),
        }
    fc["name"] = "pa_counties"
    fc["crs"] = {"type": "name", "properties": {"name": "EPSG:4326"}}
    path.write_text(json.dumps(fc, separators=(",", ":")))
    log.info(
        "wrote %s (%d features, %.1f KB)",
        path,
        len(fc["features"]),
        path.stat().st_size / 1024,
    )


def _round_or_none(v) -> int | None:
    """Round a numeric to int, or return None for null/NaN/missing."""
    if v is None:
        return None
    try:
        f = float(v)
    except (TypeError, ValueError):
        return None
    if f != f:  # NaN check
        return None
    return round(f)


def _nullable_float(v) -> float | None:
    """Pass through a non-null float (rounded sensibly) or return None
    for NaN / missing. Used for percentages and rates we already
    rounded upstream."""
    if v is None:
        return None
    try:
        f = float(v)
    except (TypeError, ValueError):
        return None
    if f != f:
        return None
    return f


def _round_pct(v) -> float | None:
    """Convert a 0..1 share to a 0..100 pct rounded to 1 decimal, or None."""
    if v is None:
        return None
    try:
        f = float(v)
    except (TypeError, ValueError):
        return None
    if f != f:  # NaN
        return None
    return round(f * 100, 1)


def write_munis_geojson(
    gdf: gpd.GeoDataFrame,
    acs: pd.DataFrame,
    bps: pd.DataFrame,
    county_names: dict[str, str],
    path: Path,
) -> None:
    """Write the PA municipalities GeoJSON layer (used for the map's
    municipal-boundaries overlay + class-highlight filter + hover
    tooltip). Each feature carries the muni's name, class, county,
    population + density + area, plus housing-affordability facts:
    median income, median home value, % rent-burdened, % owner-burdened,
    and 5-year housing-permits-per-1000-residents-per-year."""
    path.parent.mkdir(parents=True, exist_ok=True)
    enriched = gdf.copy()
    enriched = enriched.merge(acs, on="geoid", how="left")
    enriched = enriched.merge(bps, on="geoid", how="left")
    enriched["population"] = enriched["population"].fillna(0).astype(int)
    # Keep permitsUnits5yrTotal as float — after cross-county
    # redistribution, slices carry fractional unit counts (e.g.
    # Bethlehem's permits split proportionally between Lehigh +
    # Northampton). Casting to int here would lose the precision
    # and break the "all slices of one muni share the same rate"
    # invariant.
    enriched["permitsUnits5yrTotal"] = (
        enriched["permitsUnits5yrTotal"].fillna(0).astype(float)
    )
    enriched["permitsYearsCovered"] = (
        enriched["permitsYearsCovered"].fillna(0).astype(int)
    )
    # Equal-area CRS at this point (EPSG:5070) → area in m².
    enriched["landAreaSqMi"] = enriched.geometry.area / 2_589_988.110336
    enriched["countyName"] = enriched["countyGeoid"].map(county_names).fillna("")
    # 2,573 features — keep simplification moderate (50m) since users
    # toggle this on intentionally and might zoom in.
    enriched["geometry"] = enriched.geometry.simplify(50, preserve_topology=True)
    enriched = enriched.to_crs(WGS84)
    fc = json.loads(enriched.to_json())
    for feat in fc["features"]:
        props = feat.get("properties", {})
        land_area = float(props.get("landAreaSqMi") or 0)
        population = int(props.get("population") or 0)
        density = round(population / land_area) if land_area > 0 else 0
        permits_total = float(props.get("permitsUnits5yrTotal") or 0)
        years_covered = int(props.get("permitsYearsCovered") or 0)
        # Annual permits per 1,000 residents, averaged over the 5-year
        # window. If a muni has no population, leave the rate null so
        # the UI shows "—" instead of dividing by zero.
        permits_per_1k_per_yr = None
        if population > 0 and years_covered > 0:
            permits_per_1k_per_yr = round(
                (permits_total / years_covered) / (population / 1000), 1
            )
        feat["properties"] = {
            "geoid": props.get("geoid", ""),
            "name": props.get("name", ""),
            "classCode": props.get("classCode", "other"),
            "countyName": props.get("countyName", ""),
            "population": population,
            "landAreaSqMi": round(land_area, 1),
            "populationDensity": density,
            "medianIncome": _round_or_none(props.get("medianIncome")),
            "medianHomeValue": _round_or_none(props.get("medianHomeValue")),
            "rentBurdenedPct": _round_pct(props.get("rentBurdenedPct")),
            "ownerBurdenedPct": _round_pct(props.get("ownerBurdenedPct")),
            "permitsPer1kPerYear": permits_per_1k_per_yr,
            "permitsYearsCovered": years_covered,
        }
    fc["name"] = "pa_municipalities"
    fc["crs"] = {"type": "name", "properties": {"name": "EPSG:4326"}}
    path.write_text(json.dumps(fc, separators=(",", ":")))
    log.info(
        "wrote %s (%d features, %.1f KB)",
        path,
        len(fc["features"]),
        path.stat().st_size / 1024,
    )


def simplify_for_web(gdf: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    """Simplify district polygons to ~50m tolerance in equal-area CRS.

    PA House districts have plenty of detail; for a statewide map at
    zoom 5–10 we don't need it. Tolerance of 50m saves a lot of bytes.
    """
    out = gdf.copy()
    out["geometry"] = out.geometry.simplify(50, preserve_topology=True)
    return out


def build_chamber_geojson(
    districts: gpd.GeoDataFrame,
    munis: gpd.GeoDataFrame,
    acs: pd.DataFrame,
    bps: pd.DataFrame,
    county_names: dict[str, str],
    output_path: Path,
    label: str,
    cross_chamber_key: str,
    cross_chamber_data: dict[str, list[dict]],
    parcel_overrides: dict[str, float] | None = None,
) -> None:
    """Intersect districts with munis, aggregate stats, simplify, write GeoJSON."""
    log.info("building %s GeoJSON...", label)
    inter = intersect_districts_x_munis(districts, munis)
    stats = aggregate_district_stats(
        inter, acs, bps, county_names, parcel_overrides=parcel_overrides
    )
    enriched = districts.merge(stats, on="district", how="left")
    enriched = simplify_for_web(enriched)
    write_geojson(
        enriched,
        output_path,
        name=f"pa_{label}_districts",
        cross_chamber_key=cross_chamber_key,
        cross_chamber_data=cross_chamber_data,
    )


def _load_env_file() -> None:
    """Best-effort load of pipeline/.env into os.environ. Only sets
    variables that aren't already in the environment so an explicit
    shell export still wins."""
    import os

    env_path = PIPELINE_DIR / ".env"
    if not env_path.exists():
        return
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


def main(argv: Iterable[str]) -> int:
    _load_env_file()
    ensure_dirs()
    log.info("loading house districts...")
    house = load_districts()
    log.info("loading senate districts...")
    senate = load_senate_districts()
    log.info("loading counties...")
    counties = load_counties()
    county_names = dict(zip(counties["geoid"], counties["name"]))
    log.info("loading DCED classifications...")
    dced = load_dced_classes()
    log.info("loading municipalities...")
    munis = load_municipalities(dced, county_names)
    log.info("loading ACS housing facts...")
    acs = load_acs_housing_facts()
    log.info("loading BPS housing permits...")
    bps = load_bps_permits()
    bps = redistribute_bps_across_slices(bps, acs)

    sd_to_hd, hd_to_sd = compute_nesting(house, senate)

    # Build a BPS GEOID → 5yr unit total lookup BEFORE we filter out
    # the override-cities — the override step needs the city-level
    # total for cities without structured per-permit unit counts
    # (Pittsburgh path).
    bps_by_geoid = dict(zip(bps["geoid"], bps["permitsUnits5yrTotal"]))
    parcel_overrides = compute_parcel_overrides(house, senate, bps_by_geoid)

    # Now strip the parcel-override cities from BPS so the
    # area-apportioned path doesn't double-count them. The parcel
    # data is the authoritative source for these GEOIDs.
    override_geoids = set(PARCEL_CITIES.values())
    bps_for_aggregation = bps[~bps["geoid"].isin(override_geoids)].copy()
    if override_geoids:
        log.info(
            "Removed %d city GEOIDs from BPS to defer to parcel data: %s",
            len(override_geoids),
            sorted(override_geoids),
        )

    build_chamber_geojson(
        house, munis, acs, bps_for_aggregation, county_names, OUTPUT_PATH,
        label="house",
        cross_chamber_key="parentSenateDistricts",
        cross_chamber_data=hd_to_sd,
        parcel_overrides=parcel_overrides.get("house"),
    )
    build_chamber_geojson(
        senate, munis, acs, bps_for_aggregation, county_names, SENATE_OUTPUT_PATH,
        label="senate",
        cross_chamber_key="nestedHouseDistricts",
        cross_chamber_data=sd_to_hd,
        parcel_overrides=parcel_overrides.get("senate"),
    )
    write_counties_geojson(counties, COUNTIES_OUTPUT_PATH)
    write_munis_geojson(munis, acs, bps, county_names, MUNIS_OUTPUT_PATH)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
