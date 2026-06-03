import type { Cosponsorship } from "@/lib/types";

/**
 * HB2434 cosponsorship.
 *
 * Introducer list per palegis bill page (introduced 2026-04-21).
 * House companion in spirit to SB 1281 — both bills came out of
 * the Solomon/Hogan/Major Memo 47700 package on Pennsylvania's
 * housing shortage.
 */
export const HB2434_COSPONSORSHIP: Cosponsorship = {
  billId: "HB2434",
  primeSponsor: { name: "Jared Solomon", district: "202", party: "D" },
  cosponsors: [
    { name: "Joe Hogan", district: "142", party: "R" },
    { name: "Abby Major", district: "60", party: "R" },
    { name: "Tarik Khan", district: "194", party: "D" },
    { name: "Danilo Burgos", district: "197", party: "D" },
    { name: "Carol Hill-Evans", district: "95", party: "D" },
    { name: "Benjamin Sanchez", district: "153", party: "D" },
    { name: "Keith Harris", district: "195", party: "D" },
    { name: "Ben Waxman", district: "182", party: "D" },
    { name: "Maureen Madden", district: "115", party: "D" },
    { name: "Dave Madsen", district: "104", party: "D" },
    { name: "Pat Gallagher", district: "173", party: "D" },
    { name: "Melissa Cerrato", district: "151", party: "D" },
    { name: "Melissa Shusterman", district: "157", party: "D" },
    { name: "Ismail Smith-Wade-El", district: "49", party: "D" },
    { name: "John Inglis III", district: "38", party: "D" },
  ],
};
