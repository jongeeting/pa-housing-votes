import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import type { Chamber, MapItem, MunicipalClass } from "@/lib/types";
import {
  VOTE_COLORS,
  VOTE_FILL_OPACITY,
  PARTY_STROKE,
  COSPONSOR_FILL,
  NO_VOTE_FILL,
} from "@/lib/colors";
import {
  computeNestedSupport,
  getMapItemChamber,
  getMapItemCosponsorship,
  getMapItemId,
  snapshotByDistrict,
  type DistrictVoteSnapshot,
} from "@/lib/voteAggregation";
import { COSPONSORSHIPS_BY_BILL } from "@/data/cosponsors";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { DistrictPopup } from "./DistrictPopup";
import { BillSelector } from "./BillSelector";
import { Legend } from "./Legend";
import { LayerPanel } from "./LayerPanel";
import { MuniTooltip, type MuniTooltipData } from "./MuniTooltip";
import { FullVoteList } from "./FullVoteList";

interface Props {
  items: MapItem[];
  houseDistrictsUrl?: string;
  senateDistrictsUrl?: string;
  countiesUrl?: string;
  munisUrl?: string;
}

// Append a build-time `?v=` cache-buster so every new deploy forces
// MapLibre to fetch the fresh GeoJSON instead of replaying a copy that
// the browser cached from a previous visit. The data filenames stay
// stable (Netlify's filename-hash trick only applies to compiled
// JS/CSS), so the query string is the cleanest cache-bust. Falls back
// to empty when the constant isn't defined (e.g. test environments).
const BUILD_QS =
  typeof __BUILD_ID__ === "string" ? `?v=${__BUILD_ID__}` : "";

const DEFAULT_HOUSE_URL = `/data/pa_house_districts.geojson${BUILD_QS}`;
const DEFAULT_SENATE_URL = `/data/pa_senate_districts.geojson${BUILD_QS}`;
const DEFAULT_COUNTIES_URL = `/data/pa_counties.geojson${BUILD_QS}`;
const DEFAULT_MUNIS_URL = `/data/pa_municipalities.geojson${BUILD_QS}`;

const PA_BOUNDS: [[number, number], [number, number]] = [
  [-80.6, 39.6],
  [-74.6, 42.4],
];

const CHAMBER_SOURCES: Record<Chamber, string> = {
  House: "districts-house",
  Senate: "districts-senate",
};

const fillLayerId = (chamber: Chamber) => `districts-fill-${chamber.toLowerCase()}`;
const outlineLayerId = (chamber: Chamber) => `districts-outline-${chamber.toLowerCase()}`;
const selectedLayerId = (chamber: Chamber) => `districts-selected-${chamber.toLowerCase()}`;

/**
 * Statewide PA House or Senate district choropleth. The active chamber
 * is driven by the selected MapItem's bill chamber — pick HB X and the
 * map renders house districts, pick SB Y and it swaps to senate.
 *
 * Layers (bottom to top):
 *   background → districts-fill (per chamber) → districts-outline
 *   → munis-fill (highlight by class, off by default)
 *   → munis-outline (off by default) → counties-outline (off by default)
 *   → districts-selected ring
 */
export const VoteMap = ({
  items,
  houseDistrictsUrl = DEFAULT_HOUSE_URL,
  senateDistrictsUrl = DEFAULT_SENATE_URL,
  countiesUrl = DEFAULT_COUNTIES_URL,
  munisUrl = DEFAULT_MUNIS_URL,
}: Props) => {
  const cosponsorships = COSPONSORSHIPS_BY_BILL;
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  // Default to the first item in the list, but honor a ?bill=<id>
  // query param on first load — the BillCard "View on the map ↑"
  // link lands on /?bill=<id>#map, and we want the bill selector
  // already showing the requested bill (most recent MapItem for
  // that bill — usually the latest floor vote, or the cosponsor-
  // only entry if there's no roll call yet).
  const initialItemId = (() => {
    const fallback = items[0] ? getMapItemId(items[0]) : null;
    if (typeof window === "undefined") return fallback;
    const params = new URLSearchParams(window.location.search);
    const billId = params.get("bill");
    if (!billId) return fallback;
    const matching = items.filter((i) => getMapItemBill(i).id === billId);
    if (matching.length === 0) return fallback;
    // Prefer the most recent roll-call item; fall back to the
    // first matching MapItem (cosponsor-only items don't have
    // dates, so this leaves them in declared order).
    const sorted = [...matching].sort((a, b) => {
      const ad = a.kind === "rollCall" ? a.rollCall.date : "";
      const bd = b.kind === "rollCall" ? b.rollCall.date : "";
      return bd.localeCompare(ad);
    });
    return getMapItemId(sorted[0]);
  })();
  const [selectedItemId, setSelectedItemId] = useState<string | null>(initialItemId);
  const [selectedDistrict, setSelectedDistrict] = useState<{
    district: string;
    properties: Record<string, unknown>;
    chamber: Chamber;
  } | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [showCounties, setShowCounties] = useState(false);
  const [showMunis, setShowMunis] = useState(false);
  const [highlightClasses, setHighlightClasses] = useState<Set<MunicipalClass>>(
    new Set(),
  );
  // Independent per-chamber line toggles. In bill mode the active
  // chamber's own outlines are always shown via the choropleth's
  // outline layer, so only the "other chamber" toggle matters there.
  // In explore mode both toggles are exposed in the layer panel.
  const [showHouseLines, setShowHouseLines] = useState(false);
  const [showSenateLines, setShowSenateLines] = useState(false);
  const [showNestedSupport, setShowNestedSupport] = useState(false);
  // Cursor-following tooltip when hovering a muni (only when muni
  // layer is on). Null = no hover. Suppressed entirely on touch-
  // primary devices where hover semantics break down.
  const [hoveredMuni, setHoveredMuni] = useState<
    { x: number; y: number; data: MuniTooltipData } | null
  >(null);
  // Touch-primary devices (phones, most tablets) — disable the
  // muni hover tooltip which doesn't translate to tap UX.
  const isTouch = useMediaQuery("(hover: none)");
  // Compact viewport — used to fold rarely-needed controls in the
  // layer panel (muni-class highlights) and to skip the muni hover
  // listener entirely when there's no benefit on a small screen.
  const isCompact = useMediaQuery("(max-width: 720px)");
  // Map<senate district id, full nested-support breakdown for active item>
  const [senateNestedSupport, setSenateNestedSupport] = useState<
    Map<string, import("@/lib/voteAggregation").NestedSupport>
  >(new Map());

  // null when in "Just explore" mode — no choropleth, just the layer
  // panel selections drive what's visible.
  const selectedItem = useMemo(
    () =>
      selectedItemId
        ? items.find((i) => getMapItemId(i) === selectedItemId) ?? null
        : null,
    [items, selectedItemId],
  );
  const activeChamber: Chamber = selectedItem
    ? getMapItemChamber(selectedItem)
    : "House";

  // Closing the popup when the chamber changes — the old selection
  // belongs to the previous chamber's districts.
  useEffect(() => {
    setSelectedDistrict(null);
  }, [activeChamber]);

  // Snapshots keyed off the selected MapItem.
  const districtSnapshots = useMemo<Map<string, DistrictVoteSnapshot>>(
    () => {
      if (!selectedItem) return new Map<string, DistrictVoteSnapshot>();
      const cs =
        getMapItemCosponsorship(selectedItem) ??
        cosponsorships?.get(
          selectedItem.kind === "rollCall"
            ? selectedItem.rollCall.bill.id
            : selectedItem.bill.id,
        );
      return snapshotByDistrict(selectedItem, cs);
    },
    [selectedItem, cosponsorships],
  );

  // Senate features (parallel-loaded as JSON for nesting lookups —
  // MapLibre has its own copy as a tile source, but it's not directly
  // queryable for arbitrary computation. Small enough that re-fetching
  // here is cheap.)
  const [senateFeatures, setSenateFeatures] = useState<
    Array<{ properties: Record<string, unknown> }>
  >([]);
  useEffect(() => {
    let cancelled = false;
    fetch(senateDistrictsUrl)
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled) setSenateFeatures(j.features ?? []);
      })
      .catch(() => {
        /* surfaced as missing nested-support data */
      });
    return () => {
      cancelled = true;
    };
  }, [senateDistrictsUrl]);

  // Full per-Senate-district nested-delegation breakdown for the active
  // item. Computed only when the active chamber is House (the heatmap
  // doesn't make sense the other way without senate roll-call data).
  // We keep the rich object — heatmap uses .supportPct, popup uses
  // .yea/.total for "4/4 Yea on HB 2186" style breakdowns.
  useEffect(() => {
    if (
      activeChamber !== "House" ||
      !selectedItem ||
      senateFeatures.length === 0
    ) {
      setSenateNestedSupport(new Map());
      return;
    }
    const out = new Map<string, ReturnType<typeof computeNestedSupport>>();
    for (const f of senateFeatures) {
      const nested =
        (f.properties?.nestedHouseDistricts as
          | Array<{ district: string; overlapShareOfHD: number }>
          | undefined) ?? undefined;
      const sd = String(f.properties?.district ?? "");
      if (!sd) continue;
      out.set(
        sd,
        computeNestedSupport(nested, selectedItem, districtSnapshots),
      );
    }
    setSenateNestedSupport(out);
  }, [activeChamber, selectedItem, senateFeatures, districtSnapshots]);

  /* ------------------------------------------------------------------ */
  /*  Map init                                                          */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        glyphs:
          "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
        sources: {},
        layers: [
          {
            id: "background",
            type: "background",
            paint: { "background-color": "#f1f5f9" },
          },
        ],
      },
      bounds: PA_BOUNDS,
      fitBoundsOptions: { padding: 32 },
      maxZoom: 12,
      minZoom: 5,
      attributionControl: false,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }));
    map.addControl(
      new maplibregl.AttributionControl({
        compact: true,
        customAttribution:
          'Districts &amp; municipalities: US Census TIGER/LINE 2024. Pop: ACS 2023 5-year. Muni class: DCED.',
      }),
    );

    const forceResize = () => {
      try {
        map.resize();
      } catch {
        /* map disposed */
      }
    };
    map.on("load", forceResize);
    requestAnimationFrame(forceResize);

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && containerRef.current) {
      ro = new ResizeObserver(() => forceResize());
      ro.observe(containerRef.current);
    }

    map.on("load", async () => {
      // House + Senate sources
      map.addSource(CHAMBER_SOURCES.House, {
        type: "geojson",
        data: houseDistrictsUrl,
        promoteId: "district",
      });
      map.addSource(CHAMBER_SOURCES.Senate, {
        type: "geojson",
        data: senateDistrictsUrl,
        promoteId: "district",
      });

      // Add fill / outline / selected-ring per chamber. Visibility is
      // managed by a separate effect.
      for (const chamber of ["House", "Senate"] as Chamber[]) {
        const source = CHAMBER_SOURCES[chamber];
        map.addLayer({
          id: fillLayerId(chamber),
          type: "fill",
          source,
          paint: {
            "fill-color": NO_VOTE_FILL,
            "fill-opacity": VOTE_FILL_OPACITY,
          },
          layout: { visibility: chamber === "House" ? "visible" : "none" },
        });
        map.addLayer({
          id: outlineLayerId(chamber),
          type: "line",
          source,
          paint: {
            "line-color": "#374151",
            "line-width": [
              "interpolate",
              ["linear"],
              ["zoom"],
              5,
              0.4,
              10,
              1.2,
            ],
            "line-opacity": 0.55,
          },
          layout: { visibility: chamber === "House" ? "visible" : "none" },
        });
      }

      // Cross-chamber overlay layers — reuse the existing chamber
      // sources but render at different style / on top. Visibility is
      // managed by a separate effect.
      //
      // senate-overlay-fill is for the "color SD by nested support"
      // heatmap; it's clickable and shows the senate-side popup.
      // senate-overlay-outline + house-overlay-outline are decorative.
      map.addLayer({
        id: "senate-overlay-fill",
        type: "fill",
        source: CHAMBER_SOURCES.Senate,
        layout: { visibility: "none" },
        paint: {
          "fill-color": "#16a34a", // green-600
          "fill-opacity": 0,
        },
      });
      map.addLayer({
        id: "senate-overlay-outline",
        type: "line",
        source: CHAMBER_SOURCES.Senate,
        layout: { visibility: "none" },
        paint: {
          "line-color": "#1f2937",
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            5,
            1.4,
            10,
            2.6,
          ],
          "line-opacity": 0.7,
        },
      });
      map.addLayer({
        id: "house-overlay-outline",
        type: "line",
        source: CHAMBER_SOURCES.House,
        layout: { visibility: "none" },
        paint: {
          "line-color": "#475569",
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            5,
            0.3,
            10,
            0.9,
          ],
          "line-opacity": 0.55,
        },
      });

      // Muni layers (fill + outline). Hidden by default; user must
      // toggle "Municipal lines" on. Class-highlight fill kicks in when
      // the user checks one or more classes in the layer panel.
      map.addSource("munis", { type: "geojson", data: munisUrl });
      map.addLayer({
        id: "munis-fill",
        type: "fill",
        source: "munis",
        layout: { visibility: "none" },
        paint: {
          "fill-color": "#c084fc", // violet-400; expression overridden below
          "fill-opacity": 0,
        },
      });
      map.addLayer({
        id: "munis-outline",
        type: "line",
        source: "munis",
        layout: { visibility: "none" },
        paint: {
          "line-color": "#475569",
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            6,
            0.3,
            10,
            0.9,
          ],
          "line-opacity": 0.7,
        },
      });

      // Counties — outlines only, on top of munis.
      map.addSource("counties", { type: "geojson", data: countiesUrl });
      map.addLayer({
        id: "counties-outline",
        type: "line",
        source: "counties",
        layout: { visibility: "none" },
        paint: {
          "line-color": "#1f2937",
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            5,
            1.2,
            10,
            2.4,
          ],
          "line-opacity": 0.85,
        },
      });

      // Selected ring per chamber, drawn last so it's always on top.
      for (const chamber of ["House", "Senate"] as Chamber[]) {
        map.addLayer({
          id: selectedLayerId(chamber),
          type: "line",
          source: CHAMBER_SOURCES[chamber],
          paint: { "line-color": "#111827", "line-width": 3 },
          filter: ["==", ["get", "district"], "__none__"],
          layout: { visibility: chamber === "House" ? "visible" : "none" },
        });
      }

      // Click handlers — one per chamber's fill layer. Only the active
      // chamber's fill is visible so misclicks aren't an issue.
      for (const chamber of ["House", "Senate"] as Chamber[]) {
        const layer = fillLayerId(chamber);
        map.on("click", layer, (e) => {
          const feature = e.features?.[0];
          if (!feature) return;
          const district = String(feature.properties?.district ?? "");
          setSelectedDistrict({
            district,
            properties: feature.properties ?? {},
            chamber,
          });
          map.setFilter(selectedLayerId(chamber), [
            "==",
            ["get", "district"],
            district,
          ]);
        });
        map.on("mouseenter", layer, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", layer, () => {
          map.getCanvas().style.cursor = "";
        });
      }

      // When the senate-overlay-fill is visible (nesting heatmap mode),
      // clicks on it go to a senate popup with the nested-delegation
      // rollup, even though the active chamber is House.
      map.on("click", "senate-overlay-fill", (e) => {
        const feature = e.features?.[0];
        if (!feature) return;
        const district = String(feature.properties?.district ?? "");
        setSelectedDistrict({
          district,
          properties: feature.properties ?? {},
          chamber: "Senate",
        });
        if (map.getLayer(selectedLayerId("Senate"))) {
          map.setFilter(selectedLayerId("Senate"), [
            "==",
            ["get", "district"],
            district,
          ]);
        }
      });
      map.on("mouseenter", "senate-overlay-fill", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "senate-overlay-fill", () => {
        map.getCanvas().style.cursor = "";
      });

      // Muni hover tooltip — only fires when munis-fill is visible
      // (controlled by showMunis). Cursor stays as default since
      // there's no click action on munis; the tooltip just shows.
      map.on("mousemove", "munis-fill", (e) => {
        const feature = e.features?.[0];
        if (!feature) return;
        const props = feature.properties ?? {};
        // Nullable numeric helper — GeoJSON serializes JSON null as
        // explicit null, but MapLibre may surface it as undefined.
        const numOrNull = (v: unknown): number | null =>
          v === null || v === undefined || v === "" ? null : Number(v);
        setHoveredMuni({
          x: e.point.x,
          y: e.point.y,
          data: {
            name: String(props.name ?? ""),
            classCode: String(props.classCode ?? "other") as MuniTooltipData["classCode"],
            countyName: String(props.countyName ?? ""),
            population: Number(props.population ?? 0),
            landAreaSqMi: Number(props.landAreaSqMi ?? 0),
            populationDensity: Number(props.populationDensity ?? 0),
            medianIncome: numOrNull(props.medianIncome),
            medianHomeValue: numOrNull(props.medianHomeValue),
            rentBurdenedPct: numOrNull(props.rentBurdenedPct),
            ownerBurdenedPct: numOrNull(props.ownerBurdenedPct),
            permitsPer1kPerYear: numOrNull(props.permitsPer1kPerYear),
          },
        });
      });
      map.on("mouseleave", "munis-fill", () => {
        setHoveredMuni(null);
      });

      mapRef.current = map;
      setMapReady(true);
    });

    return () => {
      ro?.disconnect();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [houseDistrictsUrl, senateDistrictsUrl, countiesUrl, munisUrl]);

  /* ------------------------------------------------------------------ */
  /*  Chamber visibility                                                */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const exploreMode = !selectedItem;
    for (const chamber of ["House", "Senate"] as Chamber[]) {
      const isActive = chamber === activeChamber;
      // Fill + selected-ring follow the active chamber regardless of
      // mode — we need a clickable surface for the popup either way.
      for (const lid of [fillLayerId(chamber), selectedLayerId(chamber)]) {
        if (map.getLayer(lid)) {
          map.setLayoutProperty(lid, "visibility", isActive ? "visible" : "none");
        }
      }
      // Active-chamber outline:
      //   Bill mode → always on (carries party-stroke colors).
      //   Explore mode → controlled by the chamber's line toggle so
      //     the user can start with a clean canvas and add lines.
      const wantOutline = isActive && (
        !exploreMode ||
        (chamber === "House" ? showHouseLines : showSenateLines)
      );
      const outlineId = outlineLayerId(chamber);
      if (map.getLayer(outlineId)) {
        map.setLayoutProperty(outlineId, "visibility", wantOutline ? "visible" : "none");
      }
    }
  }, [activeChamber, showHouseLines, showSenateLines, selectedItem, mapReady]);

  /* ------------------------------------------------------------------ */
  /*  Cross-chamber overlay visibility + heatmap paint                  */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    // Senate outlines: shown when the user wants senate lines AND the
    // active chamber isn't already senate (in which case
    // districts-outline-senate already covers it).
    const senateLinesVisible =
      showSenateLines && activeChamber !== "Senate";
    // House outlines overlay: shown when user wants house lines AND
    // chamber isn't already house.
    const houseLinesVisible =
      showHouseLines && activeChamber !== "House";
    // Senate fill visible when either the heatmap is on (bill mode) or
    // we're in explore mode with senate lines on — in the latter case
    // the fill is invisible (opacity 0) but receives clicks for the
    // senate popup.
    const senateFillVisible =
      activeChamber === "House" &&
      ((showNestedSupport && !!selectedItem) ||
        (!selectedItem && showSenateLines));
    if (map.getLayer("senate-overlay-outline")) {
      map.setLayoutProperty(
        "senate-overlay-outline",
        "visibility",
        senateLinesVisible ? "visible" : "none",
      );
    }
    if (map.getLayer("senate-overlay-fill")) {
      map.setLayoutProperty(
        "senate-overlay-fill",
        "visibility",
        senateFillVisible ? "visible" : "none",
      );
    }
    if (map.getLayer("house-overlay-outline")) {
      map.setLayoutProperty(
        "house-overlay-outline",
        "visibility",
        houseLinesVisible ? "visible" : "none",
      );
    }
  }, [
    activeChamber,
    showHouseLines,
    showSenateLines,
    showNestedSupport,
    selectedItem,
    mapReady,
  ]);

  // Paint expression for the heatmap: opacity scales with nested
  // support %. Max ~0.55 so the underlying House choropleth + outlines
  // still bleed through enough to be readable.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !map.getLayer("senate-overlay-fill")) return;
    if (senateNestedSupport.size === 0) {
      map.setPaintProperty("senate-overlay-fill", "fill-opacity", 0);
      return;
    }
    const expr: (string | number | string[])[] = ["match", ["get", "district"]];
    for (const [sd, support] of senateNestedSupport) {
      expr.push(sd);
      expr.push(support.supportPct * 0.55);
    }
    expr.push(0); // fallback
    map.setPaintProperty(
      "senate-overlay-fill",
      "fill-opacity",
      expr as unknown as maplibregl.ExpressionSpecification,
    );
  }, [senateNestedSupport, mapReady]);

  /* ------------------------------------------------------------------ */
  /*  Counties toggle                                                   */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !map.getLayer("counties-outline")) return;
    map.setLayoutProperty(
      "counties-outline",
      "visibility",
      showCounties ? "visible" : "none",
    );
  }, [showCounties, mapReady]);

  /* ------------------------------------------------------------------ */
  /*  Munis toggle + class highlight                                    */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !map.getLayer("munis-outline")) return;
    map.setLayoutProperty(
      "munis-outline",
      "visibility",
      showMunis ? "visible" : "none",
    );
    // Fill is always-visible-when-munis-are-on so hover/tooltip
    // works; class highlight controls opacity (0 when no class is
    // selected → transparent but still hit-testable).
    map.setLayoutProperty(
      "munis-fill",
      "visibility",
      showMunis ? "visible" : "none",
    );
    const fillVisible = showMunis && highlightClasses.size > 0;
    if (!showMunis) {
      // Layer went away — drop stale tooltip; mouseleave doesn't fire
      // when visibility flips.
      setHoveredMuni(null);
    }
    if (fillVisible) {
      const classes = Array.from(highlightClasses);
      // Per-muni opacity: highlighted classes get 0.55, others 0.
      map.setPaintProperty(
        "munis-fill",
        "fill-opacity",
        [
          "case",
          ["in", ["get", "classCode"], ["literal", classes]],
          0.55,
          0,
        ] as unknown as maplibregl.ExpressionSpecification,
      );
    }
  }, [showMunis, highlightClasses, mapReady]);

  /* ------------------------------------------------------------------ */
  /*  Paint the active chamber's choropleth                             */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    // Explore mode: clear any prior expressions and let the layer use
    // its base NO_VOTE_FILL color + default outline.
    if (!selectedItem) {
      for (const chamber of ["House", "Senate"] as Chamber[]) {
        const fill = fillLayerId(chamber);
        const outline = outlineLayerId(chamber);
        if (map.getLayer(fill)) map.setPaintProperty(fill, "fill-color", NO_VOTE_FILL);
        if (map.getLayer(outline)) {
          map.setPaintProperty(outline, "line-color", "#374151");
          map.setPaintProperty(outline, "line-width", [
            "interpolate",
            ["linear"],
            ["zoom"],
            5,
            0.4,
            10,
            1.2,
          ] as unknown as maplibregl.ExpressionSpecification);
        }
      }
      return;
    }

    const matchExpression: (string | string[] | number[])[] = [
      "match",
      ["get", "district"],
    ];
    for (const [district, snap] of districtSnapshots) {
      matchExpression.push(district);
      if (snap.vote) matchExpression.push(VOTE_COLORS[snap.vote]);
      else if (snap.isCosponsor) matchExpression.push(COSPONSOR_FILL);
      else matchExpression.push(NO_VOTE_FILL);
    }
    matchExpression.push(NO_VOTE_FILL);

    const strokeExpression: (string | string[])[] = [
      "match",
      ["get", "district"],
    ];
    for (const [district, snap] of districtSnapshots) {
      strokeExpression.push(district);
      strokeExpression.push(snap.party ? PARTY_STROKE[snap.party] : "#374151");
    }
    strokeExpression.push("#9ca3af");

    const fillLayer = fillLayerId(activeChamber);
    const outlineLayer = outlineLayerId(activeChamber);

    map.setPaintProperty(
      fillLayer,
      "fill-color",
      matchExpression as unknown as maplibregl.ExpressionSpecification,
    );
    map.setPaintProperty(
      outlineLayer,
      "line-color",
      strokeExpression as unknown as maplibregl.ExpressionSpecification,
    );
    map.setPaintProperty(outlineLayer, "line-width", [
      "case",
      [
        "has",
        ["to-string", ["get", "district"]],
        ["literal", Object.fromEntries(Array.from(districtSnapshots.entries()).map(([d]) => [d, true]))],
      ],
      1.6,
      0.6,
    ] as unknown as maplibregl.ExpressionSpecification);
  }, [districtSnapshots, activeChamber, mapReady, selectedItem]);

  if (items.length === 0) {
    return (
      <div className="vote-map-empty">
        No items available. Add a roll call or cosponsorship in{" "}
        <code>src/data/mapItems.ts</code>.
      </div>
    );
  }

  return (
    <div className="vote-map">
      <BillSelector
        items={items}
        selectedId={selectedItemId}
        onChange={setSelectedItemId}
      />
      <div className="vote-map__canvas-wrap">
        <div ref={containerRef} className="vote-map__canvas" />
        <LayerPanel
          activeChamber={activeChamber}
          hasActiveItem={!!selectedItem}
          showCounties={showCounties}
          onShowCountiesChange={setShowCounties}
          showMunis={showMunis}
          onShowMunisChange={setShowMunis}
          highlightClasses={highlightClasses}
          onHighlightClassesChange={setHighlightClasses}
          showHouseLines={showHouseLines}
          onShowHouseLinesChange={setShowHouseLines}
          showSenateLines={showSenateLines}
          onShowSenateLinesChange={setShowSenateLines}
          showNestedSupport={showNestedSupport}
          onShowNestedSupportChange={setShowNestedSupport}
          isCompact={isCompact}
        />
        {selectedItem && <Legend item={selectedItem} />}
        {!isTouch && hoveredMuni && (
          <MuniTooltip
            x={hoveredMuni.x}
            y={hoveredMuni.y}
            data={hoveredMuni.data}
          />
        )}
        {selectedDistrict && (
          <DistrictPopup
            district={selectedDistrict.district}
            properties={selectedDistrict.properties}
            chamber={selectedDistrict.chamber}
            items={items}
            activeItem={selectedItem}
            houseSnapshots={
              activeChamber === "House" ? districtSnapshots : new Map()
            }
            senateNestedSupport={senateNestedSupport}
            onClose={() => {
              setSelectedDistrict(null);
              const map = mapRef.current;
              if (map) {
                for (const chamber of ["House", "Senate"] as Chamber[]) {
                  if (map.getLayer(selectedLayerId(chamber))) {
                    map.setFilter(selectedLayerId(chamber), [
                      "==",
                      ["get", "district"],
                      "__none__",
                    ]);
                  }
                }
              }
            }}
          />
        )}
      </div>
      <FullVoteList
        activeItem={selectedItem}
        onSelectDistrict={(district, chamber) => {
          const map = mapRef.current;
          if (!map) return;
          // Look up the district feature in the chamber's source.
          // querySourceFeatures only returns features whose vector
          // tiles are loaded for the current viewport, so we use
          // an arbitrary point query against the source's geojson
          // by setting the filter and reading rendered features in
          // a separate pass — simpler to just load the geojson
          // properties via the loaded source data via a paint-bound
          // querySourceFeatures with a sourceLayer filter.
          const source = chamber === "House" ? "districts-house" : "districts-senate";
          const features = map.querySourceFeatures(source, {
            filter: ["==", ["get", "district"], district],
          });
          if (features.length === 0) return;
          setSelectedDistrict({
            district,
            properties: features[0].properties ?? {},
            chamber,
          });
          // Outline the selected district.
          if (map.getLayer(selectedLayerId(chamber))) {
            map.setFilter(selectedLayerId(chamber), [
              "==",
              ["get", "district"],
              district,
            ]);
          }
          // Scroll the map back into view so the popup is visible.
          document
            .getElementById("map")
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
      />
    </div>
  );
};
