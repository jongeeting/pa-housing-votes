import type { Cosponsorship } from "@/lib/types";

/**
 * SB1277 cosponsorship.
 *
 * Introducer list per palegis bill PDF (introduced 2026-04-23).
 * If palegis adds further cosponsors after introduction, they should
 * be appended here.
 */
export const SB1277_COSPONSORSHIP: Cosponsorship = {
  billId: "SB1277",
  primeSponsor: { name: "Patrick J. Stefano", district: "32", party: "R" },
  cosponsors: [
    { name: "Greg Rothman", district: "34", party: "R" },
    { name: "Joe Picozzi", district: "5", party: "R" },
    { name: "Cris Dush", district: "25", party: "R" },
    { name: "Wayne D. Fontana", district: "42", party: "D" },
    { name: "Daniel Laughlin", district: "49", party: "R" },
  ],
};
