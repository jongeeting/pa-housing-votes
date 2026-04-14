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
}

export interface MemberVote {
  memberId: string;
  vote: Vote;
}

export interface Bill {
  /** e.g. "HB1294" — no spaces, no session year. */
  id: string;
  /** Display label, e.g. "HB 1294". */
  label: string;
  session: string; // e.g. "2025-2026"
  chamber: Chamber;
  shortTitle: string;
  description: string;
  /** Optional canonical URL on palegis.us. */
  sourceUrl?: string;
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
   * Aggregate share of district population by municipal class.
   * Keys sum to ~1.0 (some areas may be unincorporated → "other").
   */
  classShares: Record<MunicipalClass, number>;
}

export type MunicipalClass =
  | "first_class_city" // Philadelphia
  | "second_class_city" // Pittsburgh, Scranton
  | "second_class_a_city"
  | "third_class_city"
  | "borough"
  | "first_class_township"
  | "second_class_township"
  | "town" // Bloomsburg
  | "other";

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
