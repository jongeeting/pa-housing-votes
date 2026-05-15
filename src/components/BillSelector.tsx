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
  for (const b of billMap.values()) {
    b.items.sort((a, b) => itemDate(a).localeCompare(itemDate(b)));
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
  if (!rc) return "Cosponsors only";
  if (rc.committee) return `Committee · ${rc.date}`;
  return `Floor · ${rc.date}`;
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
      <div className="bill-selector__label">
        <span>Bill on the map</span>
        <span className="bill-selector__label-hint">
          {open ? "Click an option below" : "Click to switch"}
        </span>
      </div>
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
            <span className="bill-selector__current-topic">
              {selected.topicLabel} · {selected.chamber}
              {selected.isHistorical && " · Past session"}
            </span>
            <span
              className={`bill-selector__current-bill${selected.isHistorical ? " bill-selector__current-bill--historical" : ""}`}
            >
              <strong>{selected.bill.label}</strong> {selected.bill.shortTitle}
            </span>
            <span className="bill-selector__current-phase">
              {selected.phase} · {selected.tally}
            </span>
          </>
        ) : (
          <>
            <span className="bill-selector__current-topic">Explore mode</span>
            <span className="bill-selector__current-bill">
              No bill — just explore the map
            </span>
            <span className="bill-selector__current-phase">
              Click to pick a bill
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
                    return (
                      <button
                        key={id}
                        type="button"
                        role="option"
                        aria-selected={active}
                        className={`bill-selector__option${active ? " is-active" : ""}`}
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
