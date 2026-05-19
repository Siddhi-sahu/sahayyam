import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["FRESHER", "SENIOR", "ADMIN"]).default("FRESHER"),
  collegeName: z.string().min(2),
  branchName: z.string().min(2),
  branchCode: z.string().min(2).max(12).optional(),
  semester: z.number().int().min(1).max(12).optional(),
  graduationYear: z.number().int().min(2020).max(2040).optional(),
  isFirstGen: z.boolean().default(false),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
