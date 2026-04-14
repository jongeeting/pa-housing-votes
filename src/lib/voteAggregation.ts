import type { RollCall, Vote, MemberVote } from "./types";
import { MEMBERS_BY_ID } from "@/data/members";

export interface DistrictVoteSnapshot {
  district: string;
  vote: Vote | null; // null = no record (not on committee, vacancy, etc.)
  memberId: string | null;
  memberName: string | null;
  party: "D" | "R" | "I" | null;
}

/**
 * Build a district → vote map for a given roll call.
 *
 * Members not on the committee will have `vote: null`; the map renders
 * those districts in a neutral "no vote" fill so the visual emphasis
 * stays on the committee members who actually cast a vote.
 */
export const snapshotByDistrict = (
  rollCall: RollCall,
): Map<string, DistrictVoteSnapshot> => {
  const out = new Map<string, DistrictVoteSnapshot>();
  for (const mv of rollCall.votes) {
    const member = MEMBERS_BY_ID.get(mv.memberId);
    if (!member) continue;
    out.set(member.district, {
      district: member.district,
      vote: mv.vote,
      memberId: member.id,
      memberName: member.fullName,
      party: member.party,
    });
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
