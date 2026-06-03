import type { Cosponsorship } from "@/lib/types";

/**
 * House Memo 47776 — Building More Homes Near Transit (Inglis).
 * Cosponsors per palegis.us memo page, fetched 2026-06-02.
 */
export const HOUSE_MEMO_47776_COSPONSORSHIP: Cosponsorship = {
  billId: "house-memo-47776",
  primeSponsor: { name: "John Inglis III", district: "38", party: "D" },
  cosponsors: [
    { name: "Tarik Khan", district: "194", party: "D" },
    { name: "Greg Scott", district: "54", party: "D" },
    { name: "Nathan Davidson", district: "103", party: "D" },
    { name: "Jared Solomon", district: "202", party: "D" },
    { name: "Lindsay Powell", district: "21", party: "D" },
    { name: "Ismail Smith-Wade-El", district: "49", party: "D" },
  ],
};
