import { prisma } from "../../lib/prisma";
import { scoreTipForUser } from "../tips/tip.service";

export async function getNudges(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const now = new Date();
  const horizon = new Date(now);
  horizon.setDate(horizon.getDate() + 14);

  const tips = await prisma.tip.findMany({
    where: {
      collegeId: user.collegeId ?? undefined,
      status: { in: ["PENDING", "VERIFIED"] },
      deadline: { gte: now, lte: horizon },
      OR: [{ branchId: user.branchId ?? undefined }, { branchId: null }],
    },
    include: {
      author: { select: { id: true, name: true, role: true, credibilityScore: true } },
      college: true,
      branch: true,
      verifications: true,
    },
  });

  return tips
    .map((tip) => {
      const daysLeft = Math.ceil(((tip.deadline?.getTime() ?? now.getTime()) - now.getTime()) / 86_400_000);
      return {
        id: `nudge-${tip.id}`,
        tipId: tip.id,
        title: tip.title,
        message: `${tip.category.replaceAll("_", " ").toLowerCase()} window closes in ${daysLeft} day${daysLeft === 1 ? "" : "s"}.`,
        dueAt: tip.deadline,
        urgency: tip.urgency,
        signalRank: scoreTipForUser(tip, user),
      };
    })
    .sort((a, b) => b.signalRank - a.signalRank);
}
