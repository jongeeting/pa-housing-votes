import type { Cosponsorship } from "@/lib/types";

/**
 * Senate Memo 47956 — Single-Exit Stairwells (Street).
 * Cosponsors per palegis.us memo page, fetched 2026-04-20.
 */
export const SENATE_MEMO_47956_COSPONSORSHIP: Cosponsorship = {
  billId: "senate-memo-47956",
  primeSponsor: { name: "Sharif Street", district: "3", party: "D" },
  cosponsors: [
    { name: "Nikil Saval", district: "1", party: "D" },
    { name: "Anthony Hardy Williams", district: "8", party: "D" },
    { name: "Lisa Boscola", district: "18", party: "D" },
  ],
};
