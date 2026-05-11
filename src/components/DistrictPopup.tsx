import type { Chamber, MapItem, MunicipalClass } from "@/lib/types";
import { MUNICIPAL_CLASS_LABELS } from "@/lib/types";
import { getMemberByDistrict } from "@/data/members";
import { COSPONSORSHIPS_BY_BILL } from "@/data/cosponsors";
import {
  findVote,
  getMapItemBill,
  getMapItemChamber,
  getMapItemCosponsorship,
  getMapItemId,
  getMapItemRollCall,
} from "@/lib/voteAggregation";
import { VOTE_COLORS, COSPONSOR_FILL } from "@/lib/colors";

interface Props {
  district: string;
  /** Raw GeoJSON feature properties from MapLibre. */
  properties: Record<string, unknown>;
  /** Which chamber's districts the user clicked on. */
  chamber: Chamber;
  items: MapItem[];
  onClose: () => void;
}

interface TopMuniRow {
  name: string;
  classCode: MunicipalClass;
  populationShare: number;
}

interface TopCountyRow {
  name: string;
  geoid: string;
  populationShare: number;
}

const parseList = <T,>(raw: unknown): T[] => {
  if (Array.isArray(raw)) return raw as T[];
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as T[];
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

interface CosInfo {
  isCosponsor: boolean;
  isSponsor: boolean;
}

const cosponsorInfoForItem = (item: MapItem, district: string): CosInfo => {
  // For cosponsor-only items the cosponsorship is attached to the item.
  // For roll-call items, look up the bill's cosponsorship from the
  // global index so the popup can show both the vote and (if applicable)
  // the cosponsor pill side by side.
  const cs =
    getMapItemCosponsorship(item) ??
    COSPONSORSHIPS_BY_BILL.get(getMapItemBill(item).id) ??
    null;
  if (!cs) return { isCosponsor: false, isSponsor: false };
  if (cs.primeSponsor.district === district)
    return { isCosponsor: true, isSponsor: true };
  if (cs.cosponsors.some((c) => c.district === district))
    return { isCosponsor: true, isSponsor: false };
  return { isCosponsor: false, isSponsor: false };
};

export const DistrictPopup = ({
  district,
  properties,
  chamber,
  items,
  onClose,
}: Props) => {
  const member = getMemberByDistrict(chamber, district);
  const population = Number(properties.population ?? 0);
  const landAreaSqMi = Number(properties.landAreaSqMi ?? 0);
  const topMunis = parseList<TopMuniRow>(properties.topMunicipalities);
  const topCounties = parseList<TopCountyRow>(properties.topCounties);
  const classShares = parseClassShares(properties.classShares);

  const sortedClasses = Object.entries(classShares)
    .filter(([, v]) => v > 0.005)
    .sort(([, a], [, b]) => b - a) as [MunicipalClass, number][];

  const districtLabel = chamber === "Senate" ? "PA Senate District" : "PA House District";

  // Show only the items applicable to this chamber — clicking a senate
  // district shouldn't surface a column of house roll calls.
  const itemsForChamber = items.filter((i) => getMapItemChamber(i) === chamber);

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
        <div className="popup__district">
          {districtLabel} {district}
        </div>
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
            Vacant seat
          </div>
        )}
      </div>

      {itemsForChamber.length > 0 && (
        <div className="popup__section">
          <div className="popup__section-title">
            {chamber === "Senate" ? "Senate bills" : "Bills tracked"}
          </div>
          <table className="popup__votes">
            <tbody>
              {itemsForChamber.map((item) => {
                const bill = getMapItemBill(item);
                const rc = getMapItemRollCall(item);
                const v = rc && member ? findVote(rc, member.id) : undefined;
                const cs = cosponsorInfoForItem(item, district);
                return (
                  <tr key={getMapItemId(item)}>
                    <td className="popup__bill-cell">{bill.label}</td>
                    <td>
                      {v ? (
                        <>
                          <span
                            className="popup__vote-pill"
                            style={{ background: VOTE_COLORS[v.vote] }}
                          >
                            {v.vote}
                          </span>
                          {cs.isCosponsor && (
                            <span
                              className="popup__vote-pill"
                              style={{
                                background: COSPONSOR_FILL,
                                marginLeft: 4,
                              }}
                            >
                              {cs.isSponsor ? "Sponsor" : "Cosponsor"}
                            </span>
                          )}
                        </>
                      ) : cs.isCosponsor ? (
                        <span
                          className="popup__vote-pill"
                          style={{ background: COSPONSOR_FILL }}
                        >
                          {cs.isSponsor ? "Prime sponsor" : "Cosponsor"}
                        </span>
                      ) : (
                        <span className="popup__vote-pill popup__vote-pill--none">
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

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

      {topCounties.length > 0 && (
        <div className="popup__section">
          <div className="popup__section-title">
            {topCounties.length === 1 ? "County" : "Top counties"}
          </div>
          <ul className="popup__munis">
            {topCounties.slice(0, 5).map((c) => (
              <li key={c.geoid}>
                <span className="popup__muni-name">{c.name} County</span>
                <span className="popup__muni-share">
                  {formatPct(c.populationShare)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

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
