import { useMemo } from "react";
import type { Chamber } from "@/lib/types";

/** Subset of district-feature properties we read for the snapshot
 *  + the per-metric rank computations. */
export interface DistrictRecord {
  district: string;
  permitsPer1kPerYear: number | null;
  popChange2020to2024Pct: number | null;
  medianHomeValue: number | null;
  rentBurdenedPct: number | null;
  /** Counties this district touches, sorted by pop share. Used to
   *  define the "regional" peer group: every district that shares
   *  at least one county with this one. */
  topCounties: Array<{ geoid: string; name: string; populationShare: number }>;
}

interface Props {
  chamber: Chamber;
  district: string;
  /** All districts in the active chamber. Used to compute statewide
   *  + regional rankings for each metric. Empty list short-circuits
   *  to a blank snapshot (we render nothing rather than mis-rank). */
  allDistricts: DistrictRecord[];
}

type MetricKey =
  | "permitsPer1kPerYear"
  | "popChange2020to2024Pct"
  | "medianHomeValue"
  | "rentBurdenedPct";

interface MetricSpec {
  key: MetricKey;
  label: string;
  /** Whether "higher = better" for "1st place" semantics. We display
   *  rank either way — the higherIsTop flag just controls which end
   *  of the sort gets rank 1. */
  higherIsTop: boolean;
  format: (n: number | null) => string;
}

const fmtRate = (n: number | null) =>
  n === null || Number.isNaN(n) ? "—" : n.toFixed(1);
const fmtSignedPct = (n: number | null) =>
  n === null || Number.isNaN(n)
    ? "—"
    : `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;
const fmtUsd = (n: number | null) => {
  if (n === null || Number.isNaN(n)) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${Math.round(n)}`;
};
const fmtPct = (n: number | null) =>
  n === null || Number.isNaN(n) ? "—" : `${Math.round(n)}%`;

const METRICS: MetricSpec[] = [
  {
    key: "permitsPer1kPerYear",
    label: "Permits / 1k / yr",
    higherIsTop: true,
    format: fmtRate,
  },
  {
    key: "popChange2020to2024Pct",
    label: "Population change",
    higherIsTop: true,
    format: fmtSignedPct,
  },
  {
    key: "medianHomeValue",
    label: "Median home value",
    higherIsTop: true,
    format: fmtUsd,
  },
  {
    key: "rentBurdenedPct",
    label: "Rent-burdened",
    higherIsTop: false, // here "1st place" = least burdened
    format: fmtPct,
  },
];

interface RankInfo {
  rank: number; // 1-based
  total: number;
  value: number | null;
}

/** Standard "competition" rank — ties share the same rank.  Districts
 *  with null values are excluded from `total` and never returned as
 *  the current district's rank (the caller handles null). */
const computeRank = (
  records: DistrictRecord[],
  targetDistrict: string,
  metric: MetricSpec,
): RankInfo => {
  const withValue = records.filter(
    (r) => r[metric.key] !== null && !Number.isNaN(r[metric.key] as number),
  );
  const target = withValue.find((r) => r.district === targetDistrict);
  if (!target) return { rank: 0, total: withValue.length, value: null };
  const targetValue = target[metric.key] as number;
  // Count records strictly "better than" target (per higherIsTop) →
  // target's rank = that count + 1.
  let better = 0;
  for (const r of withValue) {
    if (r.district === targetDistrict) continue;
    const v = r[metric.key] as number;
    if (metric.higherIsTop ? v > targetValue : v < targetValue) better += 1;
  }
  return { rank: better + 1, total: withValue.length, value: targetValue };
};

/**
 * Compact card panel shown above the muni choropleth when a district
 * filter is active. Four metrics, each with the district's value and
 * its statewide + regional rank. Region = peer districts that share
 * at least one of the locked district's top counties.
 *
 * Skipped entirely when the supplied all-districts list is empty
 * (data still loading) or the target district isn't found.
 */
export const DistrictSnapshot = ({
  chamber,
  district,
  allDistricts,
}: Props) => {
  const target = useMemo(
    () => allDistricts.find((r) => r.district === district),
    [allDistricts, district],
  );

  // Peer group = districts sharing at least one county with target.
  // We use county GEOIDs (5-char) to avoid name-collision pitfalls.
  const regionPeers = useMemo(() => {
    if (!target) return [] as DistrictRecord[];
    const targetCounties = new Set(
      target.topCounties.map((c) => c.geoid),
    );
    if (targetCounties.size === 0) return [target];
    return allDistricts.filter((r) =>
      r.topCounties.some((c) => targetCounties.has(c.geoid)),
    );
  }, [target, allDistricts]);

  if (!target || allDistricts.length === 0) return null;

  const shortChamber = chamber === "Senate" ? "SD" : "HD";
  const regionLabel =
    target.topCounties.length === 0
      ? "regionally"
      : target.topCounties.length === 1
      ? `in ${target.topCounties[0].name} County`
      : `in ${target.topCounties[0].name} + neighbors`;

  return (
    <div className="district-snapshot">
      <div className="district-snapshot__title">
        {shortChamber}-{district} housing snapshot
        <span className="district-snapshot__title-sub">
          ranked across {allDistricts.length} {chamber} districts
        </span>
      </div>
      <div className="district-snapshot__grid">
        {METRICS.map((m) => {
          const stateRank = computeRank(allDistricts, district, m);
          const regionRank = computeRank(regionPeers, district, m);
          if (stateRank.value === null) {
            return (
              <div className="district-snapshot__cell" key={m.key}>
                <div className="district-snapshot__cell-label">{m.label}</div>
                <div className="district-snapshot__cell-value">—</div>
                <div className="district-snapshot__cell-rank">
                  no data
                </div>
              </div>
            );
          }
          return (
            <div className="district-snapshot__cell" key={m.key}>
              <div className="district-snapshot__cell-label">{m.label}</div>
              <div className="district-snapshot__cell-value">
                {m.format(stateRank.value)}
              </div>
              <div className="district-snapshot__cell-rank">
                <span className="district-snapshot__rank-pill">
                  #{stateRank.rank}/{stateRank.total} statewide
                </span>
                {regionPeers.length > 1 && (
                  <span className="district-snapshot__rank-pill district-snapshot__rank-pill--region">
                    #{regionRank.rank}/{regionRank.total} {regionLabel}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
