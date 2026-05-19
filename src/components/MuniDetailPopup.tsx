import { MUNICIPAL_CLASS_LABELS, type MunicipalClass } from "@/lib/types";

export interface MuniDetailData {
  geoid: string;
  name: string;
  classCode: string;
  countyName: string;
  population: number;
  landAreaSqMi: number;
  populationDensity: number;
  medianIncome: number | null;
  medianHomeValue: number | null;
  rentBurdenedPct: number | null;
  ownerBurdenedPct: number | null;
  permitsPer1kPerYear: number | null;
  /** Optional — only present after the Census PEP 2024 sub-county
   *  pipeline lands. Until then, the field is missing/null and the
   *  popup row simply renders as "—". */
  popChange2020to2024Pct: number | null;
}

interface Props {
  data: MuniDetailData;
  onClose: () => void;
}

const intFmt = new Intl.NumberFormat("en-US");
const fmt = (n: number) => intFmt.format(Math.round(n));

const fmtUsd = (n: number | null): string => {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${Math.round(n)}`;
};

const fmtPct = (n: number | null): string =>
  n === null || n === undefined || Number.isNaN(n)
    ? "—"
    : `${n >= 0 ? "" : ""}${Math.round(n)}%`;

const fmtSignedPct = (n: number | null): string =>
  n === null || n === undefined || Number.isNaN(n)
    ? "—"
    : `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;

const fmtRate = (n: number | null): string =>
  n === null || n === undefined || Number.isNaN(n) ? "—" : n.toFixed(1);

/**
 * Persistent click-popup for a municipality on /housing-stats. Anchored
 * top-right of the map canvas (matches DistrictPopup's positioning),
 * scrollable, with a close button. Layout mirrors DistrictPopup so
 * users moving between maps have the same mental model.
 */
export const MuniDetailPopup = ({ data, onClose }: Props) => {
  const classLabel =
    MUNICIPAL_CLASS_LABELS[data.classCode as MunicipalClass] ?? data.classCode;
  return (
    <div className="popup" role="dialog" aria-label={`${data.name} stats`}>
      <button
        type="button"
        className="popup__close"
        onClick={onClose}
        aria-label="Close"
      >
        ×
      </button>
      <div className="popup__header">
        <div className="popup__district">{data.name}</div>
        <div className="popup__member popup__member--unknown">
          {classLabel} · {data.countyName} County
        </div>
      </div>

      <div className="popup__section">
        <div className="popup__section-title">Population</div>
        <dl className="popup__facts">
          <div>
            <dt>Population (2023 5-yr)</dt>
            <dd>{fmt(data.population)}</dd>
          </div>
          <div>
            <dt>Land area</dt>
            <dd>
              {data.landAreaSqMi.toFixed(1)} sq mi · {fmt(data.populationDensity)}/mi²
            </dd>
          </div>
          {data.popChange2020to2024Pct !== null && (
            <div>
              <dt>2020 → 2024 change</dt>
              <dd>{fmtSignedPct(data.popChange2020to2024Pct)}</dd>
            </div>
          )}
        </dl>
      </div>

      <div className="popup__section">
        <div className="popup__section-title">Housing</div>
        <dl className="popup__facts popup__facts--housing">
          <div>
            <dt>Permits per 1k/yr (2020-2024)</dt>
            <dd>{fmtRate(data.permitsPer1kPerYear)}</dd>
          </div>
          <div>
            <dt>Median home value</dt>
            <dd>{fmtUsd(data.medianHomeValue)}</dd>
          </div>
          <div>
            <dt>Median household income</dt>
            <dd>{fmtUsd(data.medianIncome)}</dd>
          </div>
          <div>
            <dt>Rent-burdened</dt>
            <dd>{fmtPct(data.rentBurdenedPct)}</dd>
          </div>
          <div>
            <dt>Owner-burdened</dt>
            <dd>{fmtPct(data.ownerBurdenedPct)}</dd>
          </div>
        </dl>
      </div>

      <div className="popup__section popup__nesting">
        <div className="popup__section-title">Where this fits politically</div>
        <div className="popup__nesting-body">
          See <a href={`/#map`}>the main vote map</a> for the legislators
          whose districts overlap {data.name} and how they voted on housing
          bills.
        </div>
      </div>
    </div>
  );
};
