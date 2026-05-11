// Core domain types for PA Housing Votes

export type Party = "D" | "R" | "I";

export type Vote = "Yea" | "Nay" | "Not Voting" | "Absent" | "Excused";

export type ChamberAction =
  | "committee_vote"
  | "floor_vote"
  | "cosponsorship";

export type Chamber = "House" | "Senate";

export interface Member {
  /** Stable ID we control (e.g. "house-2025-101-cohen"). */
  id: string;
  fullName: string;
  lastName: string;
  party: Party;
  chamber: Chamber;
  /** District number as a string, e.g. "182". */
  district: string;
  /** Current = actively serving; former = left office (ran elsewhere, retired, lost, etc.). */
  status?: "current" | "former";
  /** Month/year when they left office, e.g. "2024-12". Optional and only for former members. */
  termEnd?: string;
  /** Free-text explanation of termEnd for former members, e.g. "Ran for Lehigh County Executive". */
  termEndNote?: string;
  /** Official email address (Capitol office). */
  email?: string;
  /** URL to the palegis.us bio page. */
  bioUrl?: string;
}

export interface MemberVote {
  memberId: string;
  vote: Vote;
}

/** What phase a bill is in. Memos are pre-introduction. */
export type BillStatus =
  | "memo" // Cosponsorship memo, not yet introduced
  | "introduced" // Assigned a number, referred to committee
  | "in_committee"
  | "passed_committee"
  | "laid_on_table"
  | "passed_2nd_consideration" // Cleared 2nd consideration; awaiting 3rd / final passage
  | "passed_chamber" // Passed originating chamber on 3rd consideration / final passage
  | "other_chamber" // Received in the opposite chamber
  | "conference"
  | "enacted"
  | "dead"; // Failed or session-ended without action

/** Policy area — a bill may have multiple. */
export type BillTopic =
  | "adu" // Accessory dwelling units
  | "missing_middle" // Duplex/triplex/fourplex in SFH areas
  | "occupancy" // Unrelated-person occupancy caps (Golden Girls)
  | "parking" // Parking-minimum preemption
  | "tod" // Transit-oriented development
  | "commercial_conversion" // Residential-in-commercial zones
  | "single_stair" // Single-exit stairwell
  | "governance" // Housing council, ombudsman, etc.
  | "funding" // Grants, tax abatements
  | "workforce" // Builder training
  | "study"; // Resolutions directing studies

/** Bill vs. resolution vs. cosponsorship memo. */
export type BillKind = "bill" | "resolution" | "memo";

export interface Bill {
  /** e.g. "HB2186" — no spaces, no session year. Or "house-memo-47776" for memos. */
  id: string;
  /** Display label, e.g. "HB 2186" or "House Memo 47776". */
  label: string;
  session: "2023-2024" | "2025-2026";
  chamber: Chamber;
  kind: BillKind;
  shortTitle: string;
  description: string;
  topics: BillTopic[];
  status: BillStatus;
  /** Prime sponsor's district (e.g. "38"). Chamber inferred from Bill.chamber. */
  primeSponsorDistrict: string;
  /** Committee of current reference, if any. */
  committee?: string;
  /** ISO date when introduced/referred. */
  introducedDate?: string;
  /** ISO date of most recent action. */
  lastActionDate?: string;
  /** Free-text describing latest action, e.g. "Laid on the table, April 13, 2026". */
  lastActionNote?: string;
  /** Prior bill IDs this is a successor to (e.g. HB 2185 → ["HB2045","HB1976"]). */
  priorVersions?: string[];
  /** Canonical palegis.us bill info page. */
  sourceUrl?: string;
  /** Direct PDF of the bill text. */
  billTextUrl?: string;
}

export interface RollCall {
  /** Stable ID, e.g. "2025-04-14-house-housing-hb1294". */
  id: string;
  bill: Bill;
  /** ISO date (YYYY-MM-DD) of the vote. */
  date: string;
  chamber: Chamber;
  committee?: string;
  /** Free-text motion, e.g. "That House Bill 1294 be reported as committed". */
  motion: string;
  outcome: "Passed" | "Failed";
  totals: {
    yea: number;
    nay: number;
    notVoting: number;
    absent?: number;
    excused?: number;
  };
  votes: MemberVote[];
  /** URL of the official palegis.us roll call page. */
  sourceUrl: string;
}

/**
 * District-level enriched feature properties served from
 * /data/pa_house_districts.geojson.
 *
 * One feature per PA House district (203 total).
 */
export interface DistrictProperties {
  district: string; // "1".."203"
  /** Total population (ACS 2023 5-year). */
  population: number;
  /** Land area in square miles. */
  landAreaSqMi: number;
  /**
   * Top municipalities by population share (sorted desc, capped at 5).
   * Each entry is the % of THIS DISTRICT'S population that lives in
   * the intersection of district X municipality.
   */
  topMunicipalities: Array<{
    name: string;
    classCode: MunicipalClass;
    populationShare: number; // 0..1
  }>;
  /**
   * Top counties by population share within this district. Most districts
   * sit entirely in one county; rural districts may span 3-5.
   */
  topCounties: Array<{
    name: string;
    geoid: string; // 5-char FIPS, e.g. "42101" for Philadelphia
    populationShare: number; // 0..1
  }>;
  /**
   * Aggregate share of district population by municipal class.
   * Keys sum to ~1.0 (some areas may be unincorporated → "other").
   */
  classShares: Record<MunicipalClass, number>;
  /**
   * Cross-chamber nesting. Senate features get nestedHouseDistricts;
   * House features get parentSenateDistricts. Each entry's
   * overlapShareOfHD is the fraction of the HOUSE district's area that
   * sits inside the senate district; areaShareOfSD is the fraction of
   * the SENATE district's area covered by the HD.
   */
  nestedHouseDistricts?: NestedDistrict[];
  parentSenateDistricts?: NestedDistrict[];
}

export interface NestedDistrict {
  district: string;
  overlapShareOfHD: number; // 0..1 — fraction of the HD's area in the SD
  areaShareOfSD: number; // 0..1 — fraction of the SD's area covered by this HD
}

export type MunicipalClass =
  | "first_class_city" // Philadelphia (only one)
  | "second_class_city" // Pittsburgh (only one)
  | "second_class_a_city" // Scranton (only one)
  | "third_class_city" // ~53 of these (Allentown, Erie, Reading, Lancaster, York, etc.)
  | "borough"
  | "first_class_township" // ~93 of these — older "1970s suburban boom" tier
  | "second_class_township" // ~1,450 of these — exurban / rural tier
  | "town" // Bloomsburg (only one)
  | "other";

export interface Cosponsorship {
  billId: string;
  primeSponsor: { name: string; district: string; party: Party };
  cosponsors: Array<{ name: string; district: string; party: Party }>;
}

/**
 * What the map can show as a single selectable tab.
 *
 * Most legislation we track doesn't have a roll call yet — bills sit in
 * committee, memos circulate, etc. — but they DO have cosponsor lists
 * we can map. A MapItem unifies both modes:
 *
 * - kind: "rollCall" — render the choropleth from member votes, with
 *   the bill's cosponsorship layered on as a purple overlay.
 * - kind: "cosponsorOnly" — render only the prime sponsor + cosponsor
 *   districts in purple (no vote data exists).
 */
export type MapItem =
  | { kind: "rollCall"; rollCall: RollCall }
  | { kind: "cosponsorOnly"; bill: Bill; cosponsorship: Cosponsorship };

export const MUNICIPAL_CLASS_LABELS: Record<MunicipalClass, string> = {
  first_class_city: "First-class city",
  second_class_city: "Second-class city",
  second_class_a_city: "Second-class A city",
  third_class_city: "Third-class city",
  borough: "Borough",
  first_class_township: "First-class township",
  second_class_township: "Second-class township",
  town: "Town",
  other: "Other / unincorporated",
};
