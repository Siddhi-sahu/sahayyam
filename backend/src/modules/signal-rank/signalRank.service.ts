import type { EvidenceQuality, TipStatus, Urgency } from "../types";

type RankInput = {
  urgency: Urgency;
  status: TipStatus;
  evidenceQuality: EvidenceQuality;
  deadline: Date | null;
  sourceConfidence: number;
  verificationCount: number;
  disputeCount: number;
  contributorCredibility: number;
  isCollegeMatch: boolean;
  isBranchMatch: boolean;
  isFirstGenRelevant: boolean;
};

const urgencyWeight: Record<Urgency, number> = {
  LOW: 4,
  MEDIUM: 10,
  HIGH: 18,
  CRITICAL: 28,
};

const evidenceWeight: Record<EvidenceQuality, number> = {
  HEARD_FROM_PEER: 4,
  DIRECT_EXPERIENCE: 10,
  REPEATED_PATTERN: 15,
  DOCUMENTED: 20,
};

function deadlineWeight(deadline: Date | null) {
  if (!deadline) return 5;
  const now = Date.now();
  const days = Math.ceil((deadline.getTime() - now) / 86_400_000);
  if (days < 0) return -10;
  if (days <= 2) return 24;
  if (days <= 7) return 18;
  if (days <= 14) return 12;
  return 6;
}

export function calculateSignalRank(input: RankInput) {
  const score =
    16 +
    urgencyWeight[input.urgency] +
    evidenceWeight[input.evidenceQuality] +
    deadlineWeight(input.deadline) +
    Math.min(16, input.verificationCount * 4) -
    Math.min(18, input.disputeCount * 6) +
    Math.round(input.sourceConfidence * 0.08) +
    Math.round(input.contributorCredibility * 0.12) +
    (input.isCollegeMatch ? 8 : 0) +
    (input.isBranchMatch ? 12 : 0) +
    (input.isFirstGenRelevant ? 5 : 0) +
    (input.status === "VERIFIED" ? 8 : 0) -
    (input.status === "DISPUTED" ? 10 : 0);

  return Math.max(1, Math.min(99, Math.round(score)));
}

export function inferUrgency(deadline: Date | null): Urgency {
  if (!deadline) return "MEDIUM";
  const days = Math.ceil((deadline.getTime() - Date.now()) / 86_400_000);
  if (days <= 2) return "CRITICAL";
  if (days <= 7) return "HIGH";
  if (days <= 21) return "MEDIUM";
  return "LOW";
}
