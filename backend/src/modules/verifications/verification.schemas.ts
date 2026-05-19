import { z } from "zod";

export const verificationSchema = z.object({
  note: z.string().max(500).optional(),
});

export type VerificationInput = z.infer<typeof verificationSchema>;
