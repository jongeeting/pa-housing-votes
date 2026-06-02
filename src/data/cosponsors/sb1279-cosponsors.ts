import type { Cosponsorship } from "@/lib/types";

/**
 * SB1279 cosponsorship.
 *
 * Introducer list per palegis bill PDF (introduced 2026-04-14).
 * If palegis adds further cosponsors after introduction, they should
 * be appended here.
 */
export const SB1279_COSPONSORSHIP: Cosponsorship = {
  billId: "SB1279",
  primeSponsor: { name: "Kristin Phillips-Hill", district: "28", party: "R" },
  cosponsors: [
    { name: "Cris Dush", district: "25", party: "R" },
    { name: "Greg Rothman", district: "34", party: "R" },
    { name: "Joe Picozzi", district: "5", party: "R" },
    { name: "Patrick J. Stefano", district: "32", party: "R" },
  ],
};
