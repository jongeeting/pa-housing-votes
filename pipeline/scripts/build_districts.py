"""Build the enriched PA House districts GeoJSON used by the web app.

Outputs:
    public/data/pa_house_districts.geojson

Each output feature is a PA State House district polygon (203 total)
with the following properties:

    district          str   "1".."203"
    population        int   ACS 2023 5-year total population
    landAreaSqMi      float Land area in square miles
    topMunicipalities list  Up to 5 largest municipalities by population
                            share within the district. Each entry:
                                { name, classCode, populationShare }
    classShares       dict  Share of district population in each
                            municipal class (sums to ~1.0).

Method
------
1. Download PA State House district shapefile from US Census TIGER/LINE.
2. Download PA county-subdivision shapefile (municipalities) from TIGER.
3. Download PA county-subdivision population from ACS 2023 5-year
   (table B01003).
4. Spatially intersect each district with each municipality.
5. Apportion municipality population to the intersection by area share.
6. Aggregate per-district top-N municipalities + per-class population
   shares.
7. Write final GeoJSON (WGS84) into public/data/.

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
OUTPUT_PATH = REPO_DIR / "public" / "data" / "pa_house_districts.geojson"

# Census TIGER/LINE 2024
TIGER_BASE = "https://www2.census.gov/geo/tiger/TIGER2024"
SLDL_URL = f"{TIGER_BASE}/SLDL/tl_2024_42_sldl.zip"  # PA State House
COUSUB_URL = f"{TIGER_BASE}/COUSUB/tl_2024_42_cousub.zip"  # PA municipalities

# ACS 2023 5-year, total pop by county subdivision in PA (state FIPS 42)
ACS_URL = (
    "https://api.census.gov/data/2023/acs/acs5"
    "?get=NAME,B01003_001E"
    "&for=county%20subdivision:*"
    "&in=state:42&in=county:*"
)

# Equal-area projection for PA. EPSG:5070 (NAD83 Conus Albers) is fine.
EQUAL_AREA_CRS = "EPSG:5070"
WGS84 = "EPSG:4326"

# Municipal class codes per Census MAF/TIGER reference (CLASSFP):
# https://www.census.gov/library/reference/code-lists/class-codes.html
# Note: Census MCD class codes are general, not PA-specific. We map them
# to PA's own class taxonomy where possible, falling back to "other".
CLASSFP_MAP = {
    "C1": "first_class_city",  # Active incorporated place w/o subdivisions
    "C5": "borough",  # Place that is independent of any MCD
    "T1": "first_class_township",  # Active twp area w/ functioning gov
    "T5": "second_class_township",  # Inactive / minor
    "C2": "second_class_city",
    "C7": "third_class_city",
    "T2": "town",
    "T9": "other",
    "Z1": "other",  # Unorganized territory
    "Z3": "other",
    "Z5": "other",
    "Z9": "other",
}

# Special-cased PA municipalities by GEOID (state+county+cousub) to
# override classification when the generic CLASSFP isn't reliable enough.
PA_OVERRIDES = {
    "4210160000": "first_class_city",  # Philadelphia
    "4200361000": "second_class_city",  # Pittsburgh
    "4206971712": "second_class_a_city",  # Scranton (approx)
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


def load_municipalities() -> gpd.GeoDataFrame:
    cousub_zip = download(COUSUB_URL, RAW_DIR / "tl_2024_42_cousub.zip")
    gdf = read_zipped_shapefile(cousub_zip).to_crs(EQUAL_AREA_CRS)
    # GEOID is state(2) + county(3) + cousub(5) = 10 chars
    gdf["geoid"] = gdf["GEOID"]
    gdf["name"] = gdf["NAME"]
    gdf["classfp"] = gdf["CLASSFP"]
    gdf["classCode"] = gdf["classfp"].map(CLASSFP_MAP).fillna("other")
    # Apply PA overrides
    gdf.loc[gdf["geoid"].isin(PA_OVERRIDES), "classCode"] = gdf["geoid"].map(
        PA_OVERRIDES
    )
    return gdf[["geoid", "name", "classfp", "classCode", "geometry"]].copy()


def load_acs_population() -> pd.DataFrame:
    """ACS 2023 5-year total pop by county subdivision."""
    cache = CACHE_DIR / "acs_pa_cousub_pop.json"
    if cache.exists():
        log.info("cached: %s", cache.name)
        rows = json.loads(cache.read_text())
    else:
        log.info("fetching ACS")
        r = requests.get(ACS_URL, timeout=60)
        r.raise_for_status()
        rows = r.json()
        cache.write_text(json.dumps(rows))
    header, *body = rows
    df = pd.DataFrame(body, columns=header)
    df["population"] = pd.to_numeric(df["B01003_001E"], errors="coerce").fillna(0)
    df["geoid"] = df["state"] + df["county"] + df["county subdivision"]
    return df[["geoid", "population"]].copy()


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


def aggregate_district_stats(
    inter: gpd.GeoDataFrame,
    pop_df: pd.DataFrame,
) -> pd.DataFrame:
    """For each district, compute total population, top-5 munis by
    population share, and class shares."""
    # Attach muni population
    df = inter.merge(pop_df, on="geoid", how="left")
    df["population_in_intersection"] = df["population"].fillna(0) * df["area_share"]

    # District total = sum of all intersection populations
    district_pop = df.groupby("district")["population_in_intersection"].sum()
    district_pop.name = "population"

    # Per-(district, muni) population (a muni straddling two districts
    # produces two rows — we want the one row per (district, muni)
    # already because overlay splits geometries that way).
    # Top munis per district:
    top_records: dict[str, list[dict]] = {}
    for district, sub in df.groupby("district"):
        total = district_pop.loc[district]
        if total <= 0:
            top_records[district] = []
            continue
        sub = sub.assign(
            share=sub["population_in_intersection"] / total
        ).sort_values("share", ascending=False)
        top_records[district] = [
            {
                "name": str(r["name"]),
                "classCode": str(r["classCode"]),
                "populationShare": float(r["share"]),
            }
            for _, r in sub.head(5).iterrows()
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

    out = pd.DataFrame(
        {
            "population": district_pop.round().astype(int),
            "topMunicipalities": pd.Series(top_records),
            "classShares": pd.Series(class_shares),
        }
    )
    out.index.name = "district"
    return out.reset_index()


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def write_geojson(gdf: gpd.GeoDataFrame, path: Path) -> None:
    """Write a GeoJSON, embedding nested objects as real JSON (not strings)."""
    path.parent.mkdir(parents=True, exist_ok=True)
    # GeoPandas serializes dict/list cells as strings via to_file; we want
    # them as real JSON, so build the FeatureCollection by hand.
    features = []
    for _, row in gdf.iterrows():
        props = {
            "district": row["district"],
            "population": int(row["population"]),
            "landAreaSqMi": round(float(row["landAreaSqMi"]), 1),
            "topMunicipalities": row["topMunicipalities"],
            "classShares": row["classShares"],
        }
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
        "name": "pa_house_districts",
        "crs": {"type": "name", "properties": {"name": "EPSG:4326"}},
        "features": features,
    }
    path.write_text(json.dumps(fc, separators=(",", ":")))
    log.info("wrote %s (%d features, %.1f KB)", path, len(features), path.stat().st_size / 1024)


def simplify_for_web(gdf: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    """Simplify district polygons to ~50m tolerance in equal-area CRS.

    PA House districts have plenty of detail; for a statewide map at
    zoom 5–10 we don't need it. Tolerance of 50m saves a lot of bytes.
    """
    out = gdf.copy()
    out["geometry"] = out.geometry.simplify(50, preserve_topology=True)
    return out


def main(argv: Iterable[str]) -> int:
    ensure_dirs()
    log.info("loading districts...")
    districts = load_districts()
    log.info("loading municipalities...")
    munis = load_municipalities()
    log.info("loading ACS population...")
    pop = load_acs_population()

    inter = intersect_districts_x_munis(districts, munis)
    stats = aggregate_district_stats(inter, pop)

    # Join stats back onto district geometries
    enriched = districts.merge(stats, on="district", how="left")
    enriched = simplify_for_web(enriched)

    write_geojson(enriched, OUTPUT_PATH)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
