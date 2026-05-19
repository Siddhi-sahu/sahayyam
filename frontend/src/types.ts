export type UserRole = "FRESHER" | "SENIOR" | "ADMIN";
export type TipCategory = "SCHOLARSHIP" | "FACULTY" | "PLACEMENT" | "CLUB" | "DEPARTMENT_NORM" | "ACADEMIC" | "OTHER";
export type TipStatus = "PENDING" | "VERIFIED" | "DISPUTED" | "NEEDS_CONTEXT" | "ARCHIVED";
export type Urgency = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type EvidenceQuality = "HEARD_FROM_PEER" | "DIRECT_EXPERIENCE" | "REPEATED_PATTERN" | "DOCUMENTED";

export type College = {
  id: string;
  name: string;
  domain: string | null;
};

export type Branch = {
  id: string;
  name: string;
  code: string;
  collegeId: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  semester: number | null;
  graduationYear: number | null;
  isFirstGen: boolean;
  credibilityScore: number;
  college: College | null;
  branch: Branch | null;
};

export type Verification = {
  id: string;
  type: "VERIFY" | "DISPUTE" | "NEEDS_CONTEXT";
  note: string | null;
};

export type Tip = {
  id: string;
  title: string;
  body: string;
  summary: string | null;
  actionSteps: string[];
  audience: string | null;
  category: TipCategory;
  urgency: Urgency;
  status: TipStatus;
  evidenceQuality: EvidenceQuality;
  sourceConfidence: number;
  deadline: string | null;
  signalRank: number;
  author: {
    id: string;
    name: string;
    role: UserRole;
    credibilityScore: number;
  };
  college: College;
  branch: Branch | null;
  verifications: Verification[];
};

export type Nudge = {
  id: string;
  tipId: string;
  title: string;
  message: string;
  dueAt: string | null;
  urgency: Urgency;
  signalRank: number;
};
