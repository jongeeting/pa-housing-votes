import type { Bill, BillTopic } from "./types";

export const TOPIC_LABEL: Record<BillTopic, string> = {
  adu: "Accessory Dwellings",
  missing_middle: "Missing Middle (small apartments in single-family-only zones)",
  commercial_conversion: "Office / Commercial Conversion",
  tod: "Transit-Oriented Development",
  parking: "Parking Reform",
  occupancy: "Occupancy Reform",
  single_stair: "Single-Stair Reform",
  governance: "Governance & Studies",
  funding: "Funding & Grants",
  workforce: "Workforce Training",
  study: "Governance & Studies",
};

/** Display order — strategic first, supporting / context last. */
export const TOPIC_ORDER: BillTopic[] = [
  "adu",
  "missing_middle",
  "commercial_conversion",
  "tod",
  "parking",
  "occupancy",
  "single_stair",
  "funding",
  "governance",
  "workforce",
  "study",
];

export interface BillTopicGroup {
  topic: BillTopic;
  topicLabel: string;
  bills: Bill[];
}

/**
 * Pick the primary topic for a bill — the highest-priority entry from
 * its topics list per TOPIC_ORDER. Used when a bill has multiple
 * topics and we need to assign it to one bucket.
 */
export const primaryTopic = (bill: Bill): BillTopic => {
  const sorted = [...new Set(bill.topics)].sort(
    (a, b) => TOPIC_ORDER.indexOf(a) - TOPIC_ORDER.indexOf(b),
  );
  return sorted[0] ?? "governance";
};

/**
 * Group bills by their primary topic. Current bills first, historical
 * bills at the end of each group. "study" merges into "governance" for
 * display.
 */
export const groupBillsByTopic = (bills: Bill[]): BillTopicGroup[] => {
  const byTopic = new Map<BillTopic, Bill[]>();
  for (const b of bills) {
    const t = primaryTopic(b);
    if (!byTopic.has(t)) byTopic.set(t, []);
    byTopic.get(t)!.push(b);
  }
  // Merge "study" into "governance".
  if (byTopic.has("study")) {
    const studyBills = byTopic.get("study")!;
    byTopic.set("governance", [
      ...(byTopic.get("governance") ?? []),
      ...studyBills,
    ]);
    byTopic.delete("study");
  }
  // Within each topic: current first (by introducedDate desc), then
  // historical at the bottom.
  for (const arr of byTopic.values()) {
    arr.sort((a, b) => {
      const aHist = a.session === "2023-2024";
      const bHist = b.session === "2023-2024";
      if (aHist !== bHist) return aHist ? 1 : -1;
      const aDate = a.lastActionDate ?? a.introducedDate ?? "0";
      const bDate = b.lastActionDate ?? b.introducedDate ?? "0";
      return bDate.localeCompare(aDate);
    });
  }
  return TOPIC_ORDER.filter((t) => t !== "study")
    .filter((t) => byTopic.has(t))
    .map((t) => ({
      topic: t,
      topicLabel: TOPIC_LABEL[t],
      bills: byTopic.get(t)!,
    }));
};
