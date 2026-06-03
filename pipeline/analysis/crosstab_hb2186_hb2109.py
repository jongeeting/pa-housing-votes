"""
Crosstab analysis: HB 2186 Final Passage (rc 1075, 6/1/26)
                vs HB 2109 2nd Consideration (rc 1083, 6/2/26)

Question: looking at the additional vote on a zoning matter, can we
infer anything about the range of R support? Which Rs look more solid?
Which ADU-Nay Rs flipped Yea on the occupancy bill? Mapping gettables.
"""

import json
from collections import defaultdict
from pathlib import Path

REPO = Path.home() / "projects/pa-housing-votes"

adu = json.load(open(REPO / "pipeline/data/rollcalls/2025-house-rc1075.json"))
gg = json.load(open(REPO / "pipeline/data/rollcalls/2025-house-rc1083.json"))


def by_district(rc):
    """Map district -> {name, party, vote}."""
    out = {}
    for m in rc["members"]:
        out[m["district"]] = {
            "name": m["displayName"],
            "party": m["party"],
            "vote": m["vote"],
        }
    return out


adu_by_d = by_district(adu)
gg_by_d = by_district(gg)

print("=" * 70)
print(f"HB 2186 Final Passage (6/1):  {adu['tallies']}")
print(f"HB 2109 2nd Cons      (6/2):  {gg['tallies']}")
print("=" * 70)

# Union of districts
all_dists = sorted(set(adu_by_d) | set(gg_by_d), key=lambda x: int(x))

# Build pairs
pairs = []
for d in all_dists:
    a = adu_by_d.get(d)
    g = gg_by_d.get(d)
    if not a or not g:
        # one is missing -- a member who only voted on one
        pairs.append((d, a, g))
        continue
    pairs.append((d, a, g))

# --- Categorize ---
both_yea = []
both_nay = []
adu_yea_gg_nay = []  # ADU Yea, GG Nay -- "ADU-only" Rs
adu_nay_gg_yea = []  # ADU Nay, GG Yea -- additional gettables
adu_nv_gg_yea = []   # Not voting on ADU but Yea on GG
adu_yea_gg_nv = []
other = []

R_yea_both = []
R_nay_to_yea = []  # the gettables we care about
R_yea_to_nay = []
R_nay_both = []
R_nv_to_yea = []
R_yea_to_nv = []
D_yea_to_nay = []
D_nay_both = []

for d, a, g in pairs:
    if not a or not g:
        other.append((d, a, g))
        continue
    av, gv = a["vote"], g["vote"]
    party = a["party"]
    name = a["name"]

    # Normalize votes
    def norm(v):
        v = (v or "").lower()
        if v in {"yea", "y", "yes"}: return "Y"
        if v in {"nay", "n", "no"}: return "N"
        return "X"  # not voting, missing, leave of absence, etc.
    av_n = norm(av)
    gv_n = norm(gv)

    if av_n == "Y" and gv_n == "Y":
        both_yea.append((d, name, party))
        if party == "R":
            R_yea_both.append((d, name))
    elif av_n == "N" and gv_n == "N":
        both_nay.append((d, name, party))
        if party == "R":
            R_nay_both.append((d, name))
    elif av_n == "Y" and gv_n == "N":
        adu_yea_gg_nay.append((d, name, party))
        if party == "R":
            R_yea_to_nay.append((d, name))
        else:
            D_yea_to_nay.append((d, name))
    elif av_n == "N" and gv_n == "Y":
        adu_nay_gg_yea.append((d, name, party))
        if party == "R":
            R_nay_to_yea.append((d, name))
    elif av_n == "X" and gv_n == "Y":
        adu_nv_gg_yea.append((d, name, party))
        if party == "R":
            R_nv_to_yea.append((d, name))
    elif av_n == "Y" and gv_n == "X":
        adu_yea_gg_nv.append((d, name, party))
        if party == "R":
            R_yea_to_nv.append((d, name))
    else:
        other.append((d, a, g))

print()
print(f"### TWO-BILL CROSSTAB ({len(pairs)} districts) ###")
print()
print(f"Yea on BOTH (rock-solid):           {len(both_yea):>3}  "
      f"(R={sum(1 for _,_,p in both_yea if p=='R'):>2}, "
      f"D={sum(1 for _,_,p in both_yea if p=='D'):>3})")
print(f"Nay on BOTH (rock-no):              {len(both_nay):>3}  "
      f"(R={sum(1 for _,_,p in both_nay if p=='R'):>2}, "
      f"D={sum(1 for _,_,p in both_nay if p=='D'):>3})")
print(f"ADU Nay -> GG Yea (extra gettable): {len(adu_nay_gg_yea):>3}  "
      f"(R={sum(1 for _,_,p in adu_nay_gg_yea if p=='R'):>2}, "
      f"D={sum(1 for _,_,p in adu_nay_gg_yea if p=='D'):>3})")
print(f"ADU Yea -> GG Nay (ADU-only):       {len(adu_yea_gg_nay):>3}  "
      f"(R={sum(1 for _,_,p in adu_yea_gg_nay if p=='R'):>2}, "
      f"D={sum(1 for _,_,p in adu_yea_gg_nay if p=='D'):>3})")
print(f"NV/Abs -> Yea:                      {len(adu_nv_gg_yea):>3}")
print(f"Yea -> NV/Abs:                      {len(adu_yea_gg_nv):>3}")
print(f"Other (mismatched roster):          {len(other):>3}")
print()

print("=" * 70)
print("R CAUCUS — VOTE COMBO")
print("=" * 70)
print()
print(f"Yea on both HB 2186 + HB 2109   (n={len(R_yea_both)})")
print("  These are the rock-solid R zoning reformers across both bills.")
for d, n in sorted(R_yea_both, key=lambda x: int(x[0])):
    print(f"  HD-{d:<4} {n}")
print()

print(f"Nay on HB 2186 → Yea on HB 2109  (n={len(R_nay_to_yea)})")
print("  Newly gettable. They balked on ADU outright but came around on")
print("  occupancy. Possible reads: (a) more comfortable with familial-")
print("  relationship reform than ADU yard impact, or (b) post-amendment")
print("  A03389 5-cap made the bill palatable.")
for d, n in sorted(R_nay_to_yea, key=lambda x: int(x[0])):
    print(f"  HD-{d:<4} {n}")
print()

if R_yea_to_nay:
    print(f"Yea on HB 2186 → Nay on HB 2109  (n={len(R_yea_to_nay)})")
    print("  ADU-friendly but occupancy-skeptical. Where the Yea-coalition")
    print("  on ADUs doesn't carry over.")
    for d, n in sorted(R_yea_to_nay, key=lambda x: int(x[0])):
        print(f"  HD-{d:<4} {n}")
    print()

if R_nv_to_yea:
    print(f"NV/Abs on HB 2186 → Yea on HB 2109  (n={len(R_nv_to_yea)})")
    print("  Came-off-the-bench gettables. New info about who's pro-zoning.")
    for d, n in sorted(R_nv_to_yea, key=lambda x: int(x[0])):
        print(f"  HD-{d:<4} {n}")
    print()

if R_yea_to_nv:
    print(f"Yea on HB 2186 → NV/Abs on HB 2109  (n={len(R_yea_to_nv)})")
    for d, n in sorted(R_yea_to_nv, key=lambda x: int(x[0])):
        print(f"  HD-{d:<4} {n}")
    print()

print(f"Nay on both (deep R Nos)  (n={len(R_nay_both)})")
print("  Will need a more focused argument or external pressure.")
# Don't dump all 51 names; just count + show districts as ranges
print(f"  Districts: {', '.join(d for d, _ in sorted(R_nay_both, key=lambda x: int(x[0])))}")
print()

print("=" * 70)
print("D CAUCUS — NOTABLE DEFECTIONS ON HB 2109")
print("=" * 70)
print()
if D_yea_to_nay:
    print(f"D Yea on HB 2186 → Nay on HB 2109  (n={len(D_yea_to_nay)})")
    print("  These are Dems whose zoning Yea on ADUs didn't carry to")
    print("  occupancy reform — should annotate why (almost certainly the")
    print("  A03389 5-cap amendment, which Inglis-the-ADU-sponsor cited.)")
    for d, n in sorted(D_yea_to_nay, key=lambda x: int(x[0])):
        print(f"  HD-{d:<4} {n}")
    print()

# Also: name the "reform-interested" 53 from the memo
# (Rs who voted Yea on HB 2186 Final Passage) and see how many
# voted Yea on HB 2109 too.
print("=" * 70)
print("\"REFORM-INTERESTED\" UNIVERSE — ADU YEA → HB 2109 BEHAVIOR")
print("=" * 70)
print()
adu_yea_R = [(d, n, "R") for d, n, p in both_yea + adu_yea_gg_nay + adu_yea_gg_nv if p == "R"]
gg_yea_R = [(d, n, "R") for d, n, p in both_yea + adu_nay_gg_yea + adu_nv_gg_yea if p == "R"]
print(f"R Yea on HB 2186 (final):            {len(adu_yea_R):>3}")
print(f"R Yea on HB 2109 (2nd cons):         {len(gg_yea_R):>3}")
print(f"Net delta:                            +{len(gg_yea_R)-len(adu_yea_R):>2}")
print()

# Are any HB2186 Yea Rs missing from HB2109 (Nay or NV)?
adu_yea_R_districts = {d for d, _, _ in adu_yea_R}
gg_yea_R_districts = {d for d, _, _ in gg_yea_R}
held = adu_yea_R_districts & gg_yea_R_districts
lost = adu_yea_R_districts - gg_yea_R_districts
new = gg_yea_R_districts - adu_yea_R_districts
print(f"Of the {len(adu_yea_R_districts)} \"reform-interested\" Rs on ADUs:")
print(f"  Held Yea on HB 2109:               {len(held)}")
print(f"  Slipped (Nay or NV) on HB 2109:    {len(lost)}")
print(f"Net-new Rs on HB 2109 not on ADU:    {len(new)}")
