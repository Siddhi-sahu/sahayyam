import type { VerificationType } from "@prisma/client";
import { AppError } from "../../lib/http";
import { prisma } from "../../lib/prisma";
import { refreshTipRank } from "../tips/tip.service";
import type { VerificationInput } from "./verification.schemas";

async function applyVerification(tipId: string, userId: string, type: VerificationType, input: VerificationInput) {
  const tip = await prisma.tip.findUnique({ where: { id: tipId }, include: { author: true } });
  if (!tip) throw new AppError(404, "Tip not found");
  if (tip.authorId === userId) throw new AppError(400, "Authors cannot verify their own tips");

  await prisma.tipVerification.upsert({
    where: { tipId_userId: { tipId, userId } },
    update: { type, note: input.note },
    create: { tipId, userId, type, note: input.note },
  });

  const counts = await prisma.tipVerification.groupBy({
    by: ["type"],
    where: { tipId },
    _count: true,
  });

  const verifies = counts.find((count) => count.type === "VERIFY")?._count ?? 0;
  const disputes = counts.find((count) => count.type === "DISPUTE")?._count ?? 0;
  const needsContext = counts.find((count) => count.type === "NEEDS_CONTEXT")?._count ?? 0;

  const status =
    disputes >= 2 && disputes > verifies
      ? "DISPUTED"
      : verifies >= 2 && verifies >= disputes + 1
        ? "VERIFIED"
        : needsContext > verifies
          ? "NEEDS_CONTEXT"
          : "PENDING";

  await prisma.tip.update({ where: { id: tipId }, data: { status } });

  const credibilityDelta = type === "VERIFY" ? 3 : type === "DISPUTE" ? -4 : -1;
  await prisma.user.update({
    where: { id: tip.authorId },
    data: { credibilityScore: { increment: credibilityDelta } },
  });

  return refreshTipRank(tipId);
}

export function verifyTip(tipId: string, userId: string, input: VerificationInput) {
  return applyVerification(tipId, userId, "VERIFY", input);
}

export function disputeTip(tipId: string, userId: string, input: VerificationInput) {
  return applyVerification(tipId, userId, "DISPUTE", input);
}
