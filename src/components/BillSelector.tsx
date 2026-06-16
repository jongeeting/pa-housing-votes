import { useEffect, useRef, useState } from "react";
import type { BillTopic, MapItem } from "@/lib/types";
import {
  getMapItemBill,
  getMapItemChamber,
  getMapItemId,
  getMapItemRollCall,
} from "@/lib/voteAggregation";
import { TOPIC_LABEL, TOPIC_ORDER } from "@/lib/billGroups";

interface Props {
  items: MapItem[];
  /** Currently selected item id, or null for "Just explore the map" mode. */
  selectedId: string | null;
  onChange: (id: string | null) => void;
}

export const EXPLORE_ID = "__explore__";

interface BillBucket {
  billId: string;
  billLabel: string;
  shortTitle: string;
  chamber: string;
  isHistorical: boolean;
  items: MapItem[]; // chronological (oldest first)
}

interface TopicGroup {
  topic: BillTopic;
  topicLabel: string;
  bills: BillBucket[];
}

const itemDate = (item: MapItem) =>
  item.kind === "rollCall" ? item.rollCall.date : "0";

/**
 * Rank used to sort + style items inside a bill's row stack. Higher
 * = more prominent. The dropdown lists items in rank order (Final
 * Passage at the top, then other floor votes, then committee, then
 * cosponsor-only) so the headline action shows first, not last.
 *
 *   4 — Final Passage / 3rd-consideration final, or any bill whose
 *       site-record status is past chamber (passed_chamber,
 *       other_chamber, conference, enacted) — these are the
 *       headline-action items even when we don't have a TS file
 *       for the floor vote itself.
 *   3 — Other floor activity (2nd consideration, amendment, etc.),
 *       or a bill whose status is passed_2nd_consideration but
 *       has no detailed floor-vote file.
 *   2 — Committee vote, or a bill that's in_committee / out of
 *       committee without a more recent floor vote on file.
 *   1 — Cosponsor-only — bill is in memo/introduced state, or this
 *       is a memo with no successor bill.
 */
const itemRank = (item: MapItem): number => {
  const rc = getMapItemRollCall(item);
  if (rc) {
    const stage = (rc.stage ?? "").toLowerCase();
    if (
      stage.includes("final passage") ||
      stage.includes("third consideration") ||
      stage.includes("3rd consideration")
    ) {
      return 4;
    }
    if (rc.committee) return 2;
    // Anything else with a roll call is some floor action (2nd cons,
    // amendment, motion). Treat as rank 3.
    return 3;
  }
  // Cosponsor-only item: rank by the bill's site-record status so the
  // dropdown stays in sync with the bill cards. A bill that the
  // tracker shows as "Passed Senate" should look like a headline
  // item in the dropdown even if we never created a TS file for the
  // Senate floor vote (per skill convention, Senate floor votes are
  // informational and don't get per-vote files).
  const status = getMapItemBill(item).status;
  if (
    status === "passed_chamber" ||
    status === "other_chamber" ||
    status === "conference" ||
    status === "enacted"
  ) {
    return 4;
  }
  if (status === "passed_2nd_consideration") return 3;
  if (status === "passed_committee" || status === "in_committee") return 2;
  return 1;
};

const buildTopicGroups = (items: MapItem[]): TopicGroup[] => {
  // Bill bucketing — collapse procedural votes under the same bill.
  const billMap = new Map<string, BillBucket>();
  for (const item of items) {
    const bill = getMapItemBill(item);
    const billId = bill.id;
    if (!billMap.has(billId)) {
      billMap.set(billId, {
        billId,
        billLabel: bill.label,
        shortTitle: bill.shortTitle,
        chamber: getMapItemChamber(item),
        isHistorical: bill.session === "2023-2024",
        items: [],
      });
    }
    billMap.get(billId)!.items.push(item);
  }
  // Sort items within a bill by rank (desc), then by date (desc). So
  // Final Passage shows above 2nd Consideration shows above Committee
  // shows above any cosponsor-only entry. Date breaks ties within a
  // single rank (e.g. two committee votes on different dates).
  for (const b of billMap.values()) {
    b.items.sort((a, b) => {
      const rankDelta = itemRank(b) - itemRank(a);
      if (rankDelta !== 0) return rankDelta;
      return itemDate(b).localeCompare(itemDate(a));
    });
  }

  // Group bills by their first topic (each bill goes in exactly one
  // bucket — multi-topic bills land in the highest-priority topic per
  // TOPIC_ORDER).
  const topicMap = new Map<BillTopic, BillBucket[]>();
  for (const bucket of billMap.values()) {
    const billTopics = items
      .filter((i) => getMapItemBill(i).id === bucket.billId)
      .flatMap((i) => getMapItemBill(i).topics);
    // Pick the highest-priority topic the bill has.
    const sortedTopics = [...new Set(billTopics)].sort(
      (a, b) => TOPIC_ORDER.indexOf(a) - TOPIC_ORDER.indexOf(b),
    );
    const primary = sortedTopics[0] ?? "governance";
    if (!topicMap.has(primary)) topicMap.set(primary, []);
    topicMap.get(primary)!.push(bucket);
  }

  // Merge "study" into "governance" for display purposes.
  if (topicMap.has("study")) {
    const studyBills = topicMap.get("study")!;
    topicMap.set(
      "governance",
      [...(topicMap.get("governance") ?? []), ...studyBills],
    );
    topicMap.delete("study");
  }

  // Within a topic: current bills first (by most-recent activity date),
  // then historical at the bottom.
  for (const bucketArr of topicMap.values()) {
    bucketArr.sort((a, b) => {
      if (a.isHistorical !== b.isHistorical) return a.isHistorical ? 1 : -1;
      const aLatest = a.items.length
        ? itemDate(a.items[a.items.length - 1])
        : "0";
      const bLatest = b.items.length
        ? itemDate(b.items[b.items.length - 1])
        : "0";
      return bLatest.localeCompare(aLatest);
    });
  }

  return TOPIC_ORDER.filter((t) => t !== "study")
    .filter((t) => topicMap.has(t))
    .map((t) => ({
      topic: t,
      topicLabel: TOPIC_LABEL[t],
      bills: topicMap.get(t)!,
    }));
};

const phaseTag = (item: MapItem): string => {
  const rc = getMapItemRollCall(item);
  if (rc) {
    // Custom stage label (e.g. "2nd Consideration", "Final Passage")
    // takes precedence so multiple floor votes on one bill can be
    // distinguished beyond their dates.
    if (rc.stage) return `${rc.stage} · ${rc.date}`;
    if (rc.committee) return `Committee · ${rc.date}`;
    return `Floor · ${rc.date}`;
  }
  // Cosponsor-only item: derive the label from the bill's site-record
  // status so the dropdown matches the bill card. Mirrors the
  // chamber-aware label logic in BillCard.astro::statusLabel().
  const bill = getMapItemBill(item);
  const chamber = bill.chamber;
  const otherChamber = chamber === "Senate" ? "House" : "Senate";
  switch (bill.status) {
    case "passed_chamber": return `Passed ${chamber}`;
    case "other_chamber": return `In ${otherChamber}`;
    case "conference": return "In conference";
    case "enacted": return "Enacted";
    case "passed_2nd_consideration": return `Passed ${chamber} 2nd cons`;
    case "passed_committee": return `Out of ${chamber} committee`;
    case "in_committee": return `In ${chamber} committee`;
    case "laid_on_table": return "Laid on the table";
    case "dead": return "Dead (last session)";
    // memo, introduced — fall through to the generic label, which is
    // the right phrasing for a memo or freshly-introduced bill where
    // cosponsorship is the only signal we have.
    case "memo":
    case "introduced":
    default:
      return "Cosponsors only";
  }
};

const tally = (item: MapItem): string => {
  const rc = getMapItemRollCall(item);
  if (rc) {
    return `${rc.totals.yea}-${rc.totals.nay}${
      rc.totals.notVoting > 0 ? ` (${rc.totals.notVoting} NV)` : ""
    }`;
  }
  if (item.kind === "cosponsorOnly") {
    const n = item.cosponsorship.cosponsors.length + 1;
    return `${n} sponsor${n === 1 ? "" : "s"}`;
  }
  return "";
};

interface SelectedDescriptor {
  bill: { label: string; shortTitle: string };
  chamber: string;
  topicLabel: string;
  phase: string;
  tally: string;
  isHistorical: boolean;
}

const describeSelected = (
  items: MapItem[],
  selectedId: string | null,
  groups: TopicGroup[],
): SelectedDescriptor | null => {
  if (!selectedId) return null;
  const item = items.find((i) => getMapItemId(i) === selectedId);
  if (!item) return null;
  const bill = getMapItemBill(item);
  // Find topic label by looking up the bill in the groups
  let topicLabel = "Bill";
  for (const g of groups) {
    if (g.bills.some((b) => b.billId === bill.id)) {
      topicLabel = g.topicLabel;
      break;
    }
  }
  return {
    bill: { label: bill.label, shortTitle: bill.shortTitle },
    chamber: getMapItemChamber(item),
    topicLabel,
    phase: phaseTag(item),
    tally: tally(item),
    isHistorical: bill.session === "2023-2024",
  };
};

export const BillSelector = ({ items, selectedId, onChange }: Props) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Close on outside click + Escape.
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const groups = buildTopicGroups(items);
  const selected = describeSelected(items, selectedId, groups);

  const pick = (id: string | null) => {
    onChange(id);
    setOpen(false);
  };

  return (
    <div className="bill-selector" ref={rootRef}>
      <button
        type="button"
        className="bill-selector__current"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Choose a bill to view on the map"
      >
        {selected ? (
          <>
            <span className="bill-selector__current-caption">
              {selected.topicLabel} · {selected.chamber} ·{" "}
              <span className="bill-selector__current-phase">
                {selected.phase} · {selected.tally}
              </span>
              {selected.isHistorical && " · Past session"}
            </span>
            <span
              className={`bill-selector__current-bill${selected.isHistorical ? " bill-selector__current-bill--historical" : ""}`}
            >
              <strong>{selected.bill.label}</strong> {selected.bill.shortTitle}
            </span>
          </>
        ) : (
          <>
            <span className="bill-selector__current-caption">
              Explore mode · click to pick a bill
            </span>
            <span className="bill-selector__current-bill">
              No bill selected — just exploring the map
            </span>
          </>
        )}
        <span className="bill-selector__chevron" aria-hidden="true">
          {open ? "Close ▴" : "Change ▾"}
        </span>
      </button>

      {open && (
        <div className="bill-selector__menu" role="listbox">
          <button
            type="button"
            className={`bill-selector__option bill-selector__option--explore${
              selectedId === null ? " is-active" : ""
            }`}
            onClick={() => pick(null)}
          >
            <span className="bill-selector__option-bill">
              Just explore the map
            </span>
            <span className="bill-selector__option-meta">
              No bill — county / muni layers only
            </span>
          </button>

          {groups.map((g) => (
            <div className="bill-selector__group" key={g.topic}>
              <div className="bill-selector__group-title">{g.topicLabel}</div>
              {g.bills.map((bucket) => (
                <div
                  className={`bill-selector__bill-block${bucket.isHistorical ? " bill-selector__bill-block--historical" : ""}`}
                  key={bucket.billId}
                >
                  <div className="bill-selector__bill-row">
                    <strong>{bucket.billLabel}</strong>{" "}
                    <span
                      className={`bill-selector__bill-shortTitle${bucket.isHistorical ? " bill-selector__bill-shortTitle--historical" : ""}`}
                    >
                      {bucket.shortTitle}
                    </span>
                    {bucket.isHistorical && (
                      <span className="bill-selector__past-session-tag">
                        Past session
                      </span>
                    )}
                    <span className="bill-selector__bill-chamber">
                      {bucket.chamber}
                      {bucket.isHistorical ? " · 2023-24" : ""}
                    </span>
                  </div>
                  {bucket.items.map((item) => {
                    const id = getMapItemId(item);
                    const active = id === selectedId;
                    const rank = itemRank(item);
                    return (
                      <button
                        key={id}
                        type="button"
                        role="option"
                        aria-selected={active}
                        className={`bill-selector__option bill-selector__option--rank-${rank}${active ? " is-active" : ""}`}
                        onClick={() => pick(id)}
                      >
                        <span className="bill-selector__option-phase">
                          {phaseTag(item)}
                        </span>
                        <span className="bill-selector__option-tally">
                          {tally(item)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
