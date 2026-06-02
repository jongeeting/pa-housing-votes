import type { Cosponsorship } from "@/lib/types";

/**
 * SB1263 cosponsorship.
 *
 * Introducer list per palegis bill PDF (introduced 2026-04-23).
 * If palegis adds further cosponsors after introduction, they should
 * be appended here.
 */
export const SB1263_COSPONSORSHIP: Cosponsorship = {
  billId: "SB1263",
  primeSponsor: { name: "Nikil Saval", district: "1", party: "D" },
  cosponsors: [
    { name: "Art Haywood", district: "4", party: "D" },
    { name: "Vincent J. Hughes", district: "7", party: "D" },
    { name: "Nick Pisciottano", district: "45", party: "D" },
    { name: "Christine M. Tartaglione", district: "2", party: "D" },
    { name: "Timothy P. Kearney", district: "26", party: "D" },
    { name: "Maria Collett", district: "12", party: "D" },
    { name: "Patty Kim", district: "15", party: "D" },
    { name: "Amanda M. Cappelletti", district: "17", party: "D" },
    { name: "Elder A. Vogel", district: "47", party: "R" },
  ],
};
