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
  status: "passed_chamber",
  primeSponsorDistrict: "38", // John Inglis III
  committee: "Housing and Community Development",
  introducedDate: "2026-02-02",
  lastActionDate: "2026-06-01",
  lastActionNote:
    "Passed the House on third consideration 139–62 on June 1, 2026 (PN 3373, which folds in a per-lot ADU cap and an opt-out allowing municipalities to bar short-term rentals under 30 days). Heads to the Senate. Amends Title 53 directly, so unlike the Senate companion (SB 1346, which amends the MPC), this version applies to all PA municipalities including Philadelphia and Pittsburgh.",
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

export const HB2367: Bill = {
  id: "HB2367",
  label: "HB 2367",
  session: "2025-2026",
  chamber: "House",
  kind: "bill",
  shortTitle: "RACP for Housing Development",
  description:
    "Authorizes the use of Redevelopment Assistance Capital Program (RACP) funds for housing development projects, expanding a state capital program to support housing construction. Amends the Capital Facilities Debt Enabling Act (Act 1 of 1999).",
  topics: ["governance"],
  status: "laid_on_table",
  primeSponsorDistrict: "163", // Heather Boyd
  committee: "Housing and Community Development",
  introducedDate: "2026-04-08",
  lastActionDate: "2026-04-13",
  lastActionNote:
    "Passed Housing and Community Development committee on a party-line vote April 13, 2026; laid on the table pending floor scheduling.",
  sourceUrl: "https://www.palegis.us/legislation/bills/2025/hb2367",
  billTextUrl:
    "https://www.palegis.us/legislation/bills/text/PDF/2025/0/HB2367/PN3148",
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

export const SB1346: Bill = {
  id: "SB1346",
  label: "SB 1346",
  session: "2025-2026",
  chamber: "Senate",
  kind: "bill",
  shortTitle: "Accessory Dwelling Units (Senate)",
  description:
    "Senate companion to HB 2186 — requires municipalities to allow accessory dwelling units (ADUs) by right wherever single-family homes are allowed. Stronger on regulatory specifics than the House version (14-day ministerial approval with deemed-approved fallback, written denial reasons, utility-connection-fee shield, 150 sf minimum / 1,250 sf max). Amends the Municipalities Planning Code, which excludes Philadelphia (1st-class city) and Pittsburgh (2nd-class city) from coverage — the House version reaches both via a direct Title 53 amendment.",
  topics: ["adu"],
  status: "in_committee",
  primeSponsorDistrict: "34", // Greg Rothman
  committee: "Urban Affairs and Housing",
  introducedDate: "2026-05-26",
  lastActionDate: "2026-05-26",
  lastActionNote:
    "Referred to Senate Urban Affairs and Housing. Bipartisan 12-senator introducer list (7 D + 5 R).",
  sourceUrl: "https://www.palegis.us/legislation/bills/2025/sb1346",
  billTextUrl:
    "https://www.palegis.us/legislation/bills/text/PDF/2025/0/SB1346/PN1747",
};

export const SB1263: Bill = {
  id: "SB1263",
  label: "SB 1263",
  session: "2025-2026",
  chamber: "Senate",
  kind: "bill",
  shortTitle: "Municipal Occupancy Reform (Golden Girls Law, Senate)",
  description:
    "Senate companion to HB 2109. Bars municipalities from capping the number of unrelated people who can live together — preempts local \"family\" definitions in zoning that have functioned as occupancy caps on shared housing arrangements.",
  topics: ["occupancy"],
  status: "in_committee",
  primeSponsorDistrict: "1", // Nikil Saval
  committee: "Urban Affairs and Housing",
  introducedDate: "2026-04-23",
  lastActionDate: "2026-04-23",
  lastActionNote: "Referred to Urban Affairs and Housing.",
  sourceUrl: "https://www.palegis.us/legislation/bills/2025/sb1263",
  billTextUrl:
    "https://www.palegis.us/legislation/bills/text/PDF/2025/0/SB1263/PN1629",
};

export const SB1277: Bill = {
  id: "SB1277",
  label: "SB 1277",
  session: "2025-2026",
  chamber: "Senate",
  kind: "bill",
  shortTitle: "Property Tax Abatement for Housing Redevelopment",
  description:
    "Amends the Local Economic Revitalization Tax Assistance Act (LERTA, Act 76 of 1977) to expand municipal authority to grant property tax abatements for housing construction and redevelopment.",
  topics: ["governance"],
  status: "passed_committee",
  primeSponsorDistrict: "32", // Patrick Stefano
  committee: "Urban Affairs and Housing",
  introducedDate: "2026-04-23",
  lastActionDate: "2026-05-06",
  lastActionNote:
    "Passed Senate Urban Affairs and Housing committee with bipartisan votes May 6, 2026.",
  sourceUrl: "https://www.palegis.us/legislation/bills/2025/sb1277",
  billTextUrl:
    "https://www.palegis.us/legislation/bills/text/PDF/2025/0/SB1277/PN1632",
};

export const SB1278: Bill = {
  id: "SB1278",
  label: "SB 1278",
  session: "2025-2026",
  chamber: "Senate",
  kind: "bill",
  shortTitle: "Residential Economic Development District Grant Program (Senate)",
  description:
    "Senate companion to HB 2423. Establishes a state grant program — the Residential Economic Development District Grant Program — to help municipalities develop and maintain residential economic development districts that catalyze housing construction.",
  topics: ["governance"],
  status: "passed_committee",
  primeSponsorDistrict: "5", // Joe Picozzi
  committee: "Urban Affairs and Housing",
  introducedDate: "2026-04-14",
  lastActionDate: "2026-05-06",
  lastActionNote:
    "Passed Senate Urban Affairs and Housing committee 9–2 May 6, 2026; first consideration same day.",
  sourceUrl: "https://www.palegis.us/legislation/bills/2025/sb1278",
  billTextUrl:
    "https://www.palegis.us/legislation/bills/text/PDF/2025/0/SB1278/PN1587",
};

export const SB1279: Bill = {
  id: "SB1279",
  label: "SB 1279",
  session: "2025-2026",
  chamber: "Senate",
  kind: "bill",
  shortTitle: "Regulatory Compliance Officer for Housing",
  description:
    "Creates a Commonwealth Housing Regulatory Compliance Officer position to streamline housing-construction permitting across state executive agencies.",
  topics: ["governance"],
  status: "passed_committee",
  primeSponsorDistrict: "28", // Kristin Phillips-Hill
  committee: "Urban Affairs and Housing",
  introducedDate: "2026-04-14",
  lastActionDate: "2026-05-06",
  lastActionNote:
    "Passed Senate Urban Affairs and Housing committee on a party-line vote May 6, 2026 (re-reported as amended).",
  sourceUrl: "https://www.palegis.us/legislation/bills/2025/sb1279",
  billTextUrl:
    "https://www.palegis.us/legislation/bills/text/PDF/2025/0/SB1279/PN1756",
};

export const SB1281: Bill = {
  id: "SB1281",
  label: "SB 1281",
  session: "2025-2026",
  chamber: "Senate",
  kind: "bill",
  shortTitle: "Pre-Approved Housing Plans",
  description:
    "Amends the Municipalities Planning Code to allow municipalities to adopt pre-approved housing plans that streamline permitting and lower the cost of starter housing.",
  topics: ["governance"],
  status: "passed_committee",
  primeSponsorDistrict: "34", // Greg Rothman
  committee: "Urban Affairs and Housing",
  introducedDate: "2026-04-14",
  lastActionDate: "2026-05-06",
  lastActionNote:
    "Passed Senate Urban Affairs and Housing committee with bipartisan votes May 6, 2026.",
  sourceUrl: "https://www.palegis.us/legislation/bills/2025/sb1281",
  billTextUrl:
    "https://www.palegis.us/legislation/bills/text/PDF/2025/0/SB1281/PN1589",
};

export const SR211: Bill = {
  id: "SR211",
  label: "SR 211",
  session: "2025-2026",
  chamber: "Senate",
  kind: "resolution",
  shortTitle: "Study of the Municipalities Planning Code",
  description:
    "Directs the Legislative Budget and Finance Committee to conduct a study and issue a report on the effectiveness of the Municipalities Planning Code (MPC) in addressing housing supply and affordability.",
  topics: ["study"],
  status: "enacted",
  primeSponsorDistrict: "11", // Judith Schwank
  committee: "Local Government",
  introducedDate: "2026-01-23",
  lastActionDate: "2026-04-21",
  lastActionNote: "Resolution adopted April 21, 2026.",
  sourceUrl: "https://www.palegis.us/legislation/bills/2025/sr211",
  billTextUrl:
    "https://www.palegis.us/legislation/bills/text/PDF/2025/0/SR0211/PN1507",
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
