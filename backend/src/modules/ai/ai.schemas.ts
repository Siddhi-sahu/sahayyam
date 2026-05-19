import { z } from "zod";

export const enrichTipSchema = z.object({
  title: z.string().min(3).optional(),
  rawText: z.string().min(10),
});

export const askSchema = z.object({
  question: z.string().min(3),
  sessionId: z.string().optional(),
});

export type EnrichTipInput = z.infer<typeof enrichTipSchema>;
export type AskInput = z.infer<typeof askSchema>;
