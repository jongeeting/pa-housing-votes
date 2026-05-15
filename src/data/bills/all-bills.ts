import type { Bill } from "@/lib/types";

/**
 * Every bill, resolution, and cosponsorship memo tracked by the site.
 *
 * Each entry is the bill's metadata only; cosponsors live in
 * `src/data/cosponsors/` and roll calls in `src/data/votes/`.
 *
 * Ordering is loose — the UI will group/filter by session, chamber,
 * committee, and status. Keep data entries roughly chronological
 * within each session for easy scanning here.
 */

/* -------------------------------------------------------------------------- */
/*  2023–2024 session — historical                                            */
/* -------------------------------------------------------------------------- */

export const HB1976: Bill = {
  id: "HB1976",
  label: "HB 1976",
  session: "2023-2024",
  chamber: "House",
  kind: "bill",
  shortTitle: "Multi-Family Housing in Commercial Zones",
  description:
    "Would have required municipalities to allow apartment buildings, mixed-use developments, and conversions of existing buildings in any commercially-zoned area — downtowns, office districts, malls, strip centers. Reintroduced this session as HB 1459.",
  topics: ["commercial_conversion"],
  status: "dead",
  primeSponsorDistrict: "22", // Joshua Siegel (former)
  committee: "Local Government",
  introducedDate: "2024-02-01",
  lastActionDate: "2024-09-23",
  lastActionNote:
    "Passed committee 14–11 on June 5, 2024; laid on table September 23, 2024; session ended without further action.",
  sourceUrl: "https://www.palegis.us/legislation/bills/2023/hb1976",
};

export const HB1988: Bill = {
  id: "HB1988",
  label: "HB 1988",
  session: "2023-2024",
  chamber: "House",
  kind: "bill",
  shortTitle: "Single-Stair Study via Construction Code Council",
  description:
    "Would have amended the Pennsylvania Construction Code Act so the Uniform Construction Code Review and Advisory Council could study single-exit stairwell apartment buildings — the regulatory predicate for legalizing them. Part of the 2024 Housing Affordability Bill Package. Not known to be reintroduced this session as a bill, but Senate Memo 47956 (Street) covers similar ground.",
  topics: ["single_stair", "study"],
  status: "dead",
  primeSponsorDistrict: "22", // Joshua Siegel (former)
  committee: "Housing and Community Development",
  introducedDate: "2024-01-31",
  lastActionDate: "2024-01-31",
  lastActionNote:
    "Referred to Housing & Community Development January 31, 2024; no further action before the 2023–24 session ended.",
  sourceUrl: "https://www.palegis.us/legislation/bills/2023/hb1988",
};

export const SB1126: Bill = {
  id: "SB1126",
  label: "SB 1126",
  session: "2023-2024",
  chamber: "Senate",
  kind: "bill",
  shortTitle: "Bipartisan Zoning Reform Omnibus",
  description:
    "DiSanto's omnibus bill amending the Municipalities Planning Code to legalize accessory dwelling units, duplexes/triplexes/fourplexes, and manufactured homes statewide — a bipartisan Senate land-use reform package framed as \"Housing Affordability through Land Use Reforms.\" 5 Republican + 3 Democratic cosponsors.",
  topics: ["adu", "missing_middle", "commercial_conversion"],
  status: "dead",
  primeSponsorDistrict: "15", // John DiSanto (former — did not seek re-election in 2024)
  committee: "Urban Affairs and Housing",
  introducedDate: "2024-04-05",
  lastActionDate: "2024-04-05",
  lastActionNote:
    "Referred to Urban Affairs and Housing April 5, 2024; no further action before the 2023-24 session ended.",
  sourceUrl: "https://www.palegis.us/legislation/bills/2023/sb1126",
};

export const HB2045: Bill = {
  id: "HB2045",
  label: "HB 2045",
  session: "2023-2024",
  chamber: "House",
  kind: "bill",
  shortTitle: "Duplex/Triplex/Quadplex in Single-Family-Only Zones",
  description:
    "Would have required municipalities to allow duplexes, triplexes, and quadplexes on lots currently zoned for single-family homes only — letting neighborhoods add modest density without large apartment buildings. Rep. Sappey (D-158) was the one Democratic defector. Reintroduced this session as HB 2185.",
  topics: ["missing_middle"],
  status: "dead",
  primeSponsorDistrict: "22", // Joshua Siegel (former)
  committee: "Local Government",
  introducedDate: "2024-03-15",
  lastActionDate: "2024-09-23",
  lastActionNote:
    "Passed committee 13–12 on June 5, 2024; laid on table September 23, 2024; session ended without further action.",
  sourceUrl: "https://www.palegis.us/legislation/bills/2023/hb2045",
};

/* -------------------------------------------------------------------------- */
/*  2025–2026 session — Housing & Community Development                       */
/* -------------------------------------------------------------------------- */

export const HB2109: Bill = {
  id: "HB2109",
  label: "HB 2109",
  session: "2025-2026",
  chamber: "House",
  kind: "bill",
  shortTitle: "Occupancy Reform (Golden Girls Law)",
  description:
    "Bars municipalities from capping the number of unrelated people who can live together, removing a common barrier to shared housing arrangements.",
  topics: ["occupancy"],
  status: "laid_on_table",
  primeSponsorDistrict: "194", // Tarik Khan
  committee: "Housing and Community Development",
  introducedDate: "2026-01-05",
  lastActionDate: "2026-04-13",
  lastActionNote:
    "Passed committee 19–7 April 13, 2026 (as amended); first consideration same day; laid on table pending floor scheduling.",
  sourceUrl: "https://www.palegis.us/legislation/bills/2025/hb2109",
  billTextUrl:
    "https://www.palegis.us/legislation/bills/text/PDF/2025/0/HB2109/PN3172",
};

export const HB2186: Bill = {
  id: "HB2186",
  label: "HB 2186",
  session: "2025-2026",
  chamber: "House",
  kind: "bill",
  shortTitle: "Accessory Dwelling Units",
  description:
    "Requires municipalities to allow accessory dwelling units (ADUs) — small secondary homes on single-family lots — statewide.",
  topics: ["adu"],
  status: "passed_2nd_consideration",
  primeSponsorDistrict: "38", // John Inglis III
  committee: "Housing and Community Development",
  introducedDate: "2026-02-02",
  lastActionDate: "2026-05-06",
  lastActionNote:
    "Passed second consideration 134–67 on May 6, 2026 (as amended by A3220); reprinted as PN 3373; awaiting third consideration / final passage.",
  sourceUrl: "https://www.palegis.us/legislation/bills/2025/hb2186",
  billTextUrl:
    "https://www.palegis.us/legislation/bills/text/PDF/2025/0/HB2186/PN3373",
};

export const HB2155: Bill = {
  id: "HB2155",
  label: "HB 2155",
  session: "2025-2026",
  chamber: "House",
  kind: "bill",
  shortTitle: "Parking Flexibility",
  description:
    "Sets a state zoning standard that municipalities may not require off-street parking minimums for new development, reducing a major housing cost driver.",
  topics: ["parking"],
  status: "in_committee",
  primeSponsorDistrict: "54", // Greg Scott
  committee: "Housing and Community Development",
  introducedDate: "2026-01-26",
  lastActionDate: "2026-01-26",
  lastActionNote: "Referred to Housing & Community Development.",
  sourceUrl: "https://www.palegis.us/legislation/bills/2025/hb2155",
};

export const HB2192: Bill = {
  id: "HB2192",
  label: "HB 2192",
  session: "2025-2026",
  chamber: "House",
  kind: "bill",
  shortTitle: "Commonwealth Housing Council",
  description:
    "Establishes a Commonwealth Housing Council to coordinate housing policy across state agencies and provide a unified point of reference for residents and developers navigating state housing programs.",
  topics: ["governance"],
  status: "in_committee",
  primeSponsorDistrict: "49", // Ismail Smith-Wade-El
  committee: "Housing and Community Development",
  introducedDate: "2026-02-03",
  lastActionDate: "2026-02-03",
  lastActionNote: "Referred to Housing & Community Development.",
  sourceUrl: "https://www.palegis.us/legislation/bills/2025/hb2192",
};

export const HB2423: Bill = {
  id: "HB2423",
  label: "HB 2423",
  session: "2025-2026",
  chamber: "House",
  kind: "bill",
  shortTitle: "Residential Economic Development District Grant Program",
  description:
    "Establishes a grant program to help municipalities develop and maintain residential economic development districts, aimed at catalyzing housing construction in areas targeted for growth.",
  topics: ["funding"],
  status: "in_committee",
  primeSponsorDistrict: "202", // Jared Solomon
  committee: "Housing and Community Development",
  introducedDate: "2026-04-18",
  lastActionDate: "2026-04-18",
  lastActionNote: "Referred to Housing & Community Development.",
  sourceUrl: "https://www.palegis.us/legislation/bills/2025/hb2423",
};

export const HB2428: Bill = {
  id: "HB2428",
  label: "HB 2428",
  session: "2025-2026",
  chamber: "House",
  kind: "bill",
  shortTitle: "Residential Construction Workforce Training Grant",
  description:
    "Amends the Pennsylvania Construction Code Act to establish inspector training and certification requirements and a Residential Construction Workforce Training Grant Program.",
  topics: ["workforce", "funding"],
  status: "introduced",
  primeSponsorDistrict: "202", // Jared Solomon
  introducedDate: "2026-04-18",
  lastActionDate: "2026-04-18",
  lastActionNote: "Introduced; printer's number pending.",
  sourceUrl: "https://www.palegis.us/legislation/bills/2025/hb2428",
};

export const HB2430: Bill = {
  id: "HB2430",
  label: "HB 2430",
  session: "2025-2026",
  chamber: "House",
  kind: "bill",
  shortTitle: "Housing Ombudsman",
  description:
    "Establishes the Office of Transformation and Opportunity and a Commonwealth Housing Ombudsman to serve as a direct point of contact for Pennsylvanians navigating state and local housing programs.",
  topics: ["governance"],
  status: "introduced",
  primeSponsorDistrict: "202", // Jared Solomon
  introducedDate: "2026-04-18",
  lastActionDate: "2026-04-18",
  lastActionNote: "Introduced; printer's number pending.",
  sourceUrl: "https://www.palegis.us/legislation/bills/2025/hb2430",
};

export const HR484: Bill = {
  id: "HR484",
  label: "HR 484",
  session: "2025-2026",
  chamber: "House",
  kind: "resolution",
  shortTitle: "Housing Accelerator Study",
  description:
    "A concurrent resolution directing the Joint State Government Commission to study the creation of a Statewide housing accelerator and conduct a comprehensive review of state and local housing approval and permitting processes that delay residential construction.",
  topics: ["study", "governance"],
  status: "in_committee",
  primeSponsorDistrict: "202", // Jared Solomon
  committee: "Housing and Community Development",
  introducedDate: "2026-04-16",
  lastActionDate: "2026-04-16",
  lastActionNote: "Referred to Housing & Community Development.",
  sourceUrl: "https://www.palegis.us/legislation/bills/2025/hr484",
};

/* -------------------------------------------------------------------------- */
/*  2025–2026 session — Local Government (House)                              */
/* -------------------------------------------------------------------------- */

export const HB1459: Bill = {
  id: "HB1459",
  label: "HB 1459",
  session: "2025-2026",
  chamber: "House",
  kind: "bill",
  shortTitle: "Multi-Family Housing in Commercial Zones",
  description:
    "Requires municipalities to allow apartment buildings, mixed-use developments, and conversions of existing buildings in any commercially-zoned area — downtowns, office districts, malls, strip centers. Reintroduction of HB 1976 from the 2023–2024 session.",
  topics: ["commercial_conversion"],
  status: "in_committee",
  primeSponsorDistrict: "22", // Joshua Siegel (resigned for Lehigh Co. Exec; Inglis flagged as taking over but transfer not yet recorded on palegis as of this writing)
  committee: "Local Government",
  introducedDate: "2025-05-13",
  lastActionDate: "2025-05-13",
  lastActionNote:
    "Referred to Local Government May 13, 2025. Prime sponsor Joshua Siegel resigned to run for Lehigh County Executive; Rep. John Inglis III is expected to take over prime sponsorship but the transfer is not yet recorded on palegis.",
  priorVersions: ["HB1976"],
  sourceUrl: "https://www.palegis.us/legislation/bills/2025/hb1459",
};

export const HB2185: Bill = {
  id: "HB2185",
  label: "HB 2185",
  session: "2025-2026",
  chamber: "House",
  kind: "bill",
  shortTitle: "Duplex/Triplex/Fourplex in Single-Family-Only Zones",
  description:
    "Requires municipalities to allow duplexes, triplexes, and quadplexes on lots currently zoned for single-family homes only — letting neighborhoods add modest density without large apartment buildings. Successor to HB 2045 from the 2023–2024 session.",
  topics: ["missing_middle"],
  status: "in_committee",
  primeSponsorDistrict: "38", // John Inglis III
  committee: "Local Government",
  introducedDate: "2026-02-02",
  lastActionDate: "2026-02-02",
  lastActionNote: "Referred to Local Government.",
  priorVersions: ["HB2045"],
  sourceUrl: "https://www.palegis.us/legislation/bills/2025/hb2185",
};

/* -------------------------------------------------------------------------- */
/*  2025–2026 session — Senate                                                */
/* -------------------------------------------------------------------------- */

export const SB1239: Bill = {
  id: "SB1239",
  label: "SB 1239",
  session: "2025-2026",
  chamber: "Senate",
  kind: "bill",
  shortTitle: "Residential in Commercial Zones",
  description:
    "Requires municipalities to allow apartment buildings, mixed-use developments, and conversions of existing commercial buildings in commercially-zoned areas like malls, office parks, and downtowns. Amends the Municipalities Planning Code, which, without amendment, excludes Philadelphia and Pittsburgh.",
  topics: ["commercial_conversion"],
  status: "in_committee",
  primeSponsorDistrict: "16", // Jarrett Coleman
  committee: "Local Government",
  introducedDate: "2026-03-30",
  lastActionDate: "2026-03-30",
  lastActionNote: "Referred to Senate Local Government.",
  sourceUrl: "https://www.palegis.us/legislation/bills/2025/sb1239",
  billTextUrl:
    "https://www.palegis.us/legislation/bills/text/PDF/2025/0/SB1239/PN1548",
};

/* -------------------------------------------------------------------------- */
/*  2025–2026 session — Cosponsorship memos (not yet bills)                   */
/* -------------------------------------------------------------------------- */

export const HOUSE_MEMO_47776: Bill = {
  id: "house-memo-47776",
  label: "House Memo 47776",
  session: "2025-2026",
  chamber: "House",
  kind: "memo",
  shortTitle: "Building More Homes Near Transit",
  description:
    "Aims to expand housing opportunities near transit amenities, to support transit ridership and local economic development.",
  topics: ["tod"],
  status: "memo",
  primeSponsorDistrict: "38", // John Inglis III
  introducedDate: "2025-12-12",
  lastActionNote: "Cosponsorship memo circulated; bill not yet introduced.",
  sourceUrl: "https://www.palegis.us/house/co-sponsorship/memo?memoID=47776",
};

export const SENATE_MEMO_47956: Bill = {
  id: "senate-memo-47956",
  label: "Senate Memo 47956",
  session: "2025-2026",
  chamber: "Senate",
  kind: "memo",
  shortTitle: "Single-Exit Stairwells",
  description:
    "A cosponsorship memo proposing legislation to authorize the Uniform Construction Code Review and Advisory Council to explore permitting single-stairwell apartment buildings in Pennsylvania, which would reduce construction costs and enable more flexible floor plans.",
  topics: ["single_stair"],
  status: "memo",
  primeSponsorDistrict: "3", // Sharif Street
  introducedDate: "2026-01-23",
  lastActionNote: "Cosponsorship memo circulated; bill not yet introduced.",
  sourceUrl: "https://www.palegis.us/senate/co-sponsorship/memo?memoID=47956",
};

export const SENATE_MEMO_48019: Bill = {
  id: "senate-memo-48019",
  label: "Senate Memo 48019",
  session: "2025-2026",
  chamber: "Senate",
  kind: "memo",
  shortTitle: "Rothman/Saval ADU Reform",
  description:
    "A cosponsorship memo from Sen. Rothman proposing legislation to legalize accessory dwelling units statewide while reducing regulatory obstacles to their construction. Senate companion to HB 2186.",
  topics: ["adu"],
  status: "memo",
  primeSponsorDistrict: "34", // Greg Rothman
  introducedDate: "2026-01-30",
  lastActionNote: "Cosponsorship memo circulated; bill not yet introduced.",
  sourceUrl: "https://www.palegis.us/senate/co-sponsorship/memo?memoID=48019",
};

/* -------------------------------------------------------------------------- */
/*  Master list                                                               */
/* -------------------------------------------------------------------------- */

export const ALL_BILLS: Bill[] = [
  // 2023–2024
  HB1976,
  HB1988,
  HB2045,
  SB1126,
  // 2025–2026 Housing & Community Development
  HB2109,
  HB2186,
  HB2155,
  HB2192,
  HB2423,
  HB2428,
  HB2430,
  HR484,
  // 2025–2026 Local Government (House)
  HB1459,
  HB2185,
  // 2025–2026 Senate
  SB1239,
  // Memos
  HOUSE_MEMO_47776,
  SENATE_MEMO_47956,
  SENATE_MEMO_48019,
];

/** Lookup by bill id. */
export const BILLS_BY_ID: Map<string, Bill> = new Map(
  ALL_BILLS.map((b) => [b.id, b]),
);
