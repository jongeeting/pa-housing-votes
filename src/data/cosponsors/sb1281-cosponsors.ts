import type { Cosponsorship } from "@/lib/types";

/**
 * SB1281 cosponsorship.
 *
 * Introducer list per palegis bill PDF (introduced 2026-04-14).
 * If palegis adds further cosponsors after introduction, they should
 * be appended here.
 */
export const SB1281_COSPONSORSHIP: Cosponsorship = {
  billId: "SB1281",
  primeSponsor: { name: "Greg Rothman", district: "34", party: "R" },
  cosponsors: [
    { name: "Joe Picozzi", district: "5", party: "R" },
    { name: "Patrick J. Stefano", district: "32", party: "R" },
    { name: "Daniel Laughlin", district: "49", party: "R" },
    { name: "Kristin Phillips-Hill", district: "28", party: "R" },
    { name: "Cris Dush", district: "25", party: "R" },
    { name: "Elder A. Vogel", district: "47", party: "R" },
  ],
};
