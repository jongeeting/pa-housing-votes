import type { Cosponsorship } from "@/lib/types";

/**
 * SB 1239 — Residential in Commercial Zones (Coleman).
 * Cosponsors per palegis.us bill info page, fetched 2026-04-20.
 */
export const SB1239_COSPONSORSHIP: Cosponsorship = {
  billId: "SB1239",
  primeSponsor: { name: "Jarrett Coleman", district: "16", party: "R" },
  cosponsors: [
    { name: "Elder Vogel", district: "47", party: "R" },
    { name: "David Argall", district: "29", party: "R" },
    { name: "Nikil Saval", district: "1", party: "D" },
  ],
};
