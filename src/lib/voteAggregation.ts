import type { RollCall, Vote, MemberVote, Cosponsorship } from "./types";
import { MEMBERS_BY_ID } from "@/data/members";

export interface DistrictVoteSnapshot {
  district: string;
  vote: Vote | null; // null = no record (not on committee, vacancy, etc.)
  memberId: string | null;
  memberName: string | null;
  party: "D" | "R" | "I" | null;
  isCosponsor: boolean;
  isSponsor: boolean;
}

/**
 * Build a district → vote map for a given roll call, optionally
 * merging cosponsorship data so cosponsor districts get a distinct
 * fill even if the rep isn't on the committee.
 */
export const snapshotByDistrict = (
  rollCall: RollCall,
  cosponsorship?: Cosponsorship,
): Map<string, DistrictVoteSnapshot> => {
  const out = new Map<string, DistrictVoteSnapshot>();

  // 1. Committee votes
  for (const mv of rollCall.votes) {
    const member = MEMBERS_BY_ID.get(mv.memberId);
    if (!member) continue;
    out.set(member.district, {
      district: member.district,
      vote: mv.vote,
      memberId: member.id,
      memberName: member.fullName,
      party: member.party,
      isCosponsor: false,
      isSponsor: false,
    });
  }

  // 2. Merge cosponsorship data
  if (cosponsorship) {
    const { primeSponsor, cosponsors } = cosponsorship;

    // Prime sponsor
    const existing = out.get(primeSponsor.district);
    if (existing) {
      existing.isSponsor = true;
      existing.isCosponsor = true;
    } else {
      out.set(primeSponsor.district, {
        district: primeSponsor.district,
        vote: null,
        memberId: null,
        memberName: primeSponsor.name,
        party: primeSponsor.party,
        isCosponsor: true,
        isSponsor: true,
      });
    }

    // Cosponsors
    for (const cs of cosponsors) {
      const snap = out.get(cs.district);
      if (snap) {
        snap.isCosponsor = true;
      } else {
        out.set(cs.district, {
          district: cs.district,
          vote: null,
          memberId: null,
          memberName: cs.name,
          party: cs.party,
          isCosponsor: true,
          isSponsor: false,
        });
      }
    }
  }

  return out;
};

/**
 * Helper: find a member's vote on a specific roll call.
 */
export const findVote = (
  rollCall: RollCall,
  memberId: string,
): MemberVote | undefined =>
  rollCall.votes.find((v) => v.memberId === memberId);
