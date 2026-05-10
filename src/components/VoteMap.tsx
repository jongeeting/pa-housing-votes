import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import type { RollCall } from "@/lib/types";
import {
  VOTE_COLORS,
  VOTE_FILL_OPACITY,
  PARTY_STROKE,
  COSPONSOR_FILL,
  NO_VOTE_FILL,
} from "@/lib/colors";
import { snapshotByDistrict } from "@/lib/voteAggregation";
import { COSPONSORSHIPS_BY_BILL } from "@/data/cosponsors";
import { DistrictPopup } from "./DistrictPopup";
import { BillSelector } from "./BillSelector";
import { Legend } from "./Legend";

interface Props {
  rollCalls: RollCall[];
  /** Path (relative to site root) of the districts GeoJSON. */
  districtsUrl?: string;
  /** Path of the counties GeoJSON used by the toggleable county layer. */
  countiesUrl?: string;
}

const DEFAULT_DISTRICTS_URL = "/data/pa_house_districts.geojson";
const DEFAULT_COUNTIES_URL = "/data/pa_counties.geojson";

const PA_BOUNDS: [[number, number], [number, number]] = [
  [-80.6, 39.6],
  [-74.6, 42.4],
];

/**
 * Statewide PA House district choropleth showing how each district's
 * representative voted on a selected roll call. Click a district to
 * see member info + municipal composition.
 */
export const VoteMap = ({
  rollCalls,
  districtsUrl = DEFAULT_DISTRICTS_URL,
  countiesUrl = DEFAULT_COUNTIES_URL,
}: Props) => {
  const cosponsorships = COSPONSORSHIPS_BY_BILL;
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [selectedRollCallId, setSelectedRollCallId] = useState(
    rollCalls[0]?.id ?? "",
  );
  const [selectedDistrict, setSelectedDistrict] = useState<{
    district: string;
    properties: Record<string, unknown>;
  } | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [showCounties, setShowCounties] = useState(false);

  const selectedRollCall = useMemo(
    () => rollCalls.find((r) => r.id === selectedRollCallId) ?? rollCalls[0],
    [rollCalls, selectedRollCallId],
  );

  // Build the per-district color expression for the active roll call.
  const districtSnapshots = useMemo(
    () =>
      selectedRollCall
        ? snapshotByDistrict(
            selectedRollCall,
            cosponsorships?.get(selectedRollCall.bill.id),
          )
        : new Map(),
    [selectedRollCall, cosponsorships],
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      // No raster basemap — the districts are the story and a
      // basemap mostly adds noise. Static off-white background +
      // district polygons + their outlines gives a clean editorial
      // look and avoids third-party tile CORS / rate-limit issues.
      // We can revisit and add a vector basemap (Protomaps / MapTiler)
      // once we want a self-contained statewide reference layer.
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
          'Districts &amp; municipalities: US Census TIGER/LINE 2024. Pop: ACS 2023 5-year.',
      }),
    );

    // Defensive resize: when the map is hydrated client-side, the
    // container can briefly measure as zero-height before layout
    // settles. Force a re-measure on load and on next animation frame.
    const forceResize = () => {
      try {
        map.resize();
      } catch {
        /* map disposed */
      }
    };
    map.on("load", forceResize);
    requestAnimationFrame(forceResize);

    // ResizeObserver keeps the canvas in sync with the parent's
    // computed size after fonts / async CSS apply.
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && containerRef.current) {
      ro = new ResizeObserver(() => forceResize());
      ro.observe(containerRef.current);
    }

    map.on("load", async () => {
      map.addSource("districts", {
        type: "geojson",
        data: districtsUrl,
        promoteId: "district",
      });

      map.addLayer({
        id: "districts-fill",
        type: "fill",
        source: "districts",
        paint: {
          "fill-color": NO_VOTE_FILL,
          "fill-opacity": VOTE_FILL_OPACITY,
        },
      });

      map.addLayer({
        id: "districts-outline",
        type: "line",
        source: "districts",
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
      });

      // Highlight ring for the selected district (drawn above outlines).
      map.addLayer({
        id: "districts-selected",
        type: "line",
        source: "districts",
        paint: {
          "line-color": "#111827",
          "line-width": 3,
        },
        filter: ["==", ["get", "district"], "__none__"],
      });

      // County polygons — added as a hidden line layer on top, toggled
      // via setLayoutProperty when the user clicks the Counties button.
      // Rendered above district outlines so county boundaries are
      // visible against the district mosaic.
      map.addSource("counties", {
        type: "geojson",
        data: countiesUrl,
      });

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

      map.on("click", "districts-fill", (e) => {
        const feature = e.features?.[0];
        if (!feature) return;
        setSelectedDistrict({
          district: String(feature.properties?.district ?? ""),
          properties: feature.properties ?? {},
        });
        map.setFilter("districts-selected", [
          "==",
          ["get", "district"],
          feature.properties?.district,
        ]);
      });

      map.on("mouseenter", "districts-fill", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "districts-fill", () => {
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
  }, [districtsUrl, countiesUrl]);

  // Toggle county layer visibility when the user clicks the Counties button.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    if (!map.getLayer("counties-outline")) return;
    map.setLayoutProperty(
      "counties-outline",
      "visibility",
      showCounties ? "visible" : "none",
    );
  }, [showCounties, mapReady]);

  // Re-paint district fills whenever the selected roll call changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !selectedRollCall) return;

    // Build a "match" expression: district id → fill color.
    const matchExpression: (string | string[] | number[])[] = [
      "match",
      ["get", "district"],
    ];

    // Collect (district, color) pairs.
    // Priority: vote color > cosponsor purple > gray.
    for (const [district, snap] of districtSnapshots) {
      matchExpression.push(district);
      if (snap.vote) {
        matchExpression.push(VOTE_COLORS[snap.vote]);
      } else if (snap.isCosponsor) {
        matchExpression.push(COSPONSOR_FILL);
      } else {
        matchExpression.push(NO_VOTE_FILL);
      }
    }
    matchExpression.push(NO_VOTE_FILL); // fallback

    // Same idea for stroke color, party-tinted only on members who voted.
    const strokeExpression: (string | string[])[] = [
      "match",
      ["get", "district"],
    ];
    for (const [district, snap] of districtSnapshots) {
      strokeExpression.push(district);
      strokeExpression.push(snap.party ? PARTY_STROKE[snap.party] : "#374151");
    }
    strokeExpression.push("#9ca3af"); // fallback for non-committee districts

    map.setPaintProperty(
      "districts-fill",
      "fill-color",
      matchExpression as unknown as maplibregl.ExpressionSpecification,
    );
    map.setPaintProperty(
      "districts-outline",
      "line-color",
      strokeExpression as unknown as maplibregl.ExpressionSpecification,
    );
    map.setPaintProperty("districts-outline", "line-width", [
      "case",
      ["has", ["to-string", ["get", "district"]], ["literal", Object.fromEntries(Array.from(districtSnapshots.entries()).map(([d]) => [d, true]))]],
      1.6,
      0.6,
    ] as unknown as maplibregl.ExpressionSpecification);
  }, [districtSnapshots, selectedRollCall, mapReady]);

  if (!selectedRollCall) {
    return (
      <div className="vote-map-empty">
        No roll calls available. Add one in <code>src/data/votes/</code>.
      </div>
    );
  }

  return (
    <div className="vote-map">
      <BillSelector
        rollCalls={rollCalls}
        selectedId={selectedRollCallId}
        onChange={setSelectedRollCallId}
      />
      <div className="vote-map__canvas-wrap">
        <div ref={containerRef} className="vote-map__canvas" />
        <div className="vote-map__controls">
          <button
            type="button"
            className={`vote-map__toggle${showCounties ? " is-active" : ""}`}
            onClick={() => setShowCounties((v) => !v)}
            aria-pressed={showCounties}
          >
            County lines
          </button>
        </div>
        <Legend rollCall={selectedRollCall} />
        {selectedDistrict && (
          <DistrictPopup
            district={selectedDistrict.district}
            properties={selectedDistrict.properties}
            rollCalls={rollCalls}
            onClose={() => {
              setSelectedDistrict(null);
              mapRef.current?.setFilter("districts-selected", [
                "==",
                ["get", "district"],
                "__none__",
              ]);
            }}
          />
        )}
      </div>
    </div>
  );
};
