import type { Cosponsorship } from "@/lib/types";

/**
 * SR211 cosponsorship.
 *
 * Introducer list per palegis bill PDF (introduced 2026-01-23).
 * If palegis adds further cosponsors after introduction, they should
 * be appended here.
 */
export const SR211_COSPONSORSHIP: Cosponsorship = {
  billId: "SR211",
  primeSponsor: { name: "Judith L. Schwank", district: "11", party: "D" },
  cosponsors: [
    { name: "Jay Costa", district: "43", party: "D" },
    { name: "Patty Kim", district: "15", party: "D" },
    { name: "Lisa Baker", district: "20", party: "R" },
    { name: "Steven J. Santarsiero", district: "10", party: "D" },
    { name: "Elder A. Vogel", district: "47", party: "R" },
    { name: "Wayne D. Fontana", district: "42", party: "D" },
    { name: "Lynda Schlegel Culver", district: "27", party: "R" },
    { name: "Carolyn T. Comitta", district: "19", party: "D" },
  ],
};
