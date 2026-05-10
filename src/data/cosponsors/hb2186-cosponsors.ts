import type { Cosponsorship } from "@/lib/types";

/**
 * HB 2186 — Accessory Dwelling Units.
 *
 * Cosponsors per the PN 3373 introducer list (post-second-consideration,
 * 2026-05-06). Differs from the PN 3173 introducer list captured 2026-04-14:
 * Sean Dougherty (HD-172) added; Robert Freeman (HD-136) removed. Freeman
 * still voted Yea on the floor vote despite dropping his cosponsorship.
 */
export const HB2186_COSPONSORSHIP: Cosponsorship = {
  billId: "HB2186",
  primeSponsor: { name: "John Inglis III", district: "38", party: "D" },
  cosponsors: [
    { name: "Tarik Khan", district: "194", party: "D" },
    { name: "Greg Scott", district: "54", party: "D" },
    { name: "Nathan Davidson", district: "103", party: "D" },
    { name: "Jared Solomon", district: "202", party: "D" },
    { name: "David Zimmerman", district: "99", party: "R" },
    { name: "Ismail Smith-Wade-El", district: "49", party: "D" },
    { name: "Lindsay Powell", district: "21", party: "D" },
    { name: "Liz Hanbidge", district: "61", party: "D" },
    { name: "Danielle Friel Otten", district: "155", party: "D" },
    { name: "Ben Waxman", district: "182", party: "D" },
    { name: "Dan Williams", district: "74", party: "D" },
    { name: "Joe Ciresi", district: "146", party: "D" },
    { name: "La'Tasha Mayes", district: "24", party: "D" },
    { name: "Johanny Cepeda-Freytiz", district: "129", party: "D" },
    { name: "Maureen Madden", district: "115", party: "D" },
    { name: "Keith Harris", district: "195", party: "D" },
    { name: "Gina Curry", district: "164", party: "D" },
    { name: "Jen Mazzocco", district: "42", party: "D" },
    { name: "Joe Hogan", district: "142", party: "R" },
    { name: "Sean Dougherty", district: "172", party: "D" },
  ],
};
