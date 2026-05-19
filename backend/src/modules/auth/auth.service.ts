import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../../config/env";
import { AppError } from "../../lib/http";
import { prisma } from "../../lib/prisma";
import type { LoginInput, RegisterInput } from "./auth.schemas";

function publicUser(user: Awaited<ReturnType<typeof prisma.user.findUniqueOrThrow>>) {
  const { passwordHash: _passwordHash, emailVerificationToken: _token, ...safeUser } = user;
  return safeUser;
}

function signToken(userId: string) {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as SignOptions);
}

function emailDomain(email: string) {
  return email.split("@")[1]?.toLowerCase() ?? null;
}

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
  if (existing) throw new AppError(409, "Email is already registered");

  const domain = emailDomain(input.email);
  const passwordHash = await bcrypt.hash(input.password, 12);

  const college = await prisma.college.upsert({
    where: { name: input.collegeName },
    update: { domain: domain ?? undefined },
    create: { name: input.collegeName, domain },
  });

  const branchCode = input.branchCode ?? input.branchName.toUpperCase().replace(/[^A-Z0-9]/g, "_").slice(0, 12);
  const branch = await prisma.branch.upsert({
    where: { collegeId_code: { collegeId: college.id, code: branchCode } },
    update: { name: input.branchName },
    create: { name: input.branchName, code: branchCode, collegeId: college.id },
  });

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash,
      role: input.role,
      semester: input.semester,
      graduationYear: input.graduationYear,
      isFirstGen: input.isFirstGen,
      collegeId: college.id,
      branchId: branch.id,
      emailVerified: true,
    },
    include: { college: true, branch: true },
  });

  return { token: signToken(user.id), user: publicUser(user) };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
    include: { college: true, branch: true },
  });
  if (!user) throw new AppError(401, "Invalid email or password");

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) throw new AppError(401, "Invalid email or password");

  return { token: signToken(user.id), user: publicUser(user) };
}

export async function me(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: { college: true, branch: true },
  });
  return publicUser(user);
}
