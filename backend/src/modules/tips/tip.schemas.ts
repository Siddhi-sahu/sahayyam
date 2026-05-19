import { z } from "zod";

export const createTipSchema = z.object({
  title: z.string().min(5),
  body: z.string().min(10),
  summary: z.string().optional(),
  actionSteps: z.array(z.string()).default([]),
  audience: z.string().optional(),
  category: z
    .enum(["SCHOLARSHIP", "FACULTY", "PLACEMENT", "CLUB", "DEPARTMENT_NORM", "ACADEMIC", "OTHER"])
    .default("OTHER"),
  urgency: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  evidenceQuality: z
    .enum(["HEARD_FROM_PEER", "DIRECT_EXPERIENCE", "REPEATED_PATTERN", "DOCUMENTED"])
    .default("DIRECT_EXPERIENCE"),
  sourceConfidence: z.number().int().min(1).max(100).default(60),
  deadline: z.string().datetime().or(z.string().date()).optional(),
  branchId: z.string().optional(),
  useAiEnrichment: z.boolean().default(false),
});

export const feedQuerySchema = z.object({
  category: z
    .enum(["SCHOLARSHIP", "FACULTY", "PLACEMENT", "CLUB", "DEPARTMENT_NORM", "ACADEMIC", "OTHER"])
    .optional(),
  urgency: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  status: z.enum(["PENDING", "VERIFIED", "DISPUTED", "NEEDS_CONTEXT", "ARCHIVED"]).optional(),
  q: z.string().optional(),
});

export type CreateTipInput = z.infer<typeof createTipSchema>;
export type FeedQuery = z.infer<typeof feedQuerySchema>;
