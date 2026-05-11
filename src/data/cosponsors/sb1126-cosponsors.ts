import type { Cosponsorship } from "@/lib/types";

/**
 * SB 1126 — Bipartisan Senate zoning reform omnibus (2023-2024 session).
 *
 * DiSanto's land-use reform package: ADUs, missing-middle (duplex /
 * triplex / fourplex), and manufactured housing — all amending the
 * Municipalities Planning Code. Strategic value: a bipartisan Senate
 * package that died in Urban Affairs and Housing under prior leadership.
 *
 * Cosponsors per current palegis bill page (fetched 2026-05-11).
 *
 * Note: the introduced PN 1508 (April 5, 2024) also listed Sen. Scott
 * Martin (R, SD-13); the current palegis cosponsor list shows Sen. Jimmy
 * Dillon (D, SD-5) in his place. Cosponsor lists evolve after
 * introduction — this is the current authoritative list.
 *
 * DiSanto (R, SD-15) did not seek re-election in 2024 and is no longer
 * in the Senate. Dillon (D, SD-5) was succeeded by Picozzi (R) in the
 * 2024 election — SD-5 is now the seat we're trying to move on the
 * Senate ADU bill this session.
 */
export const SB1126_COSPONSORSHIP: Cosponsorship = {
  billId: "SB1126",
  primeSponsor: { name: "John DiSanto", district: "15", party: "R" },
  cosponsors: [
    { name: "Daniel Laughlin", district: "49", party: "R" },
    { name: "Greg Rothman", district: "34", party: "R" },
    { name: "Nikil Saval", district: "1", party: "D" },
    { name: "Timothy Kearney", district: "26", party: "D" },
    { name: "Jarrett Coleman", district: "16", party: "R" },
    { name: "Scott Hutchinson", district: "21", party: "R" },
    { name: "Jimmy Dillon", district: "5", party: "D" },
  ],
};
