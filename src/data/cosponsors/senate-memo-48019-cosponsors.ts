import type { Cosponsorship } from "@/lib/types";

/**
 * Senate Memo 48019 — Rothman/Saval ADU Reform.
 * Senate companion to HB 2186. Cosponsors per palegis.us memo page, fetched 2026-04-20.
 */
export const SENATE_MEMO_48019_COSPONSORSHIP: Cosponsorship = {
  billId: "senate-memo-48019",
  primeSponsor: { name: "Greg Rothman", district: "34", party: "R" },
  cosponsors: [
    { name: "Daniel Laughlin", district: "49", party: "R" },
    { name: "Nikil Saval", district: "1", party: "D" },
    { name: "Timothy Kearney", district: "26", party: "D" },
  ],
};
