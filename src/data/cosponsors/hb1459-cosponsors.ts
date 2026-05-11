import type { Cosponsorship } from "@/lib/types";

/**
 * HB 1459 — Multi-Family Housing in Office Zones (2025-2026 session).
 *
 * Reintroduction of HB 1976 from the 2023-24 session. Prime sponsor
 * Joshua Siegel resigned to run for Lehigh County Executive; Rep. John
 * Inglis III is flagged as taking over but the transfer is not yet
 * recorded on palegis as of 2026-05-11. We keep Siegel as the recorded
 * prime to match the palegis record; Inglis is in the cosponsor list.
 */
export const HB1459_COSPONSORSHIP: Cosponsorship = {
  billId: "HB1459",
  primeSponsor: { name: "Joshua Siegel", district: "22", party: "D" },
  cosponsors: [
    { name: "Danilo Burgos", district: "197", party: "D" },
    { name: "Ben Waxman", district: "182", party: "D" },
    { name: "Jose Giral", district: "180", party: "D" },
    { name: "Tarik Khan", district: "194", party: "D" },
    { name: "Benjamin Sanchez", district: "153", party: "D" },
    { name: "Kyle Donahue", district: "113", party: "D" },
    { name: "Jim Haddock", district: "118", party: "D" },
    { name: "Carol Hill-Evans", district: "95", party: "D" },
    { name: "Joe Ciresi", district: "146", party: "D" },
    { name: "Danielle Friel Otten", district: "155", party: "D" },
    { name: "Mandy Steele", district: "33", party: "D" },
    { name: "G. Roni Green", district: "190", party: "D" },
    { name: "John Inglis III", district: "38", party: "D" },
  ],
};
