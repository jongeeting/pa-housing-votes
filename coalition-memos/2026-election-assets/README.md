# 2026 election — housing impact brief (BPN PDF) assets

Source files for `coalition-memos/BPN-PA-2026-election-housing-impact.pdf`,
a branded Build Philly Now memo on how the Nov 3, 2026 general election
changed Pennsylvania's housing-reform vote math.

> **Preliminary.** The flip sets and seat counts are the unofficial,
> morning-after (Nov 4, 2026) results. Update as races are called and
> re-verify against certified PA Dept. of State returns before publishing.

## Files
- `memo.html` — the layout/content (BPN brand tokens, 4 letter pages).
- `render_flip_maps.py` — renders the House + Senate flip maps from
  `public/data/pa_{house,senate}_districts.geojson` in BPN colors.
- `build_pdf.py` — stages brand fonts/logos + maps and prints the PDF.
- `map-house-flips.png`, `map-senate-flips.png` — rendered maps.

## Rebuild
```bash
# 1. maps (needs geopandas + matplotlib — use the pipeline venv)
pipeline/.venv/bin/python coalition-memos/2026-election-assets/render_flip_maps.py

# 2. PDF (needs WeasyPrint — embeds images as ICC-free DeviceRGB so they
#    render in lightweight/inline PDF viewers)
/opt/homebrew/bin/python3.14 coalition-memos/2026-election-assets/build_pdf.py
```

Brand fonts (Brother 1816, Plus Jakarta Sans) and logos are pulled at
build time from the `bpn-social-graphics` skill
(`~/.claude/skills/bpn-social-graphics/assets/`), so they are not
vendored here.

## Data provenance
- Flips / seat counts: unofficial results (MultiState, Spotlight PA,
  Inquirer, WHYY, Daily Voice, PublicSource) — see the memo's source line.
- Loser vote records: House roll calls rc 1075 (HB 2186 Final) and
  rc 1119 (HB 2109 Final) in `pipeline/data/rollcalls/`.
- Committee rosters: `committee-assignments-2025.csv`.
- Senate Dem committee chairs + leadership: pasenate.com / pahouse.com
  (2025–26 session).
