# pa-housing-votes

Interactive map showing how every member of the PA House Housing &
Urban Affairs committee voted on state zoning reform bills, alongside
each district's partisan and municipal composition.

Built for a blog post by the [PA Housing Choices Coalition](https://example.com),
designed to grow into a long-running bill / cosponsorship / vote tracker.

## Stack

- **Frontend**: [Astro 5](https://astro.build/) + React 18 islands +
  [MapLibre GL JS](https://maplibre.org/) (vector basemap from CARTO,
  GeoJSON district overlay).
- **Pipeline**: Python 3.11 + GeoPandas, managed by [uv](https://docs.astral.sh/uv/).
  Pulls PA state legislative districts and county subdivisions from
  US Census TIGER/LINE 2024, joins ACS 2023 5-year population, and
  computes population-weighted municipal composition per district.
- **Data**: Stored as a single ~870 KB `pa_house_districts.geojson` in
  `public/data/`. Small enough to skip vector tiles for now; we can
  switch to PMTiles + tippecanoe if/when this grows.

## Quick start

```bash
# Frontend
bun install
bun run dev          # http://localhost:4321

# Production build
bun run build
bun run preview
```

The committed `public/data/pa_house_districts.geojson` is pre-built, so
the dev server works immediately. Re-run the pipeline only when you
need to refresh the underlying geographic / population data:

```bash
cd pipeline
uv sync
uv run python scripts/build_districts.py
```

## What's in the repo

```
.
├── public/
│   └── data/
│       └── pa_house_districts.geojson   ← pre-built, ~870 KB
├── pipeline/
│   ├── pyproject.toml
│   ├── data/                            ← raw downloads (gitignored)
│   └── scripts/
│       └── build_districts.py           ← single ETL entry point
└── src/
    ├── components/
    │   ├── VoteMap.tsx                  ← MapLibre choropleth
    │   ├── BillSelector.tsx             ← bill tab strip
    │   ├── DistrictPopup.tsx            ← click panel
    │   └── Legend.tsx
    ├── data/
    │   ├── members/
    │   │   └── committee-housing-2025.ts ← !! ACTION REQUIRED
    │   └── votes/
    │       └── 2025-04-14-housing.ts    ← HB 2186 + HB 2109 roll calls
    ├── lib/
    │   ├── colors.ts
    │   ├── types.ts
    │   └── voteAggregation.ts
    ├── layouts/Layout.astro
    ├── pages/index.astro
    └── styles/global.css
```

## Status of the April 14, 2025 vote

Two bills were reported out of the House Housing & Urban Affairs
committee on April 14, 2025:

| Bill | Outcome | Margin | Notes |
|---|---|---|---|
| HB 2186 | Passed | 19–7 | Bipartisan support |
| HB 2109 | Passed | 19–7 | Same total, but Reps. Rasel and Twardzik flipped vs HB 2186 |

All 14 Democrats voted Yea on both bills. The Republican coalition was
5 Yea / 7 Nay on each, with Rasel and Twardzik trading places.

Vote details are transcribed by hand in
`src/data/votes/2025-04-14-housing.ts` from the official roll call
summary screenshots. The `palegis.us` site currently blocks automated
fetches — when we resume tracking we'll either work around it with a
real-browser scraper or accept manual entry as the workflow.

## Action items before publishing

1. **Fill in district numbers** in
   `src/data/members/committee-housing-2025.ts`. There are 26 members,
   currently with `district: ""`. Until those are filled in the map
   will render correctly but no district will be colored — the popups
   for committee members' districts won't light up.

2. **Confirm rollcallid → bill mapping**. The two URLs we have from
   palegis.us are `rollcallid=1909` and `rollcallid=1915`. We don't
   yet know which corresponds to HB 2186 vs HB 2109. Update the
   `sourceUrl` fields in `2025-04-14-housing.ts`.

3. **Add bill short titles + descriptions**. Both `bill.shortTitle`
   and `bill.description` are currently `"TODO: …"`. These show up in
   the bill selector tabs and (eventually) in the page intro copy.

4. **Push to GitHub**. The repo is initialized locally; once the above
   is done:
   ```bash
   git remote add origin https://github.com/jongeeting/pa-housing-votes.git
   git push -u origin main
   ```

## Design choices (locked in)

- **Statewide map only** (Option A from the planning chat). No Philly
  inset for v1; readers can click to zoom.
- **One app, two bills with a tab selector** at the top of the map.
- **Color encoding**:
  - Fill = vote (green Yea, orange Nay, gray Not Voting / not on
    committee).
  - Outline color = party (blue D, red R), so cross-party votes pop.
- **Popup metric**: population share by municipality and by municipal
  class (first-class city, borough, township 1st class, etc.).

## Known limitations / future work

- Municipal class codes come from US Census MAF/TIGER `CLASSFP`,
  which is general-purpose. PA's own taxonomy
  (first-class city, second-class city, second-class A, third-class,
  borough, first-class township, second-class township, town) is
  approximated by mapping `CLASSFP` codes + a small `PA_OVERRIDES`
  table. Some edge cases (e.g. boroughs vs third-class cities) may be
  miscoded — we'll refine against PaSDA's authoritative municipality
  layer when we expand beyond the blog post.
- No Senate districts yet. Senate scaffolding is intentionally not
  built until we have a Senate vote to track.
- No member detail pages, no historical vote tracking, no
  cosponsorship pipeline. Those are post-blog-post deliverables.
- PMTiles skipped for v1 — at 870 KB the GeoJSON is small enough.
  Add tippecanoe-based tiling when the layer set grows.
