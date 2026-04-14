import type { Member } from "@/lib/types";

/**
 * House Housing & Urban Affairs committee, 2025–2026 session.
 *
 * 14 Democrats + 12 Republicans = 26 total members.
 *
 * !!  ACTION REQUIRED  !!
 * District numbers are intentionally left as empty strings until they
 * are verified. Paste each member's PA House district number into the
 * `district` field below, then re-run `bun run dev`. The map will
 * automatically color those districts as soon as the value is non-empty.
 *
 * Easiest source for district lookup:
 *   https://www.legis.state.pa.us/cfdocs/legis/home/member_information/representatives.cfm
 *
 * Member ID format: "house-2025-<district>-<lastname-lower-kebab>"
 * Update the IDs after filling in districts so they stay descriptive.
 */
export const HOUSING_COMMITTEE_MEMBERS_2025: Member[] = [
  // ----- Democrats (Majority) -----
  {
    id: "house-2025-markosek",
    fullName: "Brandon Markosek",
    lastName: "Markosek",
    party: "D",
    chamber: "House",
    district: "", // TODO: fill in (Chair)
  },
  {
    id: "house-2025-abney",
    fullName: "Aerion Abney",
    lastName: "Abney",
    party: "D",
    chamber: "House",
    district: "",
  },
  {
    id: "house-2025-boyd",
    fullName: "Heather Boyd",
    lastName: "Boyd",
    party: "D",
    chamber: "House",
    district: "",
  },
  {
    id: "house-2025-brown",
    fullName: "Amen Brown",
    lastName: "Brown",
    party: "D",
    chamber: "House",
    district: "",
  },
  {
    id: "house-2025-cephas",
    fullName: "Morgan Cephas",
    lastName: "Cephas",
    party: "D",
    chamber: "House",
    district: "",
  },
  {
    id: "house-2025-green",
    fullName: "G. Roni Green",
    lastName: "Green",
    party: "D",
    chamber: "House",
    district: "",
  },
  {
    id: "house-2025-krajewski",
    fullName: "Rick Krajewski",
    lastName: "Krajewski",
    party: "D",
    chamber: "House",
    district: "",
  },
  {
    id: "house-2025-madsen",
    fullName: "Dave Madsen",
    lastName: "Madsen",
    party: "D",
    chamber: "House",
    district: "",
  },
  {
    id: "house-2025-mayes",
    fullName: "La'Tasha Mayes",
    lastName: "Mayes",
    party: "D",
    chamber: "House",
    district: "",
  },
  {
    id: "house-2025-powell",
    fullName: "Lindsay Powell",
    lastName: "Powell",
    party: "D",
    chamber: "House",
    district: "",
  },
  {
    id: "house-2025-probst",
    fullName: "Tarah Probst",
    lastName: "Probst",
    party: "D",
    chamber: "House",
    district: "",
  },
  {
    id: "house-2025-smith-wade-el",
    fullName: "Ismail Smith-Wade-El",
    lastName: "Smith-Wade-El",
    party: "D",
    chamber: "House",
    district: "",
  },
  {
    id: "house-2025-tiburcio",
    fullName: "Ana Tiburcio",
    lastName: "Tiburcio",
    party: "D",
    chamber: "House",
    district: "",
  },
  {
    id: "house-2025-waxman",
    fullName: "Ben Waxman",
    lastName: "Waxman",
    party: "D",
    chamber: "House",
    district: "",
  },

  // ----- Republicans (Minority) -----
  {
    id: "house-2025-irvin",
    fullName: "Rich Irvin",
    lastName: "Irvin",
    party: "R",
    chamber: "House",
    district: "", // TODO: fill in (Republican Chair)
  },
  {
    id: "house-2025-bashline",
    fullName: "Josh Bashline",
    lastName: "Bashline",
    party: "R",
    chamber: "House",
    district: "",
  },
  {
    id: "house-2025-jones",
    fullName: "Tom Jones",
    lastName: "Jones",
    party: "R",
    chamber: "House",
    district: "",
  },
  {
    id: "house-2025-kephart",
    fullName: "Dallas Kephart",
    lastName: "Kephart",
    party: "R",
    chamber: "House",
    district: "",
  },
  {
    id: "house-2025-mackenzie",
    fullName: "Milou Mackenzie",
    lastName: "Mackenzie",
    party: "R",
    chamber: "House",
    district: "",
  },
  {
    id: "house-2025-major",
    fullName: "Abby Major",
    lastName: "Major",
    party: "R",
    chamber: "House",
    district: "",
  },
  {
    id: "house-2025-rasel",
    fullName: "Brian Rasel",
    lastName: "Rasel",
    party: "R",
    chamber: "House",
    district: "",
  },
  {
    id: "house-2025-rossi",
    fullName: "Leslie Rossi",
    lastName: "Rossi",
    party: "R",
    chamber: "House",
    district: "",
  },
  {
    id: "house-2025-shaffer",
    fullName: "Jeremy Shaffer",
    lastName: "Shaffer",
    party: "R",
    chamber: "House",
    district: "",
  },
  {
    id: "house-2025-twardzik",
    fullName: "Tim Twardzik",
    lastName: "Twardzik",
    party: "R",
    chamber: "House",
    district: "",
  },
  {
    id: "house-2025-walsh",
    fullName: "Jamie Walsh",
    lastName: "Walsh",
    party: "R",
    chamber: "House",
    district: "",
  },
  {
    id: "house-2025-weaknecht",
    fullName: "Eric Weaknecht",
    lastName: "Weaknecht",
    party: "R",
    chamber: "House",
    district: "",
  },
];
