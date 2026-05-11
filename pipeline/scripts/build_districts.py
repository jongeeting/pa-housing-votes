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

# ACS 2023 5-year, total pop by county subdivision in PA (state FIPS 42)
ACS_URL = (
    "https://api.census.gov/data/2023/acs/acs5"
    "?get=NAME,B01003_001E"
    "&for=county%20subdivision:*"
    "&in=state:42&in=county:*"
)

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
    pop_df: pd.DataFrame,
    county_names: dict[str, str],
) -> pd.DataFrame:
    """For each district, compute total population, top-5 munis by
    population share, top-5 counties by population share, and class shares."""
    # Attach muni population
    df = inter.merge(pop_df, on="geoid", how="left")
    df["population_in_intersection"] = df["population"].fillna(0) * df["area_share"]

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

    out = pd.DataFrame(
        {
            "population": district_pop.round().astype(int),
            "topMunicipalities": pd.Series(top_munis),
            "topCounties": pd.Series(top_counties),
            "classShares": pd.Series(class_shares),
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


def write_munis_geojson(gdf: gpd.GeoDataFrame, path: Path) -> None:
    """Write the PA municipalities GeoJSON layer (used for the map's
    municipal-boundaries overlay + class-highlight filter)."""
    path.parent.mkdir(parents=True, exist_ok=True)
    # 2,573 features — keep simplification moderate (50m) since users
    # toggle this on intentionally and might zoom in.
    simplified = gdf.copy()
    simplified["geometry"] = simplified.geometry.simplify(50, preserve_topology=True)
    simplified = simplified.to_crs(WGS84)
    fc = json.loads(simplified.to_json())
    for feat in fc["features"]:
        props = feat.get("properties", {})
        feat["properties"] = {
            "geoid": props.get("geoid", ""),
            "name": props.get("name", ""),
            "classCode": props.get("classCode", "other"),
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
    pop: pd.DataFrame,
    county_names: dict[str, str],
    output_path: Path,
    label: str,
    cross_chamber_key: str,
    cross_chamber_data: dict[str, list[dict]],
) -> None:
    """Intersect districts with munis, aggregate stats, simplify, write GeoJSON."""
    log.info("building %s GeoJSON...", label)
    inter = intersect_districts_x_munis(districts, munis)
    stats = aggregate_district_stats(inter, pop, county_names)
    enriched = districts.merge(stats, on="district", how="left")
    enriched = simplify_for_web(enriched)
    write_geojson(
        enriched,
        output_path,
        name=f"pa_{label}_districts",
        cross_chamber_key=cross_chamber_key,
        cross_chamber_data=cross_chamber_data,
    )


def main(argv: Iterable[str]) -> int:
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
    log.info("loading ACS population...")
    pop = load_acs_population()

    sd_to_hd, hd_to_sd = compute_nesting(house, senate)

    build_chamber_geojson(
        house, munis, pop, county_names, OUTPUT_PATH,
        label="house",
        cross_chamber_key="parentSenateDistricts",
        cross_chamber_data=hd_to_sd,
    )
    build_chamber_geojson(
        senate, munis, pop, county_names, SENATE_OUTPUT_PATH,
        label="senate",
        cross_chamber_key="nestedHouseDistricts",
        cross_chamber_data=sd_to_hd,
    )
    write_counties_geojson(counties, COUNTIES_OUTPUT_PATH)
    write_munis_geojson(munis, MUNIS_OUTPUT_PATH)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
