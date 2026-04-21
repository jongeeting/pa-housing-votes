import type { Cosponsorship } from "@/lib/types";

/**
 * HB 2045 (2023–24) — Duplex/Triplex/Quadplex in SFH Areas (Siegel).
 * Cosponsors per palegis.us bill info page, fetched 2026-04-20.
 * Prime sponsor Siegel left office to run for Lehigh County Executive;
 * successor in HD-22 is Ana Tiburcio.
 */
export const HB2045_COSPONSORSHIP: Cosponsorship = {
  billId: "HB2045",
  primeSponsor: { name: "Joshua Siegel", district: "22", party: "D" },
  cosponsors: [
    { name: "Tarik Khan", district: "194", party: "D" },
    { name: "Dave Madsen", district: "104", party: "D" },
    { name: "Napoleon J. Nelson", district: "154", party: "D" },
    { name: "Benjamin Sanchez", district: "153", party: "D" },
    { name: "Carol Hill-Evans", district: "95", party: "D" },
    { name: "Heather Boyd", district: "163", party: "D" },
    { name: "G. Roni Green", district: "190", party: "D" },
    { name: "MaryLouise Isaacson", district: "175", party: "D" },
    { name: "Ismail Smith-Wade-El", district: "49", party: "D" },
    { name: "Greg Scott", district: "54", party: "D" },
    { name: "Dan Frankel", district: "23", party: "D" },
  ],
};
