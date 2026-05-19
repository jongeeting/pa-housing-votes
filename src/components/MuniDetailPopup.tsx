import { MUNICIPAL_CLASS_LABELS, type MunicipalClass } from "@/lib/types";
import { getMemberByDistrict } from "@/data/members";

export interface NestedDistrictEntry {
  district: string;
  /** Fraction of the muni's area inside this district. ~1.0 for munis
   *  fully contained in a single district; lower for split munis like
   *  Philadelphia (which sits inside 26 House districts). */
  overlapShareOfMuni: number;
}

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
  /** Legislative districts this muni overlaps. Built by the pipeline
   *  from the district × muni spatial overlay (slivers below 0.5%
   *  area share are dropped). For most PA munis these are
   *  single-element lists; cities like Allentown / Philly / Pittsburgh
   *  fan out across many. */
  nestedHouseDistricts: NestedDistrictEntry[];
  nestedSenateDistricts: NestedDistrictEntry[];
}

interface Props {
  data: MuniDetailData;
  /** When a user clicks a district number/name inside the popup,
   *  the parent map applies it as a filter (dims un-matching munis,
   *  updates the URL). Optional so the popup is reusable in
   *  read-only contexts. */
  onApplyDistrictFilter?: (chamber: "House" | "Senate", district: string) => void;
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
export const MuniDetailPopup = ({
  data,
  onApplyDistrictFilter,
  onClose,
}: Props) => {
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

      {(data.nestedHouseDistricts.length > 0 ||
        data.nestedSenateDistricts.length > 0) && (
        <div className="popup__section popup__nesting">
          <div className="popup__section-title">
            Legislative districts that overlap this muni
          </div>
          {data.nestedHouseDistricts.length > 0 && (
            <DistrictList
              chamber="House"
              entries={data.nestedHouseDistricts}
              onApplyFilter={onApplyDistrictFilter}
            />
          )}
          {data.nestedSenateDistricts.length > 0 && (
            <DistrictList
              chamber="Senate"
              entries={data.nestedSenateDistricts}
              onApplyFilter={onApplyDistrictFilter}
            />
          )}
          <div className="popup__cross-link">
            <a href={`/#map`}>
              See how these legislators voted on housing bills →
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

interface DistrictListProps {
  chamber: "House" | "Senate";
  entries: NestedDistrictEntry[];
  onApplyFilter?: (chamber: "House" | "Senate", district: string) => void;
}

/**
 * One row per nested district: chamber label + district number + member
 * name + party pill + (when the muni is split) the % of muni area in
 * that district. Looking the member up by district can yield no result
 * for vacant seats; we render "Vacant" rather than skip the row. The
 * list is bounded — Philly fans out across 26 House districts — so
 * we cap at 8 and add a "+N more" tail.
 *
 * If onApplyFilter is provided, the row is a clickable button that
 * applies the district as a map filter; otherwise the row is plain
 * text. This lets the same component be used inside contexts that
 * can't accept the filter (e.g. embedded read-only views).
 */
const DistrictList = ({ chamber, entries, onApplyFilter }: DistrictListProps) => {
  const MAX_ROWS = 8;
  const visible = entries.slice(0, MAX_ROWS);
  const hidden = entries.length - visible.length;
  const showShare = entries.length > 1; // single-district munis don't need 100%
  return (
    <ul className="popup__nested-districts">
      {visible.map((entry) => {
        const member = getMemberByDistrict(chamber, entry.district);
        const shortChamber = chamber === "Senate" ? "SD" : "HD";
        const rowBody = (
          <>
            <span className="popup__nested-hd-id">
              {shortChamber}-{entry.district}
            </span>
            {member ? (
              <>
                <span
                  className={`popup__party popup__party--${member.party.toLowerCase()}`}
                >
                  {member.party}
                </span>
                <span className="popup__nested-hd-name">{member.fullName}</span>
              </>
            ) : (
              <span className="popup__nested-hd-name popup__member--unknown">
                Vacant seat
              </span>
            )}
            {showShare && (
              <span className="popup__nested-hd-share">
                {Math.round(entry.overlapShareOfMuni * 100)}%
              </span>
            )}
          </>
        );
        if (onApplyFilter) {
          return (
            <li key={`${chamber}-${entry.district}`}>
              <button
                type="button"
                className="popup__nested-district-row"
                onClick={() => onApplyFilter(chamber, entry.district)}
                title={`Filter the map to ${shortChamber}-${entry.district}`}
              >
                {rowBody}
              </button>
            </li>
          );
        }
        return <li key={`${chamber}-${entry.district}`}>{rowBody}</li>;
      })}
      {hidden > 0 && (
        <li className="popup__nested-districts-more">
          +{hidden} more {chamber === "Senate" ? "Senate" : "House"} districts
        </li>
      )}
    </ul>
  );
};
