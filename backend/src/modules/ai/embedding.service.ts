import OpenAI from "openai";
import { env } from "../../config/env";
import { getOpenAIKey } from "../../config/openai";
import { prisma } from "../../lib/prisma";

const openaiKey = getOpenAIKey();
const openai = openaiKey ? new OpenAI({ apiKey: openaiKey }) : null;

export function vectorToSql(vector: number[]) {
  return `[${vector.join(",")}]`;
}

export async function createEmbedding(text: string) {
  if (!openai) return null;
  const response = await openai.embeddings.create({
    model: env.OPENAI_EMBEDDING_MODEL,
    input: text.slice(0, 8000),
  });
  return response.data[0]?.embedding ?? null;
}

export async function saveTipEmbedding(tipId: string, text: string) {
  const embedding = await createEmbedding(text);
  if (!embedding) return null;

  await prisma.$executeRawUnsafe(
    'UPDATE "Tip" SET "embedding" = $1::vector WHERE "id" = $2',
    vectorToSql(embedding),
    tipId,
  );
  return embedding;
}
