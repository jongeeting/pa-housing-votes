"""Generate TS content for committee-vote RollCall objects.

Reads the fetched committee JSONs and emits a votes[] array literal
plus tallies. The rest of the RollCall object (id, stage, sourceUrl,
etc.) is written by hand because it varies per action.

Usage:
    uv run python scripts/generate_committee_ts.py \\
        pipeline/data/rollcalls/2025-senate-cmte35-rc759.json
"""

from __future__ import annotations

import json
import sys
from pathlib import Path


def emit_votes(members: list[dict], chamber: str, session: str = "2025") -> str:
    prefix = f"{chamber.lower()}-{session}"
    parties = {"D": [], "R": [], "I": []}
    for m in members:
        parties.setdefault(m.get("party") or "?", []).append(m)
    for arr in parties.values():
        arr.sort(key=lambda m: (m.get("lastName") or "").lower())

    lines: list[str] = []
    for party in ("D", "R", "I"):
        if party not in parties or not parties[party]:
            continue
        yea = sum(1 for m in parties[party] if m["vote"] == "Yea")
        nay = sum(1 for m in parties[party] if m["vote"] == "Nay")
        label = {"D": "Democrats", "R": "Republicans", "I": "Independents"}[party]
        lines.append(f"    // {label} — {yea} Yea, {nay} Nay")
        for m in parties[party]:
            lines.append(
                f'    {{ memberId: "{prefix}-{m["slug"]}", vote: "{m["vote"]}" }},'
            )
        lines.append("")
    return "\n".join(lines).rstrip()


def main() -> int:
    if len(sys.argv) < 2:
        print("usage: generate_committee_ts.py <rollcall.json>", file=sys.stderr)
        return 2
    for path in sys.argv[1:]:
        data = json.load(open(path))
        bill = data.get("bill") or {}
        chamber = data["chamber"]
        t = data["tallies"]
        print(f"// === {Path(path).name} : {bill.get('id','?')}  {t['yea']}-{t['nay']} ===")
        print(emit_votes(data["members"], chamber))
        print()
    return 0


if __name__ == "__main__":
    sys.exit(main())
