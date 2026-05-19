import { z } from "zod";

const categoryValues = ["SCHOLARSHIP", "FACULTY", "PLACEMENT", "CLUB", "DEPARTMENT_NORM", "ACADEMIC", "OTHER"] as const;
const urgencyValues = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
const evidenceValues = ["HEARD_FROM_PEER", "DIRECT_EXPERIENCE", "REPEATED_PATTERN", "DOCUMENTED"] as const;

function normalizeEnumValue(value: unknown) {
  if (typeof value !== "string") return value;
  return value.trim().toUpperCase().replace(/[\s-]+/g, "_");
}

function normalizeOptionalDate(value: unknown) {
  if (value === "" || value === null) return undefined;
  return value;
}

export const createTipSchema = z.object({
  title: z.string().min(5),
  body: z.string().min(10),
  summary: z.string().optional(),
  actionSteps: z.array(z.string()).default([]),
  audience: z.string().optional(),
  category: z.preprocess(normalizeEnumValue, z.enum(categoryValues)).default("OTHER"),
  urgency: z.preprocess(normalizeEnumValue, z.enum(urgencyValues)).optional(),
  evidenceQuality: z.preprocess(normalizeEnumValue, z.enum(evidenceValues)).default("DIRECT_EXPERIENCE"),
  sourceConfidence: z.number().int().min(1).max(100).default(60),
  deadline: z.preprocess(normalizeOptionalDate, z.string().datetime().or(z.string().date()).optional()),
  branchId: z.string().optional(),
  useAiEnrichment: z.boolean().default(false),
});

export const feedQuerySchema = z.object({
  category: z.preprocess(normalizeEnumValue, z.enum(categoryValues)).optional(),
  urgency: z.preprocess(normalizeEnumValue, z.enum(urgencyValues)).optional(),
  status: z.enum(["PENDING", "VERIFIED", "DISPUTED", "NEEDS_CONTEXT", "ARCHIVED"]).optional(),
  q: z.string().optional(),
});

export type CreateTipInput = z.infer<typeof createTipSchema>;
export type FeedQuery = z.infer<typeof feedQuerySchema>;
