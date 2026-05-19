import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AppError } from "../lib/http";
import { prisma } from "../lib/prisma";

export type AuthUser = {
  id: string;
  role: "FRESHER" | "SENIOR" | "ADMIN";
  collegeId: string | null;
  branchId: string | null;
  isFirstGen: boolean;
};

export type AuthedRequest = Request & { user?: AuthUser };

type JwtPayload = {
  sub: string;
};

export async function requireAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return next(new AppError(401, "Missing bearer token"));
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true, collegeId: true, branchId: true, isFirstGen: true },
    });

    if (!user) {
      return next(new AppError(401, "User no longer exists"));
    }

    req.user = user;
    return next();
  } catch {
    return next(new AppError(401, "Invalid or expired token"));
  }
}

export function requireRole(...roles: AuthUser["role"][]) {
  return (req: AuthedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError(401, "Authentication required"));
    if (!roles.includes(req.user.role)) return next(new AppError(403, "Insufficient role"));
    return next();
  };
}
