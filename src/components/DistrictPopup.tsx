import type { RollCall, MunicipalClass } from "@/lib/types";
import { MUNICIPAL_CLASS_LABELS } from "@/lib/types";
import { MEMBERS_BY_DISTRICT } from "@/data/members";
import { COSPONSORSHIPS_BY_BILL } from "@/data/cosponsors";
import { findVote } from "@/lib/voteAggregation";
import { VOTE_COLORS, COSPONSOR_FILL } from "@/lib/colors";

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

/** Check if a district's rep is a cosponsor (or prime sponsor) of a bill. */
const getCosponsorInfo = (
  district: string,
  billId: string,
): { isCosponsor: boolean; isSponsor: boolean; name: string | null } => {
  const cs = COSPONSORSHIPS_BY_BILL.get(billId);
  if (!cs) return { isCosponsor: false, isSponsor: false, name: null };
  if (cs.primeSponsor.district === district)
    return { isCosponsor: true, isSponsor: true, name: cs.primeSponsor.name };
  const match = cs.cosponsors.find((c) => c.district === district);
  if (match) return { isCosponsor: true, isSponsor: false, name: match.name };
  return { isCosponsor: false, isSponsor: false, name: null };
};

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
        ) : (() => {
          // Try to find the rep's name from cosponsorship data
          const csInfo = COSPONSORSHIPS_BY_BILL
            ? Array.from(COSPONSORSHIPS_BY_BILL.values()).reduce<{ name: string | null; party: string | null }>((acc, cs) => {
                if (acc.name) return acc;
                if (cs.primeSponsor.district === district)
                  return { name: cs.primeSponsor.name, party: cs.primeSponsor.party };
                const match = cs.cosponsors.find((c) => c.district === district);
                if (match) return { name: match.name, party: match.party };
                return acc;
              }, { name: null, party: null })
            : { name: null, party: null };
          return csInfo.name ? (
            <div className="popup__member">
              <span className={`popup__party popup__party--${csInfo.party?.toLowerCase()}`}>
                {csInfo.party}
              </span>{" "}
              {csInfo.name}
            </div>
          ) : (
            <div className="popup__member popup__member--unknown">
              Not on committee
            </div>
          );
        })()}
      </div>

      <div className="popup__section">
        <div className="popup__section-title">Votes</div>
        <table className="popup__votes">
          <tbody>
            {rollCalls.map((rc) => {
              const v = member ? findVote(rc, member.id) : undefined;
              const csInfo = getCosponsorInfo(district, rc.bill.id);
              return (
                <tr key={rc.id}>
                  <td className="popup__bill-cell">{rc.bill.label}</td>
                  <td>
                    {v ? (
                      <>
                        <span
                          className="popup__vote-pill"
                          style={{ background: VOTE_COLORS[v.vote] }}
                        >
                          {v.vote}
                        </span>
                        {csInfo.isCosponsor && (
                          <span
                            className="popup__vote-pill"
                            style={{ background: COSPONSOR_FILL, marginLeft: 4 }}
                          >
                            {csInfo.isSponsor ? "Sponsor" : "Cosponsor"}
                          </span>
                        )}
                      </>
                    ) : csInfo.isCosponsor ? (
                      <span
                        className="popup__vote-pill"
                        style={{ background: COSPONSOR_FILL }}
                      >
                        {csInfo.isSponsor ? "Prime sponsor" : "Cosponsor"}
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
