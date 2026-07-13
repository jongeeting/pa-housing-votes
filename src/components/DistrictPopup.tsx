import type { Chamber, MapItem, MunicipalClass, NestedDistrict } from "@/lib/types";
import { MUNICIPAL_CLASS_LABELS } from "@/lib/types";
import { getMemberByDistrict } from "@/data/members";
import { COSPONSORSHIPS_BY_BILL } from "@/data/cosponsors";
import { useMediaQuery } from "@/lib/useMediaQuery";
import {
  findVote,
  getMapItemBill,
  getMapItemChamber,
  getMapItemCosponsorship,
  getMapItemId,
  getMapItemRollCall,
  type DistrictVoteSnapshot,
  type NestedSupport,
} from "@/lib/voteAggregation";
import { VOTE_COLORS, COSPONSOR_FILL } from "@/lib/colors";

interface Props {
  district: string;
  /** Raw GeoJSON feature properties from MapLibre. */
  properties: Record<string, unknown>;
  /** Which chamber's districts the user clicked on. */
  chamber: Chamber;
  items: MapItem[];
  /** The active MapItem (null in explore mode). Used to derive vote/cosponsor
   * info for the nested-delegation context lines. */
  activeItem: MapItem | null;
  /** House-side snapshots for cross-chamber rollups (only populated when
   * the active chamber is House). */
  houseSnapshots: Map<string, DistrictVoteSnapshot>;
  /** Per-Senate-district rollup of nested House delegation support. */
  senateNestedSupport: Map<string, NestedSupport>;
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

/** Compact USD: $385K, $1.2M, $90K. Null safe. */
const fmtUsdShort = (n: number | null | undefined): string => {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${Math.round(n)}`;
};

const numFromProps = (v: unknown): number | null =>
  v === null || v === undefined || v === "" ? null : Number(v);

/** First sentence of a description, capped at ~180 chars. */
const briefSentence = (description: string): string => {
  if (!description) return "";
  const periodIdx = description.indexOf(". ");
  if (periodIdx > -1 && periodIdx <= 180) {
    return description.slice(0, periodIdx + 1);
  }
  if (description.length <= 180) return description;
  return description.slice(0, 180).trimEnd() + "…";
};

const SHORT_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const formatShortDate = (iso: string): string => {
  // "2026-05-06" → "May 6, 2026"
  const [y, m, d] = iso.split("-");
  const mi = parseInt(m, 10) - 1;
  if (Number.isNaN(mi) || mi < 0 || mi > 11) return iso;
  return `${SHORT_MONTHS[mi]} ${parseInt(d, 10)}, ${y}`;
};

interface CosInfo {
  isCosponsor: boolean;
  isSponsor: boolean;
  /** Historical/recorded cosponsor name from the bill data — may
   * differ from the district's current member (e.g. Dillon was the
   * SD-5 cosponsor of SB 1126 but the seat is now Picozzi). */
  recordedName?: string;
  recordedParty?: string;
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
    return {
      isCosponsor: true,
      isSponsor: true,
      recordedName: cs.primeSponsor.name,
      recordedParty: cs.primeSponsor.party,
    };
  const match = cs.cosponsors.find((c) => c.district === district);
  if (match)
    return {
      isCosponsor: true,
      isSponsor: false,
      recordedName: match.name,
      recordedParty: match.party,
    };
  return { isCosponsor: false, isSponsor: false };
};

export const DistrictPopup = ({
  district,
  properties,
  chamber,
  items,
  activeItem,
  houseSnapshots,
  senateNestedSupport,
  onClose,
}: Props) => {
  const member = getMemberByDistrict(chamber, district);
  // On narrow viewports the geographic sub-sections (top counties +
  // top munis + class breakdown) collapse into a single <details>
  // disclosure starting closed, so the popup fits comfortably on a
  // phone without the user scrolling through tables they didn't ask
  // for. Desktop keeps everything expanded inline.
  const isCompact = useMediaQuery("(max-width: 720px)");
  const population = Number(properties.population ?? 0);
  const landAreaSqMi = Number(properties.landAreaSqMi ?? 0);
  const topMunis = parseList<TopMuniRow>(properties.topMunicipalities);
  const topCounties = parseList<TopCountyRow>(properties.topCounties);
  const classShares = parseClassShares(properties.classShares);
  const medianIncome = numFromProps(properties.medianIncome);
  const medianHomeValue = numFromProps(properties.medianHomeValue);
  const rentBurdenedPct = numFromProps(properties.rentBurdenedPct);
  const ownerBurdenedPct = numFromProps(properties.ownerBurdenedPct);
  const permitsPer1kPerYear = numFromProps(properties.permitsPer1kPerYear);
  const hasHousingFacts =
    medianIncome !== null ||
    medianHomeValue !== null ||
    rentBurdenedPct !== null ||
    ownerBurdenedPct !== null ||
    permitsPer1kPerYear !== null;
  const nestedHouseDistricts = parseList<NestedDistrict>(
    properties.nestedHouseDistricts,
  );
  const parentSenateDistricts = parseList<NestedDistrict>(
    properties.parentSenateDistricts,
  );

  const sortedClasses = Object.entries(classShares)
    .filter(([, v]) => v > 0.005)
    .sort(([, a], [, b]) => b - a) as [MunicipalClass, number][];

  const districtLabel = chamber === "Senate" ? "PA Senate District" : "PA House District";

  // Show only the items applicable to this chamber — clicking a senate
  // district shouldn't surface a column of house roll calls.
  const itemsForChamber = items.filter((i) => getMapItemChamber(i) === chamber);

  // Cross-chamber context for the nesting story:
  // - House popup → which Senate district contains this HD, and what %
  //   of THAT senate district's nested House delegation supports the
  //   active bill.
  // - Senate popup → the list of nested House districts with their
  //   stance on the active bill (the "4/4 Yea" breakdown, expanded).
  const primaryParentSD =
    chamber === "House"
      ? parentSenateDistricts.find((p) => p.overlapShareOfHD >= 0.5)
      : null;
  const primaryParentSDSenator = primaryParentSD
    ? getMemberByDistrict("Senate", primaryParentSD.district)
    : null;
  const primaryParentSDSupport = primaryParentSD
    ? senateNestedSupport.get(primaryParentSD.district)
    : undefined;

  const nestedPrimaryHDs =
    chamber === "Senate"
      ? nestedHouseDistricts.filter((n) => n.overlapShareOfHD >= 0.5)
      : [];

  // Group items by bill so multiple procedural votes (committee + floor)
  // on the same bill cluster under one bill header. Each group preserves
  // chronological order (oldest first) so a Nay → Yea flip is visible.
  const itemsByBill = new Map<string, MapItem[]>();
  for (const item of itemsForChamber) {
    const billId = getMapItemBill(item).id;
    if (!itemsByBill.has(billId)) itemsByBill.set(billId, []);
    itemsByBill.get(billId)!.push(item);
  }
  const itemDate = (item: MapItem) =>
    item.kind === "rollCall" ? item.rollCall.date : "0";
  for (const arr of itemsByBill.values()) {
    arr.sort((a, b) => itemDate(a).localeCompare(itemDate(b)));
  }

  const phaseLabel = (item: MapItem): string => {
    const rc = getMapItemRollCall(item);
    if (!rc) return "Cosponsors only";
    // Honor a custom stage label (e.g. "Final Passage") when present
    // so the per-bill vote table mirrors the BillSelector menu.
    if (rc.stage) return `${rc.stage} (${formatShortDate(rc.date)})`;
    // Name the specific committee ("Urban Affairs & Housing" etc.)
    // instead of generic "Committee", matching the dropdown.
    if (rc.committee) {
      const short = rc.committee.replace(/ and /g, " & ");
      return `${short} (${formatShortDate(rc.date)})`;
    }
    return `Floor (${formatShortDate(rc.date)})`;
  };
  const phaseIsBold = (item: MapItem): boolean => {
    const rc = getMapItemRollCall(item);
    return rc?.stageEmphasis === "bold";
  };

  return (
    <div className="popup" role="dialog" aria-label={`District ${district}`}>
      <div className="popup__header">
        <button
          type="button"
          className="popup__close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
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

      {itemsByBill.size > 0 && (
        <div className="popup__section">
          <div className="popup__section-title">
            {chamber === "Senate" ? "Senate bills" : "Bills tracked"}
          </div>
          {Array.from(itemsByBill.entries()).map(([billId, billItems]) => {
            const bill = getMapItemBill(billItems[0]);
            const isHistorical = bill.session === "2023-2024";
            // Track prior vote within the bill to flag flips
            // ("Nay" → "Yea" between procedural stages is politically salient).
            let priorVote: string | null = null;
            return (
              <div
                key={billId}
                className={`popup__bill-group${isHistorical ? " popup__bill-group--historical" : ""}`}
              >
                <div className="popup__bill-label">
                  <strong>{bill.label}</strong>{" "}
                  <span className="popup__bill-title">{bill.shortTitle}</span>
                  {isHistorical && (
                    <span className="popup__past-session-tag">Past session</span>
                  )}
                </div>
                {bill.description && (
                  <div className="popup__bill-brief">
                    {briefSentence(bill.description)}{" "}
                    <a
                      href={`/#bill-${bill.id.toLowerCase()}`}
                      className="popup__bill-link"
                    >
                      More info ↓
                    </a>
                  </div>
                )}
                <table className="popup__votes">
                  <tbody>
                    {billItems.map((item) => {
                      const rc = getMapItemRollCall(item);
                      const v = rc && member ? findVote(rc, member.id) : undefined;
                      const cs = cosponsorInfoForItem(item, district);
                      const flipped =
                        v && priorVote && v.vote !== priorVote;
                      if (v) priorVote = v.vote;
                      // For historical bills, surface the recorded
                      // cosponsor name when it differs from the
                      // current member — otherwise people will read
                      // "Picozzi cosponsored SB 1126" when actually
                      // Dillon did (the seat flipped in 2024).
                      const showPredecessor =
                        cs.isCosponsor &&
                        cs.recordedName &&
                        member &&
                        cs.recordedName !== member.fullName;
                      return (
                        <tr key={getMapItemId(item)}>
                          <td
                            className={`popup__phase-cell${
                              phaseIsBold(item)
                                ? " popup__phase-cell--bold"
                                : ""
                            }`}
                          >
                            {phaseLabel(item)}
                          </td>
                          <td className="popup__pill-cell">
                            {v ? (
                              <>
                                <span
                                  className="popup__vote-pill"
                                  style={{ background: VOTE_COLORS[v.vote] }}
                                >
                                  {v.vote}
                                </span>
                                {flipped && (
                                  <span className="popup__flip-flag">
                                    flipped
                                  </span>
                                )}
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
                            {showPredecessor && (
                              <div className="popup__predecessor">
                                {cs.recordedName}
                                {cs.recordedParty && (
                                  <>
                                    {" ("}
                                    <span
                                      className={`popup__party popup__party--${cs.recordedParty.toLowerCase()}`}
                                    >
                                      {cs.recordedParty}
                                    </span>
                                    {", then-rep)"}
                                  </>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}

      {chamber === "House" && primaryParentSD && (
        <div className="popup__section popup__nesting">
          <div className="popup__section-title">Senate context</div>
          <div className="popup__nesting-body">
            Nested in{" "}
            <strong>
              SD-{primaryParentSD.district}
              {primaryParentSDSenator && (
                <>
                  {" — "}
                  <span
                    className={`popup__party popup__party--${primaryParentSDSenator.party.toLowerCase()}`}
                  >
                    {primaryParentSDSenator.party}
                  </span>{" "}
                  {primaryParentSDSenator.fullName}
                </>
              )}
            </strong>
            .
            {activeItem && primaryParentSDSupport && primaryParentSDSupport.total > 0 && (
              <>
                {" "}
                {primaryParentSDSupport.yea + primaryParentSDSupport.cosponsor}
                /{primaryParentSDSupport.total} of the nested House districts
                {activeItem.kind === "rollCall"
                  ? " voted Yea or cosponsored "
                  : " cosponsor "}
                {getMapItemBill(activeItem).label}.
              </>
            )}
          </div>
        </div>
      )}

      {chamber === "Senate" && nestedPrimaryHDs.length > 0 && (
        <div className="popup__section popup__nesting">
          <div className="popup__section-title">
            Nested House delegation ({nestedPrimaryHDs.length})
          </div>
          <ul className="popup__nested-hds">
            {nestedPrimaryHDs.map((n) => {
              const hdSnap = houseSnapshots.get(n.district);
              const hdMember = getMemberByDistrict("House", n.district);
              const name = hdMember?.fullName ?? "Vacant";
              const party = hdMember?.party ?? null;
              const vote = hdSnap?.vote ?? null;
              const isCosponsor = hdSnap?.isCosponsor ?? false;
              return (
                <li key={n.district}>
                  <span className="popup__nested-hd-id">HD-{n.district}</span>
                  {party && (
                    <span
                      className={`popup__party popup__party--${party.toLowerCase()}`}
                    >
                      {party}
                    </span>
                  )}
                  <span className="popup__nested-hd-name">{name}</span>
                  <span className="popup__nested-hd-state">
                    {vote ? (
                      <span
                        className="popup__vote-pill"
                        style={{ background: VOTE_COLORS[vote] }}
                      >
                        {vote}
                      </span>
                    ) : isCosponsor ? (
                      <span
                        className="popup__vote-pill"
                        style={{ background: COSPONSOR_FILL }}
                      >
                        Cosponsor
                      </span>
                    ) : (
                      <span className="popup__vote-pill popup__vote-pill--none">
                        —
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
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

      {hasHousingFacts && (
        <div className="popup__section">
          <div className="popup__section-title">Housing context</div>
          <dl className="popup__facts popup__facts--housing">
            {permitsPer1kPerYear !== null && (
              <div>
                <dt>Permitted housing units</dt>
                <dd>
                  {permitsPer1kPerYear.toFixed(1)} per 1,000 residents / yr
                  <span className="popup__facts-source">2020-2024 avg</span>
                </dd>
              </div>
            )}
            {medianHomeValue !== null && (
              <div>
                <dt>Median home value</dt>
                <dd>{fmtUsdShort(medianHomeValue)}</dd>
              </div>
            )}
            {medianIncome !== null && (
              <div>
                <dt>Median household income</dt>
                <dd>{fmtUsdShort(medianIncome)}</dd>
              </div>
            )}
            {rentBurdenedPct !== null && (
              <div>
                <dt>Rent-burdened</dt>
                <dd>{Math.round(rentBurdenedPct)}%</dd>
              </div>
            )}
            {ownerBurdenedPct !== null && (
              <div>
                <dt>Owner-burdened</dt>
                <dd>{Math.round(ownerBurdenedPct)}%</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {(() => {
        const hasGeoDetail =
          topCounties.length > 0 ||
          topMunis.length > 0 ||
          sortedClasses.length > 0;
        if (!hasGeoDetail) return null;
        const geoBody = (
          <>
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
                <div className="popup__cross-link">
                  <a
                    href={`/housing-stats?${chamber === "Senate" ? "senate" : "house"}=${district}`}
                  >
                    See per-muni housing stats for{" "}
                    {chamber === "Senate" ? "SD" : "HD"}-{district} →
                  </a>
                </div>
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
          </>
        );
        if (isCompact) {
          return (
            <details className="popup__geo-details">
              <summary className="popup__geo-summary">
                Geographic detail
              </summary>
              {geoBody}
            </details>
          );
        }
        return geoBody;
      })()}
    </div>
  );
};
