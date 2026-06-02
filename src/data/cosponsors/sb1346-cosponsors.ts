import type { Cosponsorship } from "@/lib/types";

/**
 * SB 1346 — Accessory Dwelling Units (Senate companion to HB 2186).
 *
 * Bipartisan 12-senator introducer list as printed on PN 1747
 * (introduced May 26, 2026 and referred to Urban Affairs and Housing
 * the same day). 7 Democrats + 5 Republicans.
 *
 * If palegis adds further cosponsors after introduction, they should
 * be appended here.
 */
export const SB1346_COSPONSORSHIP: Cosponsorship = {
  billId: "SB1346",
  primeSponsor: { name: "Greg Rothman", district: "34", party: "R" },
  cosponsors: [
    // Democratic cosponsors
    { name: "Nikil Saval", district: "1", party: "D" },
    { name: "Christine Tartaglione", district: "2", party: "D" },
    { name: "Art Haywood", district: "4", party: "D" },
    { name: "Wayne Fontana", district: "42", party: "D" },
    { name: "Amanda Cappelletti", district: "17", party: "D" },
    { name: "Timothy Kearney", district: "26", party: "D" },
    { name: "James Malone", district: "36", party: "D" },
    // Republican cosponsors
    { name: "David Argall", district: "29", party: "R" },
    { name: "Elder Vogel", district: "47", party: "R" },
    { name: "Tracy Pennycuick", district: "24", party: "R" },
    { name: "Patrick Stefano", district: "32", party: "R" },
  ],
};
