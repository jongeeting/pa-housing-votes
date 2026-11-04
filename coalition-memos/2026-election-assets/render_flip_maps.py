"""Render PA House + Senate 2026 flip maps in BPN brand colors, with a
southeast-detail inset. Output PNGs land next to this script.

Run with the pipeline venv (has geopandas + matplotlib):
    pipeline/.venv/bin/python coalition-memos/2026-election-assets/render_flip_maps.py

Flip sets are the unofficial, morning-after (Nov 4 2026) results; update
them as races are called. District GeoJSON comes from public/data/.
"""
from pathlib import Path
import geopandas as gpd
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import matplotlib.patheffects as pe

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
DATA = REPO / "public" / "data"
OUT = HERE

BPN = {"green": "#00844D", "cream": "#EAE7E4", "dark": "#1a1a1a", "sienna": "#A0785A",
       "ochre": "#C99B2E", "stone": "#8B8178", "context": "#EFEDEA", "outline": "#B7B2AC"}

plt.rcParams.update({"figure.dpi": 200, "savefig.dpi": 200,
                     "font.family": ["DejaVu Sans"], "text.color": BPN["dark"]})

# --- flip definitions (unofficial as of Nov 4, 2026) ---
HOUSE_FLIP_RD = {"18", "44", "88", "137", "142", "160"}       # called R->D
HOUSE_UNCALLED = {"12", "13", "41", "131", "143", "147", "187"}  # still in play
SEN_FLIP_RD = {"6", "24"}        # called R->D
SEN_UNCALLED_RD = {"16", "40"}   # D leading, uncalled
SEN_FLIP_DR = {"36"}             # called D->R (loss)
STROKE = [pe.withStroke(linewidth=1.6, foreground=BPN["dark"])]


def load(fn):
    g = gpd.read_file(DATA / fn)
    g["district"] = g["district"].astype(str)
    g = g.to_crs("EPSG:3857")
    g["geometry"] = g.geometry.simplify(500, preserve_topology=True)
    return g


def labels(ax, g, dists, fs=7):
    for d in dists:
        r = g[g["district"] == d]
        if r.empty:
            continue
        c = r.geometry.iloc[0].representative_point()
        ax.annotate(d, (c.x, c.y), ha="center", va="center", fontsize=fs,
                    fontweight="bold", color="white", path_effects=STROKE)


def draw(ax, g, colfn, flips, lab=True, fs=7, lw=0.25):
    g = g.copy()
    g["c"] = g["district"].map(colfn)
    g.plot(ax=ax, color=g["c"], edgecolor=BPN["outline"], linewidth=lw)
    g[g["district"].isin(flips)].plot(ax=ax, color="none", edgecolor=BPN["dark"], linewidth=0.8)
    if lab:
        labels(ax, g, flips, fs)
    ax.set_axis_off()


def se_bounds(g, dists, pad=0.18):
    sub = g[g["district"].isin(dists)]
    minx, miny, maxx, maxy = sub.total_bounds
    dx, dy = (maxx - minx) * pad, (maxy - miny) * pad
    return minx - dx, miny - dy, maxx + dx, maxy + dy


def make(fn, colfn, flips, se_dists, legend, outname):
    g = load(fn)
    fig = plt.figure(figsize=(8, 5.2))
    ax = fig.add_axes([0.0, 0.08, 0.66, 0.9])
    draw(ax, g, colfn, flips, lab=False, lw=0.2)
    axi = fig.add_axes([0.60, 0.10, 0.40, 0.8])
    draw(axi, g, colfn, flips, lab=True, fs=8, lw=0.5)
    bx = se_bounds(g, se_dists)
    axi.set_xlim(bx[0], bx[2]); axi.set_ylim(bx[1], bx[3])
    axi.set_title("Southeast detail", fontsize=8.5, color=BPN["dark"], fontweight="bold", pad=2)
    for s in axi.spines.values():
        s.set_visible(True); s.set_edgecolor(BPN["outline"])
    ax.add_patch(plt.Rectangle((bx[0], bx[1]), bx[2] - bx[0], bx[3] - bx[1],
                 fill=False, edgecolor=BPN["dark"], linewidth=0.8, linestyle=(0, (3, 2))))
    leg = [mpatches.Patch(color=c, label=l) for c, l in legend]
    fig.legend(handles=leg, loc="lower center", ncol=len(legend), fontsize=7.6,
               frameon=False, handlelength=1.2, bbox_to_anchor=(0.5, 0.0))
    fig.savefig(OUT / outname, facecolor="white", bbox_inches="tight", dpi=200)
    plt.close(fig)
    print("wrote", OUT / outname)


def h_col(d):
    if d in HOUSE_FLIP_RD: return BPN["green"]
    if d in HOUSE_UNCALLED: return BPN["ochre"]
    return BPN["context"]


def s_col(d):
    if d in SEN_FLIP_RD: return BPN["green"]
    if d in SEN_UNCALLED_RD: return BPN["ochre"]
    if d in SEN_FLIP_DR: return BPN["sienna"]
    return BPN["context"]


if __name__ == "__main__":
    make("pa_house_districts.geojson", h_col, HOUSE_FLIP_RD,
         {"18", "137", "142", "160", "13", "131", "143", "147", "187"},
         [(BPN["green"], "Flipped R → D (6, called)"),
          (BPN["ochre"], "Uncalled / in play (7)"),
          (BPN["context"], "No change")],
         "map-house-flips.png")
    make("pa_senate_districts.geojson", s_col, SEN_FLIP_RD | SEN_UNCALLED_RD | SEN_FLIP_DR,
         {"6", "24", "16"},
         [(BPN["green"], "Flipped R → D (2, called)"),
          (BPN["ochre"], "D leading, uncalled (2)"),
          (BPN["sienna"], "D → R loss (SD-36)"),
          (BPN["context"], "No change / not up")],
         "map-senate-flips.png")
