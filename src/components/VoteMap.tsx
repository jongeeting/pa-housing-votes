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
} from "@/lib/voteAggregation";
import { COSPONSORSHIPS_BY_BILL } from "@/data/cosponsors";
import { DistrictPopup } from "./DistrictPopup";
import { BillSelector } from "./BillSelector";
import { Legend } from "./Legend";
import { LayerPanel } from "./LayerPanel";

interface Props {
  items: MapItem[];
  houseDistrictsUrl?: string;
  senateDistrictsUrl?: string;
  countiesUrl?: string;
  munisUrl?: string;
}

const DEFAULT_HOUSE_URL = "/data/pa_house_districts.geojson";
const DEFAULT_SENATE_URL = "/data/pa_senate_districts.geojson";
const DEFAULT_COUNTIES_URL = "/data/pa_counties.geojson";
const DEFAULT_MUNIS_URL = "/data/pa_municipalities.geojson";

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

  const firstId = items[0] ? getMapItemId(items[0]) : null;
  const [selectedItemId, setSelectedItemId] = useState<string | null>(firstId);
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
  const districtSnapshots = useMemo(
    () => {
      if (!selectedItem) return new Map();
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
    for (const chamber of ["House", "Senate"] as Chamber[]) {
      const visibility = chamber === activeChamber ? "visible" : "none";
      for (const lid of [fillLayerId(chamber), outlineLayerId(chamber), selectedLayerId(chamber)]) {
        if (map.getLayer(lid)) map.setLayoutProperty(lid, "visibility", visibility);
      }
    }
  }, [activeChamber, mapReady]);

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
    // Fill is visible iff munis-on AND a class is highlighted.
    const fillVisible = showMunis && highlightClasses.size > 0;
    map.setLayoutProperty(
      "munis-fill",
      "visibility",
      fillVisible ? "visible" : "none",
    );
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
        />
        {selectedItem && <Legend item={selectedItem} />}
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
    </div>
  );
};
