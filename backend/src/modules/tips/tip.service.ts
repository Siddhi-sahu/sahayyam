import type { Prisma, Tip } from "@prisma/client";
import { AppError } from "../../lib/http";
import { prisma } from "../../lib/prisma";
import { enrichTip } from "../ai/ai.service";
import { saveTipEmbedding } from "../ai/embedding.service";
import { searchTipIds } from "../search/search.service";
import { calculateSignalRank, inferUrgency } from "../signal-rank/signalRank.service";
import type { CreateTipInput, FeedQuery } from "./tip.schemas";

const tipInclude = {
  author: { select: { id: true, name: true, role: true, credibilityScore: true } },
  college: true,
  branch: true,
  verifications: true,
} satisfies Prisma.TipInclude;

type TipWithRelations = Prisma.TipGetPayload<{ include: typeof tipInclude }>;

function parseDeadline(value?: string) {
  return value ? new Date(value) : null;
}

export function scoreTipForUser(tip: TipWithRelations, user: { collegeId: string | null; branchId: string | null; isFirstGen: boolean }) {
  const verificationCount = tip.verifications.filter((v) => v.type === "VERIFY").length;
  const disputeCount = tip.verifications.filter((v) => v.type === "DISPUTE").length;
  return calculateSignalRank({
    urgency: tip.urgency,
    status: tip.status,
    evidenceQuality: tip.evidenceQuality,
    deadline: tip.deadline,
    sourceConfidence: tip.sourceConfidence,
    verificationCount,
    disputeCount,
    contributorCredibility: tip.author.credibilityScore,
    isCollegeMatch: tip.collegeId === user.collegeId,
    isBranchMatch: tip.branchId === user.branchId || tip.branchId === null,
    isFirstGenRelevant: user.isFirstGen && ["SCHOLARSHIP", "FACULTY", "PLACEMENT"].includes(tip.category),
  });
}

export async function createTip(input: CreateTipInput, authorId: string) {
  const author = await prisma.user.findUnique({ where: { id: authorId } });
  if (!author?.collegeId) throw new AppError(400, "Complete onboarding before submitting tips");

  let enriched: Partial<CreateTipInput> & {
    deadline?: string | null;
    sourceConfidence?: number;
  } = {};

  if (input.useAiEnrichment) {
    enriched = await enrichTip({ title: input.title, rawText: input.body });
  }

  const deadline = parseDeadline(input.deadline ?? enriched.deadline ?? undefined);
  const data = {
    title: input.title,
    body: input.body,
    summary: input.summary ?? enriched.summary,
    actionSteps: input.actionSteps.length ? input.actionSteps : enriched.actionSteps ?? [],
    audience: input.audience ?? enriched.audience,
    category: input.category ?? enriched.category ?? "OTHER",
    urgency: input.urgency ?? enriched.urgency ?? inferUrgency(deadline),
    evidenceQuality: input.evidenceQuality,
    sourceConfidence: input.sourceConfidence ?? enriched.sourceConfidence ?? 60,
    deadline,
    authorId,
    collegeId: author.collegeId,
    branchId: input.branchId ?? author.branchId,
  } satisfies Prisma.TipUncheckedCreateInput;

  const tip = await prisma.tip.create({ data, include: tipInclude });
  const signalRank = scoreTipForUser(tip, {
    collegeId: author.collegeId,
    branchId: author.branchId,
    isFirstGen: author.isFirstGen,
  });

  const updated = await prisma.tip.update({
    where: { id: tip.id },
    data: { signalRank },
    include: tipInclude,
  });

  await saveTipEmbedding(tip.id, `${tip.title}\n${tip.summary ?? ""}\n${tip.body}\n${tip.actionSteps.join("\n")}`);
  return updated;
}

export async function getTip(id: string) {
  const tip = await prisma.tip.findUnique({ where: { id }, include: tipInclude });
  if (!tip) throw new AppError(404, "Tip not found");
  return tip;
}

export async function getFeed(query: FeedQuery, userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const searchedIds = query.q ? await searchTipIds(query.q, { collegeId: user.collegeId, branchId: user.branchId }, 30) : null;

  const where: Prisma.TipWhereInput = {
    status: query.status ?? { not: "ARCHIVED" },
    collegeId: user.collegeId ?? undefined,
    category: query.category,
    urgency: query.urgency,
    id: searchedIds ? { in: searchedIds } : undefined,
    OR: [{ branchId: user.branchId ?? undefined }, { branchId: null }],
  };

  const tips = await prisma.tip.findMany({
    where,
    include: tipInclude,
    take: 50,
  });

  return tips
    .map((tip) => ({ ...tip, signalRank: scoreTipForUser(tip, user) }))
    .sort((a, b) => b.signalRank - a.signalRank || (a.deadline?.getTime() ?? Infinity) - (b.deadline?.getTime() ?? Infinity));
}

export async function refreshTipRank(tipId: string) {
  const tip = await prisma.tip.findUnique({ where: { id: tipId }, include: tipInclude });
  if (!tip) throw new AppError(404, "Tip not found");
  const signalRank = scoreTipForUser(tip, {
    collegeId: tip.collegeId,
    branchId: tip.branchId,
    isFirstGen: true,
  });
  return prisma.tip.update({ where: { id: tipId }, data: { signalRank }, include: tipInclude });
}

export type { Tip, TipWithRelations };
