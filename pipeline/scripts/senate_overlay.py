"""Overlay House vote/cosponsor data onto Senate districts.

For each PA Senate district, answers:
  - Which House members voted Yea/Nay on HB 2109 and HB 2186?
  - Which House members cosponsored those bills?
  - What share of the Senate district's population lives in
    pro-reform House districts?

This is an analytical tool for the blog post, not part of the
web app build pipeline.

Run:
    cd pipeline
    uv run python scripts/senate_overlay.py
"""

from __future__ import annotations

import json
import logging
import sys
import zipfile
from pathlib import Path

import geopandas as gpd
import pandas as pd

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("senate_overlay")

PIPELINE_DIR = Path(__file__).resolve().parents[1]
REPO_DIR = PIPELINE_DIR.parent
DATA_DIR = PIPELINE_DIR / "data"
RAW_DIR = DATA_DIR / "raw"
OUTPUT_DIR = PIPELINE_DIR / "analysis"

TIGER_BASE = "https://www2.census.gov/geo/tiger/TIGER2024"
SLDU_URL = f"{TIGER_BASE}/SLDU/tl_2024_42_sldu.zip"  # PA State Senate
SLDL_URL = f"{TIGER_BASE}/SLDL/tl_2024_42_sldl.zip"  # PA State House

EQUAL_AREA_CRS = "EPSG:5070"

# ---------------------------------------------------------------------------
# Vote + cosponsor data (hardcoded from the TS files)
# ---------------------------------------------------------------------------

# Committee votes: district -> vote
HB2186_VOTES: dict[str, str] = {
    # Democrats — all Yea
    "25": "Yea",   # Markosek
    "19": "Yea",   # Abney
    "163": "Yea",  # Boyd
    "10": "Yea",   # Brown
    "192": "Yea",  # Cephas
    "190": "Yea",  # Green
    "188": "Yea",  # Krajewski
    "104": "Yea",  # Madsen
    "24": "Yea",   # Mayes
    "21": "Yea",   # Powell
    "189": "Yea",  # Probst
    "49": "Yea",   # Smith-Wade-El
    "22": "Yea",   # Tiburcio
    "182": "Yea",  # Waxman
    # Republicans
    "81": "Yea",   # Irvin
    "63": "Yea",   # Bashline
    "98": "Nay",   # Jones
    "73": "Yea",   # Kephart
    "131": "Nay",  # Mackenzie
    "60": "Yea",   # Major
    "56": "Yea",   # Rasel
    "59": "Nay",   # Rossi
    "28": "Nay",   # Shaffer
    "123": "Nay",  # Twardzik
    "117": "Nay",  # Walsh
    "5": "Nay",    # Weaknecht
}

HB2109_VOTES: dict[str, str] = {
    **{k: v for k, v in HB2186_VOTES.items()},
    # Overrides for the two flippers:
    "56": "Nay",   # Rasel flipped
    "123": "Yea",  # Twardzik flipped
}

# Cosponsors: district -> (name, party)
HB2109_COSPONSORS: dict[str, tuple[str, str]] = {
    "194": ("Tarik Khan", "D"),           # prime sponsor
    "60":  ("Abby Major", "R"),
    "38":  ("John Inglis III", "D"),
    "190": ("G. Roni Green", "D"),
    "54":  ("Greg Scott", "D"),
    "103": ("Nathan Davidson", "D"),
    "202": ("Jared Solomon", "D"),
    "21":  ("Lindsay Powell", "D"),
    "49":  ("Ismail Smith-Wade-El", "D"),
    "96":  ("Nikki Rivera", "D"),
    "155": ("Danielle Friel Otten", "D"),
    "181": ("Malcolm Kenyatta", "D"),
    "152": ("Nancy Guenst", "D"),
    "182": ("Ben Waxman", "D"),
    "74":  ("Dan Williams", "D"),
    "95":  ("Carol Hill-Evans", "D"),
    "146": ("Joe Ciresi", "D"),
    "24":  ("La'Tasha Mayes", "D"),
    "153": ("Benjamin Sanchez", "D"),
    "129": ("Johanny Cepeda-Freytiz", "D"),
    "115": ("Maureen Madden", "D"),
    "195": ("Keith Harris", "D"),
    "31":  ("Perry Warren", "D"),
    "164": ("Gina Curry", "D"),
}

HB2186_COSPONSORS: dict[str, tuple[str, str]] = {
    "38":  ("John Inglis III", "D"),      # prime sponsor
    "194": ("Tarik Khan", "D"),
    "54":  ("Greg Scott", "D"),
    "103": ("Nathan Davidson", "D"),
    "202": ("Jared Solomon", "D"),
    "99":  ("David Zimmerman", "R"),
    "49":  ("Ismail Smith-Wade-El", "D"),
    "21":  ("Lindsay Powell", "D"),
    "136": ("Robert Freeman", "D"),
    "61":  ("Liz Hanbidge", "D"),
    "155": ("Danielle Friel Otten", "D"),
    "182": ("Ben Waxman", "D"),
    "74":  ("Dan Williams", "D"),
    "146": ("Joe Ciresi", "D"),
    "24":  ("La'Tasha Mayes", "D"),
    "129": ("Johanny Cepeda-Freytiz", "D"),
    "115": ("Maureen Madden", "D"),
    "195": ("Keith Harris", "D"),
    "164": ("Gina Curry", "D"),
    "42":  ("Jen Mazzocco", "D"),
    "142": ("Joe Hogan", "R"),
}

# Member info for committee members (for display)
COMMITTEE_MEMBERS: dict[str, tuple[str, str]] = {
    "25": ("Brandon Markosek", "D"),
    "19": ("Aerion Abney", "D"),
    "163": ("Heather Boyd", "D"),
    "10": ("Amen Brown", "D"),
    "192": ("Morgan Cephas", "D"),
    "190": ("G. Roni Green", "D"),
    "188": ("Rick Krajewski", "D"),
    "104": ("Dave Madsen", "D"),
    "24": ("La'Tasha Mayes", "D"),
    "21": ("Lindsay Powell", "D"),
    "189": ("Tarah Probst", "D"),
    "49": ("Ismail Smith-Wade-El", "D"),
    "22": ("Ana Tiburcio", "D"),
    "182": ("Ben Waxman", "D"),
    "81": ("Rich Irvin", "R"),
    "63": ("Josh Bashline", "R"),
    "98": ("Tom Jones", "R"),
    "73": ("Dallas Kephart", "R"),
    "131": ("Milou Mackenzie", "R"),
    "60": ("Abby Major", "R"),
    "56": ("Brian Rasel", "R"),
    "59": ("Leslie Rossi", "R"),
    "28": ("Jeremy Shaffer", "R"),
    "123": ("Tim Twardzik", "R"),
    "117": ("Jamie Walsh", "R"),
    "5": ("Eric Weaknecht", "R"),
}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def download(url: str, dest: Path) -> Path:
    import requests
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
        return gpd.read_file(f"zip://{zip_path}!{shp_name}")


# ---------------------------------------------------------------------------
# Analysis
# ---------------------------------------------------------------------------

def get_support_level(district: str) -> dict:
    """Classify a House district's support level across both bills."""
    info: dict = {"district": district}

    # Get member name/party
    if district in COMMITTEE_MEMBERS:
        info["name"], info["party"] = COMMITTEE_MEMBERS[district]
    elif district in HB2109_COSPONSORS:
        info["name"], info["party"] = HB2109_COSPONSORS[district]
    elif district in HB2186_COSPONSORS:
        info["name"], info["party"] = HB2186_COSPONSORS[district]
    else:
        info["name"] = None
        info["party"] = None

    # Votes
    info["hb2186_vote"] = HB2186_VOTES.get(district)
    info["hb2109_vote"] = HB2109_VOTES.get(district)

    # Cosponsorship
    info["hb2186_cosponsor"] = district in HB2186_COSPONSORS
    info["hb2109_cosponsor"] = district in HB2109_COSPONSORS

    # Overall support classification
    voted_yea_any = info["hb2186_vote"] == "Yea" or info["hb2109_vote"] == "Yea"
    cosponsor_any = info["hb2186_cosponsor"] or info["hb2109_cosponsor"]
    voted_nay_all = (
        info["hb2186_vote"] == "Nay" and info["hb2109_vote"] == "Nay"
    )

    if voted_yea_any:
        info["support"] = "voted_yea"
    elif cosponsor_any:
        info["support"] = "cosponsor"
    elif voted_nay_all:
        info["support"] = "voted_nay"
    elif info["hb2186_vote"] or info["hb2109_vote"]:
        info["support"] = "mixed"  # voted on one but not the other
    else:
        info["support"] = "none"

    return info


def main() -> int:
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Load shapefiles
    log.info("Loading Senate districts...")
    sldu_zip = download(SLDU_URL, RAW_DIR / "tl_2024_42_sldu.zip")
    senate = read_zipped_shapefile(sldu_zip).to_crs(EQUAL_AREA_CRS)
    senate["senate_district"] = senate["SLDUST"].str.lstrip("0")

    log.info("Loading House districts...")
    sldl_zip = download(SLDL_URL, RAW_DIR / "tl_2024_42_sldl.zip")
    house = read_zipped_shapefile(sldl_zip).to_crs(EQUAL_AREA_CRS)
    house["house_district"] = house["SLDLST"].str.lstrip("0")
    house["house_area"] = house.geometry.area

    # Spatial overlay: which House districts overlap which Senate districts?
    log.info("Computing House x Senate spatial overlay...")
    overlay = gpd.overlay(
        house[["house_district", "house_area", "geometry"]],
        senate[["senate_district", "geometry"]],
        how="intersection",
        keep_geom_type=True,
    )
    overlay["intersection_area"] = overlay.geometry.area
    # A House district's "primary" Senate district = the one with the
    # largest area overlap. (Most House districts are entirely within one
    # Senate district, but a few straddle two.)
    overlay["area_share"] = overlay["intersection_area"] / overlay["house_area"]

    # For each House district, pick the Senate district with the largest overlap
    primary = (
        overlay.sort_values("area_share", ascending=False)
        .drop_duplicates("house_district", keep="first")
        [["house_district", "senate_district", "area_share"]]
    )

    # Enrich with support data
    support_data = []
    for _, row in primary.iterrows():
        info = get_support_level(row["house_district"])
        info["senate_district"] = row["senate_district"]
        info["overlap_share"] = round(row["area_share"], 3)
        support_data.append(info)

    df = pd.DataFrame(support_data)

    # --- Summary by Senate district ---
    print("\n" + "=" * 80)
    print("SENATE DISTRICT OVERLAY — HOUSE ZONING REFORM SUPPORT")
    print("=" * 80)

    for sd in sorted(df["senate_district"].unique(), key=int):
        sub = df[df["senate_district"] == sd].copy()

        yea_voters = sub[sub["support"] == "voted_yea"]
        cosponsors_only = sub[(sub["support"] == "cosponsor")]
        nay_voters = sub[sub["support"].isin(["voted_nay", "mixed"])]
        total_house = len(sub)
        supportive = len(yea_voters) + len(cosponsors_only)

        if supportive == 0:
            continue  # Skip Senate districts with no reform support

        print(f"\n{'─' * 70}")
        print(f"SENATE DISTRICT {sd}  ({supportive} of {total_house} House districts supportive)")
        print(f"{'─' * 70}")

        if len(yea_voters) > 0:
            print(f"  Voted Yea ({len(yea_voters)}):")
            for _, r in yea_voters.sort_values("district").iterrows():
                votes = []
                if r["hb2186_vote"] == "Yea": votes.append("HB2186")
                if r["hb2109_vote"] == "Yea": votes.append("HB2109")
                cs = ""
                if r["hb2186_cosponsor"] or r["hb2109_cosponsor"]:
                    cs_bills = []
                    if r["hb2186_cosponsor"]: cs_bills.append("2186")
                    if r["hb2109_cosponsor"]: cs_bills.append("2109")
                    cs = f" [also cosponsor: HB {', '.join(cs_bills)}]"
                print(f"    HD-{r['district']:>3s}  {r['party']}  {r['name']:<30s}  Yea on {', '.join(votes)}{cs}")

        if len(cosponsors_only) > 0:
            print(f"  Cosponsors only ({len(cosponsors_only)}):")
            for _, r in cosponsors_only.sort_values("district").iterrows():
                cs_bills = []
                if r["hb2186_cosponsor"]: cs_bills.append("2186")
                if r["hb2109_cosponsor"]: cs_bills.append("2109")
                print(f"    HD-{r['district']:>3s}  {r['party']}  {r['name']:<30s}  Cosponsor: HB {', '.join(cs_bills)}")

        if len(nay_voters) > 0:
            print(f"  Voted Nay / mixed ({len(nay_voters)}):")
            for _, r in nay_voters.sort_values("district").iterrows():
                v2186 = r.get("hb2186_vote", "—") or "—"
                v2109 = r.get("hb2109_vote", "—") or "—"
                print(f"    HD-{r['district']:>3s}  {r['party']}  {r['name']:<30s}  HB2186:{v2186} HB2109:{v2109}")

    # --- Summary table ---
    print(f"\n\n{'=' * 80}")
    print("SUMMARY: SENATE DISTRICTS RANKED BY REFORM SUPPORT")
    print(f"{'=' * 80}")
    print(f"{'SD':>4s}  {'Yea':>4s}  {'CoSp':>4s}  {'Nay':>4s}  {'None':>4s}  {'Total':>5s}  {'Support%':>8s}")
    print(f"{'─' * 4}  {'─' * 4}  {'─' * 4}  {'─' * 4}  {'─' * 4}  {'─' * 5}  {'─' * 8}")

    summary_rows = []
    for sd in sorted(df["senate_district"].unique(), key=int):
        sub = df[df["senate_district"] == sd]
        n_yea = len(sub[sub["support"] == "voted_yea"])
        n_cosp = len(sub[sub["support"] == "cosponsor"])
        n_nay = len(sub[sub["support"].isin(["voted_nay", "mixed"])])
        n_none = len(sub[sub["support"] == "none"])
        total = len(sub)
        pct = (n_yea + n_cosp) / total * 100 if total else 0
        summary_rows.append((sd, n_yea, n_cosp, n_nay, n_none, total, pct))

    for sd, n_yea, n_cosp, n_nay, n_none, total, pct in sorted(
        summary_rows, key=lambda x: -x[6]
    ):
        if n_yea + n_cosp == 0:
            continue
        print(f"  {sd:>3s}  {n_yea:>4d}  {n_cosp:>4d}  {n_nay:>4d}  {n_none:>4d}  {total:>5d}  {pct:>7.0f}%")

    # Save detailed CSV
    csv_path = OUTPUT_DIR / "senate_overlay.csv"
    df.to_csv(csv_path, index=False)
    log.info("Wrote %s", csv_path)

    return 0


if __name__ == "__main__":
    sys.exit(main())
