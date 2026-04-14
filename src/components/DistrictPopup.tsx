import type { RollCall, MunicipalClass } from "@/lib/types";
import { MUNICIPAL_CLASS_LABELS } from "@/lib/types";
import { MEMBERS_BY_DISTRICT } from "@/data/members";
import { findVote } from "@/lib/voteAggregation";
import { VOTE_COLORS } from "@/lib/colors";

interface Props {
  district: string;
  /** Raw GeoJSON feature properties from MapLibre. */
  properties: Record<string, unknown>;
  rollCalls: RollCall[];
  onClose: () => void;
}

interface TopMuniRow {
  name: string;
  classCode: MunicipalClass;
  populationShare: number;
}

const parseTopMunis = (raw: unknown): TopMuniRow[] => {
  if (Array.isArray(raw)) return raw as TopMuniRow[];
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as TopMuniRow[];
    } catch {
      return [];
    }
  }
  return [];
};

const parseClassShares = (raw: unknown): Record<string, number> => {
  if (raw && typeof raw === "object" && !Array.isArray(raw))
    return raw as Record<string, number>;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as Record<string, number>;
    } catch {
      return {};
    }
  }
  return {};
};

const formatPct = (n: number) => `${Math.round(n * 100)}%`;
const formatPop = (n: number) =>
  new Intl.NumberFormat("en-US").format(Math.round(n));

export const DistrictPopup = ({
  district,
  properties,
  rollCalls,
  onClose,
}: Props) => {
  const member = MEMBERS_BY_DISTRICT.get(district) ?? null;
  const population = Number(properties.population ?? 0);
  const landAreaSqMi = Number(properties.landAreaSqMi ?? 0);
  const topMunis = parseTopMunis(properties.topMunicipalities);
  const classShares = parseClassShares(properties.classShares);

  // Sort class shares for the stacked bar.
  const sortedClasses = Object.entries(classShares)
    .filter(([, v]) => v > 0.005)
    .sort(([, a], [, b]) => b - a) as [MunicipalClass, number][];

  return (
    <div className="popup" role="dialog" aria-label={`District ${district}`}>
      <button
        type="button"
        className="popup__close"
        onClick={onClose}
        aria-label="Close"
      >
        ×
      </button>
      <div className="popup__header">
        <div className="popup__district">PA House District {district}</div>
        {member ? (
          <div className="popup__member">
            <span
              className={`popup__party popup__party--${member.party.toLowerCase()}`}
            >
              {member.party}
            </span>{" "}
            {member.fullName}
          </div>
        ) : (
          <div className="popup__member popup__member--unknown">
            Member unknown — add to <code>members/index.ts</code>
          </div>
        )}
      </div>

      <div className="popup__section">
        <div className="popup__section-title">Votes</div>
        <table className="popup__votes">
          <tbody>
            {rollCalls.map((rc) => {
              const v = member ? findVote(rc, member.id) : undefined;
              return (
                <tr key={rc.id}>
                  <td className="popup__bill-cell">{rc.bill.label}</td>
                  <td>
                    {v ? (
                      <span
                        className="popup__vote-pill"
                        style={{ background: VOTE_COLORS[v.vote] }}
                      >
                        {v.vote}
                      </span>
                    ) : (
                      <span className="popup__vote-pill popup__vote-pill--none">
                        Not on committee
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="popup__section">
        <div className="popup__section-title">District facts</div>
        <dl className="popup__facts">
          <div>
            <dt>Population</dt>
            <dd>{population ? formatPop(population) : "—"}</dd>
          </div>
          <div>
            <dt>Land area</dt>
            <dd>{landAreaSqMi ? `${landAreaSqMi.toFixed(0)} sq mi` : "—"}</dd>
          </div>
        </dl>
      </div>

      {topMunis.length > 0 && (
        <div className="popup__section">
          <div className="popup__section-title">Top municipalities</div>
          <ul className="popup__munis">
            {topMunis.slice(0, 5).map((m) => (
              <li key={m.name}>
                <span className="popup__muni-name">{m.name}</span>
                <span className="popup__muni-class">
                  {MUNICIPAL_CLASS_LABELS[m.classCode] ?? m.classCode}
                </span>
                <span className="popup__muni-share">
                  {formatPct(m.populationShare)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {sortedClasses.length > 0 && (
        <div className="popup__section">
          <div className="popup__section-title">By municipal class</div>
          <div className="popup__class-bar">
            {sortedClasses.map(([cls, share]) => (
              <div
                key={cls}
                className={`popup__class-bar-segment popup__class-bar-segment--${cls}`}
                style={{ width: `${share * 100}%` }}
                title={`${MUNICIPAL_CLASS_LABELS[cls]}: ${formatPct(share)}`}
              />
            ))}
          </div>
          <ul className="popup__class-legend">
            {sortedClasses.map(([cls, share]) => (
              <li key={cls}>
                <span
                  className={`popup__class-swatch popup__class-swatch--${cls}`}
                />
                {MUNICIPAL_CLASS_LABELS[cls]} · {formatPct(share)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
