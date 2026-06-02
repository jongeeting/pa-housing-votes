import type { Cosponsorship } from "@/lib/types";

/**
 * SB1278 cosponsorship.
 *
 * Introducer list per palegis bill PDF (introduced 2026-04-14).
 * If palegis adds further cosponsors after introduction, they should
 * be appended here.
 */
export const SB1278_COSPONSORSHIP: Cosponsorship = {
  billId: "SB1278",
  primeSponsor: { name: "Joe Picozzi", district: "5", party: "R" },
  cosponsors: [
    { name: "Patrick J. Stefano", district: "32", party: "R" },
    { name: "Lisa M. Boscola", district: "18", party: "D" },
    { name: "Steven J. Santarsiero", district: "10", party: "D" },
  ],
};
