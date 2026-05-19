import { prisma } from "../../lib/prisma";
import { createEmbedding, vectorToSql } from "../ai/embedding.service";

export type SearchScope = {
  collegeId: string | null;
  branchId: string | null;
};

export async function searchTipIds(query: string, scope: SearchScope, limit = 10) {
  const embedding = await createEmbedding(query);

  if (embedding) {
    const rows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `
        SELECT "id"
        FROM "Tip"
        WHERE "embedding" IS NOT NULL
          AND ($1::text IS NULL OR "collegeId" = $1)
          AND ($2::text IS NULL OR "branchId" = $2 OR "branchId" IS NULL)
          AND "status" != 'ARCHIVED'
        ORDER BY "embedding" <=> $3::vector
        LIMIT $4
      `,
      scope.collegeId,
      scope.branchId,
      vectorToSql(embedding),
      limit,
    );
    if (rows.length > 0) {
      return rows.map((row) => row.id);
    }
  }

  const tips = await prisma.tip.findMany({
    where: {
      status: { not: "ARCHIVED" },
      collegeId: scope.collegeId ?? undefined,
      OR: [
        { branchId: scope.branchId ?? undefined },
        { branchId: null },
        { title: { contains: query, mode: "insensitive" } },
        { body: { contains: query, mode: "insensitive" } },
      ],
    },
    take: limit,
    select: { id: true },
  });
  return tips.map((tip) => tip.id);
}
