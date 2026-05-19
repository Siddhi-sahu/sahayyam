export type UserRole = "FRESHER" | "SENIOR" | "ADMIN";

export type TipCategory =
  | "SCHOLARSHIP"
  | "FACULTY"
  | "PLACEMENT"
  | "CLUB"
  | "DEPARTMENT_NORM"
  | "ACADEMIC"
  | "OTHER";

export type TipStatus = "PENDING" | "VERIFIED" | "DISPUTED" | "NEEDS_CONTEXT" | "ARCHIVED";

export type Urgency = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type EvidenceQuality = "HEARD_FROM_PEER" | "DIRECT_EXPERIENCE" | "REPEATED_PATTERN" | "DOCUMENTED";

export type VerificationType = "VERIFY" | "DISPUTE" | "NEEDS_CONTEXT";
