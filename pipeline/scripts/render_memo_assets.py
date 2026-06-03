"""Render the static maps + charts that accompany the HB 2186 coalition
memo at /coalition/hb2186-memo. Output PNGs land in
public/coalition-memos/hb2186-assets/.

Idempotent: re-run any time the underlying vote / district data changes
and the PNGs regenerate. Astro picks them up via the build-id cache-
buster on the memo page.

Style: clean institutional. White background, muted color palette,
no decorative chrome. Designed to print well at 100% on letter paper.
"""

from __future__ import annotations

import json
from pathlib import Path

import geopandas as gpd
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import pandas as pd

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
REPO_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = REPO_ROOT / "public" / "data"
RC_DIR = REPO_ROOT / "pipeline" / "data" / "rollcalls"
OUT_DIR = REPO_ROOT / "public" / "coalition-memos" / "hb2186-assets"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# Style
# ---------------------------------------------------------------------------
COLORS = {
    "yea": "#4d8d6f",          # muted green — Yea / supportive
    "nay": "#c97b54",          # muted terracotta — Nay
    "muted": "#e6e7ea",        # neutral gray for context districts
    "flip_to_yea": "#2f6e98",  # cool blue — came around
    "flip_to_nay": "#a8a29e",  # warm gray — defected
    "stayed_yea": "#4d8d6f",
    "target": "#d4a017",       # amber — explicit targets
    "peer": "#9ec5b0",          # lighter green — peer reference
    "outline": "#3f3f46",       # district outline
    "outline_thin": "#9ca3af",
    "page_fg": "#1f2937",
}

plt.rcParams.update({
    "figure.dpi": 150,
    "savefig.dpi": 150,
    "savefig.bbox": "tight",
    "savefig.facecolor": "white",
    "font.family": ["Charter", "Iowan Old Style", "Georgia", "serif"],
    "font.size": 10,
    "axes.titlesize": 12,
    "axes.titleweight": "bold",
    "axes.labelsize": 9,
    "axes.edgecolor": COLORS["outline"],
    "axes.titlecolor": COLORS["page_fg"],
    "text.color": COLORS["page_fg"],
    "xtick.color": COLORS["page_fg"],
    "ytick.color": COLORS["page_fg"],
})

# ---------------------------------------------------------------------------
# Data
# ---------------------------------------------------------------------------
def _load_votes(path: Path) -> dict[str, dict]:
    return {m["district"]: m for m in json.load(path.open())["members"]}

rc54 = _load_votes(RC_DIR / "2025-house-rc1054.json")
rc75 = _load_votes(RC_DIR / "2025-house-rc1075.json")

# House districts geojson — simplify a bit for static export
hd = gpd.read_file(DATA_DIR / "pa_house_districts.geojson")
hd["district"] = hd["district"].astype(str)
# Use a PA-friendly projection (NAD83 / Pennsylvania North-South works well; EPSG:3857 is fine for shape only)
hd = hd.to_crs("EPSG:3857")
# Light simplification for cleaner static rendering
hd["geometry"] = hd.geometry.simplify(800, preserve_topology=True)


def _v(d, source):
    return source.get(d, {}).get("vote")

# Build vote-state columns we'll use repeatedly
hd["rc54"] = hd["district"].map(lambda d: _v(d, rc54))
hd["rc75"] = hd["district"].map(lambda d: _v(d, rc75))
hd["party"] = hd["district"].map(lambda d: rc75.get(d, {}).get("party"))

def categorize(row):
    o, n = row["rc54"], row["rc75"]
    if o == "Yea" and n == "Yea":
        return "stayed_yea"
    if o == "Nay" and n == "Yea":
        return "flip_to_yea"
    if o == "Yea" and n == "Nay":
        return "flip_to_nay"
    if o == "Nay" and n == "Nay":
        return "stayed_nay"
    return "missing"

hd["category"] = hd.apply(categorize, axis=1)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _base_ax(fig_w=8, fig_h=5.5):
    fig, ax = plt.subplots(figsize=(fig_w, fig_h))
    ax.set_axis_off()
    return fig, ax

def _label(ax, title: str, subtitle: str | None = None):
    """Render title (and optional subtitle) above the map. Subtitle is
    placed between the map and the legend area below."""
    ax.set_title(title, loc="left", pad=8, fontsize=13)
    if subtitle:
        # Subtitle sits just below the axes, ABOVE where _legend_below
        # will place the legend.
        ax.text(0, -0.04, subtitle, transform=ax.transAxes,
                fontsize=9, color="#52525b", va="top", ha="left")

def _legend(ax, entries: list[tuple[str, str]], loc="lower right"):
    """entries = [(color, label), ...]. Legacy in-axes legend."""
    handles = [mpatches.Patch(color=c, label=l, ec=COLORS["outline_thin"], lw=0.4)
               for c, l in entries]
    ax.legend(handles=handles, loc=loc, fontsize=8, frameon=True,
              framealpha=0.92, edgecolor=COLORS["outline_thin"])

def _legend_below(ax, entries: list[tuple[str, str]], ncol: int | None = None):
    """Horizontal legend placed below the map, so it never overlaps PA
    geography. `ncol` defaults to len(entries) — one row across."""
    handles = [mpatches.Patch(color=c, label=l, ec=COLORS["outline_thin"], lw=0.4)
               for c, l in entries]
    if ncol is None:
        ncol = len(entries)
    ax.legend(
        handles=handles,
        loc="upper center",
        bbox_to_anchor=(0.5, -0.10),
        ncol=ncol,
        fontsize=8,
        frameon=False,
        handlelength=1.4,
        handleheight=0.9,
        columnspacing=1.6,
    )

# ---------------------------------------------------------------------------
# MAP 1: Final Passage choropleth
# ---------------------------------------------------------------------------
def map_final_passage():
    fig, ax = _base_ax()
    color_map = hd["rc75"].map({"Yea": COLORS["yea"], "Nay": COLORS["nay"]}).fillna(COLORS["muted"])
    hd.plot(ax=ax, color=color_map, edgecolor=COLORS["outline_thin"], linewidth=0.25)
    _label(
        ax,
        "HB 2186 Final Passage — House votes by district",
        f"June 1, 2026 · 139 Yea / 62 Nay (Roll Call 1075) · "
        f"{(hd['rc75']=='Yea').sum()} green, {(hd['rc75']=='Nay').sum()} terracotta",
    )
    _legend_below(ax, [(COLORS["yea"], "Yea"), (COLORS["nay"], "Nay"),
                       (COLORS["muted"], "No record")])
    fig.savefig(OUT_DIR / "map-final-passage.png")
    plt.close(fig)
    print(f"  wrote {OUT_DIR/'map-final-passage.png'}")

# ---------------------------------------------------------------------------
# MAP 2: Vote-change between rc 1054 and rc 1075
# ---------------------------------------------------------------------------
def map_vote_change():
    fig, ax = _base_ax()
    cat_colors = {
        "stayed_yea": "#cfe1d6",   # very light green — stayed Yea (context)
        "stayed_nay": "#efd9cb",   # very light terracotta — stayed Nay (context)
        "flip_to_yea": COLORS["flip_to_yea"],
        "flip_to_nay": COLORS["flip_to_nay"],
        "missing": COLORS["muted"],
    }
    color_map = hd["category"].map(cat_colors)
    hd.plot(ax=ax, color=color_map, edgecolor=COLORS["outline_thin"], linewidth=0.25)
    n_to_yea = (hd["category"] == "flip_to_yea").sum()
    n_to_nay = (hd["category"] == "flip_to_nay").sum()
    _label(
        ax,
        "Vote shifts between 2nd Consideration and Final Passage",
        f"21 districts moved Nay → Yea; 16 moved Yea → Nay. Net +5 Yea on Final Passage.",
    )
    _legend_below(ax, [
        (COLORS["flip_to_yea"], "Nay → Yea (came around)"),
        (COLORS["flip_to_nay"], "Yea → Nay (defected on PN 3373)"),
        ("#cfe1d6", "Stayed Yea"),
        ("#efd9cb", "Stayed Nay"),
    ], ncol=2)
    fig.savefig(OUT_DIR / "map-vote-change.png")
    plt.close(fig)
    print(f"  wrote {OUT_DIR/'map-vote-change.png'}")

# ---------------------------------------------------------------------------
# MAP 3: 53-member reform-interested R universe
# ---------------------------------------------------------------------------
def map_reform_interested():
    fig, ax = _base_ax()
    def class_for(row):
        if row["party"] != "R":
            return "other"
        # R who voted Yea on rc1075
        if row["rc75"] == "Yea":
            return "stayed"  # held Yea through Final Passage
        # R who voted Yea on rc1054 but Nay on rc1075
        if row["rc54"] == "Yea" and row["rc75"] == "Nay":
            return "switched"
        return "other"
    hd["ri_class"] = hd.apply(class_for, axis=1)
    color_map = hd["ri_class"].map({
        "stayed": COLORS["yea"],
        "switched": "#a6c5a4",  # lighter green — also reform-interested but switched
        "other": COLORS["muted"],
    })
    hd.plot(ax=ax, color=color_map, edgecolor=COLORS["outline_thin"], linewidth=0.25)
    stayed = (hd["ri_class"] == "stayed").sum()
    switched = (hd["ri_class"] == "switched").sum()
    _label(
        ax,
        "Reform-interested House Republicans (53 members)",
        f"{stayed} held Yea on Final Passage; {switched} voted Yea on 2nd Consideration only.",
    )
    _legend_below(ax, [
        (COLORS["yea"], f"Yea on Final Passage ({stayed})"),
        ("#a6c5a4", f"Yea on 2nd Consideration only ({switched})"),
        (COLORS["muted"], "Other districts"),
    ])
    fig.savefig(OUT_DIR / "map-reform-interested.png")
    plt.close(fig)
    print(f"  wrote {OUT_DIR/'map-reform-interested.png'}")

# ---------------------------------------------------------------------------
# MAP 4: Northern Tier targets + came-around peers
# ---------------------------------------------------------------------------
NT_TARGETS = {"110", "68", "84", "108", "17", "4"}  # Pickett, Owlett, Hamm, Stender, Bonner, Banta
# Came-around peers from § 5 (rural/Western/Central PA Rs who flipped N→Y)
PEER_DISTRICTS = {"15", "71", "63", "73", "75", "76", "109", "9", "102",
                  "7", "171", "86", "85", "65"}  # 14 districts

def map_northern_tier():
    fig, ax = _base_ax()
    def class_for(d):
        if d in NT_TARGETS:
            return "target"
        if d in PEER_DISTRICTS:
            return "peer"
        return "other"
    hd["nt_class"] = hd["district"].map(class_for)
    color_map = hd["nt_class"].map({
        "target": COLORS["target"],
        "peer": COLORS["peer"],
        "other": COLORS["muted"],
    })
    hd.plot(ax=ax, color=color_map, edgecolor=COLORS["outline_thin"], linewidth=0.25)
    _label(
        ax,
        "Northern Tier expansion target districts (6) + rural R peers who came around (14)",
        "Demographic profile of NT targets matches that of the 14 came-around peers between rc 1054 and rc 1075.",
    )
    _legend_below(ax, [
        (COLORS["target"], "Target district (R Nay both votes)"),
        (COLORS["peer"], "Peer district (R Nay → Yea between votes)"),
        (COLORS["muted"], "Other districts"),
    ])
    fig.savefig(OUT_DIR / "map-northern-tier.png")
    plt.close(fig)
    print(f"  wrote {OUT_DIR/'map-northern-tier.png'}")

# ---------------------------------------------------------------------------
# CHART 1: Final Passage caucus breakdown
# ---------------------------------------------------------------------------
def chart_caucus():
    fig, ax = plt.subplots(figsize=(8, 2.0))
    data = [
        ("Democrats (102)", 101, 1),
        ("Republicans (99)", 38, 61),
    ]
    for i, (label, yea, nay) in enumerate(data):
        total = yea + nay
        ax.barh(i, yea, color=COLORS["yea"], edgecolor="white", linewidth=0.8)
        ax.barh(i, nay, left=yea, color=COLORS["nay"], edgecolor="white", linewidth=0.8)
        # Centered text inside each segment, except short ones
        if yea >= 5:
            ax.text(yea / 2, i, f"{yea} Yea", va="center", ha="center",
                    color="white", fontsize=10, weight="bold")
        if nay >= 5:
            ax.text(yea + nay / 2, i, f"{nay} Nay", va="center", ha="center",
                    color="white", fontsize=10, weight="bold")
        # If one side is small (D Nay = 1), put text outside
        if nay < 5:
            ax.text(yea + nay + 1.5, i, f"{nay} Nay", va="center", ha="left",
                    color=COLORS["page_fg"], fontsize=9)
    ax.set_yticks(range(len(data)))
    ax.set_yticklabels([d[0] for d in data], fontsize=10)
    ax.invert_yaxis()
    ax.set_xlim(0, 105)
    ax.set_xlabel("Members", fontsize=9)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.spines["left"].set_visible(False)
    ax.set_title("Final Passage caucus breakdown — 139 Yea / 62 Nay",
                 loc="left", fontsize=12, pad=10)
    fig.savefig(OUT_DIR / "chart-caucus.png")
    plt.close(fig)
    print(f"  wrote {OUT_DIR/'chart-caucus.png'}")

# ---------------------------------------------------------------------------
# CHART 2: Muni-class composition (Yea vs Nay coalitions)
# ---------------------------------------------------------------------------
def chart_muni_class():
    # Average share of district population by muni class, for Yea vs Nay
    classes = [
        ("first_class_city", "1st-class city (Philly)", "#7f53a3"),
        ("second_class_city", "2nd-class city (Pittsburgh)", "#b07cd2"),
        ("second_class_a_city", "2A city", "#cba2e5"),
        ("third_class_city", "3rd-class city", "#5b9bd5"),
        ("borough", "Borough", "#7eb695"),
        ("first_class_township", "1st-class township", "#e8c25c"),
        ("second_class_township", "2nd-class township", "#d97f4c"),
        ("town", "Town", "#a87d4b"),
    ]
    # Recompute averages from the district geojson
    raw = json.load((DATA_DIR / "pa_house_districts.geojson").open())
    members_yea = [f["properties"] for f in raw["features"]
                   if rc75.get(f["properties"]["district"], {}).get("vote") == "Yea"]
    members_nay = [f["properties"] for f in raw["features"]
                   if rc75.get(f["properties"]["district"], {}).get("vote") == "Nay"]
    def avg(members):
        sums = {c[0]: 0.0 for c in classes}
        for m in members:
            cs = m.get("classShares", {})
            if isinstance(cs, str):
                cs = json.loads(cs)
            for k, v in cs.items():
                if k in sums:
                    sums[k] += v
        return {k: v / max(len(members), 1) for k, v in sums.items()}
    yea_avg = avg(members_yea)
    nay_avg = avg(members_nay)

    fig, ax = plt.subplots(figsize=(8, 2.5))
    yea_x = 0; nay_x = 0
    for key, label, color in classes:
        y = yea_avg[key] * 100
        n = nay_avg[key] * 100
        ax.barh(0, y, left=yea_x, color=color, edgecolor="white", linewidth=0.8, label=label)
        ax.barh(1, n, left=nay_x, color=color, edgecolor="white", linewidth=0.8)
        # Add value labels inside larger segments
        if y > 7:
            ax.text(yea_x + y / 2, 0, f"{y:.0f}%", va="center", ha="center",
                    fontsize=8, color="white", weight="bold")
        if n > 7:
            ax.text(nay_x + n / 2, 1, f"{n:.0f}%", va="center", ha="center",
                    fontsize=8, color="white", weight="bold")
        yea_x += y
        nay_x += n
    ax.set_yticks([0, 1])
    ax.set_yticklabels(["Yea districts (n=139)", "Nay districts (n=62)"], fontsize=10)
    ax.invert_yaxis()
    ax.set_xlim(0, 100)
    ax.set_xlabel("Avg share of district population (%)", fontsize=9)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.spines["left"].set_visible(False)
    ax.set_title("Muni-class composition of the Yea and Nay coalitions",
                 loc="left", fontsize=12, pad=10)
    ax.legend(loc="lower center", bbox_to_anchor=(0.5, -0.55), ncol=4, fontsize=8,
              frameon=False, columnspacing=1.2)
    fig.savefig(OUT_DIR / "chart-muni-class.png")
    plt.close(fig)
    print(f"  wrote {OUT_DIR/'chart-muni-class.png'}")

# ---------------------------------------------------------------------------
# CHART 3: R Yea rate by 2nd-class township share band
# ---------------------------------------------------------------------------
def chart_twp_buckets():
    # Re-bucket Republicans by 2nd-class township share of district pop
    raw = json.load((DATA_DIR / "pa_house_districts.geojson").open())
    members_r = []
    for f in raw["features"]:
        p = f["properties"]
        d = p["district"]
        if rc75.get(d, {}).get("party") != "R":
            continue
        cs = p.get("classShares", {})
        if isinstance(cs, str):
            cs = json.loads(cs)
        twp = cs.get("second_class_township", 0)
        members_r.append((d, twp, rc75[d]["vote"]))
    buckets = [(0, 0.25, "0 – 25%"), (0.25, 0.50, "25 – 50%"),
               (0.50, 0.75, "50 – 75%"), (0.75, 1.01, "75 – 100%")]
    counts = []
    for lo, hi, label in buckets:
        in_band = [m for m in members_r if lo <= m[1] < hi]
        y = sum(1 for m in in_band if m[2] == "Yea")
        n = sum(1 for m in in_band if m[2] == "Nay")
        counts.append((label, y, n, len(in_band)))

    fig, ax = plt.subplots(figsize=(8, 3.5))
    labels = [c[0] for c in counts]
    yea_rates = [c[1] / c[3] * 100 if c[3] else 0 for c in counts]
    bars = ax.bar(labels, yea_rates, color=COLORS["yea"], edgecolor="white", linewidth=0.8)
    # Republican baseline line
    ax.axhline(38, color=COLORS["nay"], linestyle="--", linewidth=1.2, alpha=0.7)
    ax.text(3.4, 39, "R caucus baseline (38%)", color=COLORS["nay"], fontsize=8,
            ha="right", va="bottom")
    # Bar labels
    for bar, c in zip(bars, counts):
        h = bar.get_height()
        ax.text(bar.get_x() + bar.get_width() / 2, h + 1.5,
                f"{c[1]}/{c[3]}\n{h:.0f}%",
                ha="center", va="bottom", fontsize=9)
    ax.set_ylim(0, 60)
    ax.set_ylabel("Republican Yea rate (%)", fontsize=9)
    ax.set_xlabel("Share of district population in 2nd-class townships", fontsize=9)
    ax.set_title("Republican Yea rate on HB 2186 Final Passage, by 2nd-class township share",
                 loc="left", fontsize=12, pad=10)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    fig.savefig(OUT_DIR / "chart-twp-buckets.png")
    plt.close(fig)
    print(f"  wrote {OUT_DIR/'chart-twp-buckets.png'}")

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    print(f"Rendering memo assets to {OUT_DIR}")
    map_final_passage()
    map_vote_change()
    map_reform_interested()
    map_northern_tier()
    chart_caucus()
    chart_muni_class()
    chart_twp_buckets()
    print("done.")

if __name__ == "__main__":
    main()
