import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import type { RollCall } from "@/lib/types";
import {
  VOTE_COLORS,
  VOTE_FILL_OPACITY,
  PARTY_STROKE,
  NO_VOTE_FILL,
} from "@/lib/colors";
import { snapshotByDistrict } from "@/lib/voteAggregation";
import { DistrictPopup } from "./DistrictPopup";
import { BillSelector } from "./BillSelector";
import { Legend } from "./Legend";

interface Props {
  rollCalls: RollCall[];
  /** Path (relative to site root) of the districts GeoJSON. */
  districtsUrl?: string;
}

const DEFAULT_DISTRICTS_URL = "/data/pa_house_districts.geojson";

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
}: Props) => {
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

  const selectedRollCall = useMemo(
    () => rollCalls.find((r) => r.id === selectedRollCallId) ?? rollCalls[0],
    [rollCalls, selectedRollCallId],
  );

  // Build the per-district color expression for the active roll call.
  const districtSnapshots = useMemo(
    () => (selectedRollCall ? snapshotByDistrict(selectedRollCall) : new Map()),
    [selectedRollCall],
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        glyphs:
          "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
        sources: {
          basemap: {
            type: "raster",
            tiles: [
              "https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
            ],
            tileSize: 256,
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
          },
        },
        layers: [
          {
            id: "basemap",
            type: "raster",
            source: "basemap",
            paint: { "raster-opacity": 0.85 },
          },
        ],
      },
      bounds: PA_BOUNDS,
      fitBoundsOptions: { padding: 32 },
      maxZoom: 12,
      minZoom: 5,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }));
    map.addControl(new maplibregl.AttributionControl({ compact: true }));

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
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [districtsUrl]);

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
    for (const [district, snap] of districtSnapshots) {
      matchExpression.push(district);
      matchExpression.push(snap.vote ? VOTE_COLORS[snap.vote] : NO_VOTE_FILL);
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
