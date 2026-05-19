import { ChatOpenAI } from "@langchain/openai";
import OpenAI from "openai";
import { env } from "../../config/env";
import { getOpenAIKey } from "../../config/openai";
import { AppError } from "../../lib/http";
import { prisma } from "../../lib/prisma";
import { searchTipIds } from "../search/search.service";
import type { AskInput, EnrichTipInput } from "./ai.schemas";

const openaiKey = getOpenAIKey();
const openai = openaiKey ? new OpenAI({ apiKey: openaiKey }) : null;

const fallbackEnrichment = {
  category: "OTHER",
  urgency: "MEDIUM",
  deadline: null,
  summary: "AI enrichment is unavailable.",
  actionSteps: ["Review this tip manually before publishing."],
  audience: "Students",
  sourceConfidence: 60,
};

function extractJson(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new AppError(502, "AI response did not contain JSON");
  return JSON.parse(text.slice(start, end + 1));
}

export async function enrichTip(input: EnrichTipInput) {
  if (!openai) return fallbackEnrichment;

  const response = await openai.responses.create({
    model: env.OPENAI_CHAT_MODEL,
    max_output_tokens: 3000,
    input: `You structure senior-submitted college intelligence for first-generation students.
Return only JSON with keys: category, urgency, deadline, summary, actionSteps, audience, sourceConfidence.
category must be one of SCHOLARSHIP, FACULTY, PLACEMENT, CLUB, DEPARTMENT_NORM, ACADEMIC, OTHER.
urgency must be one of LOW, MEDIUM, HIGH, CRITICAL.
deadline must be ISO date or null.
sourceConfidence must be 1-100.

Title: ${input.title ?? "Untitled"}
Tip text: ${input.rawText}`,
  });

  const parsed = extractJson(response.output_text ?? "{}");
  return {
    category: parsed.category ?? "OTHER",
    urgency: parsed.urgency ?? "MEDIUM",
    deadline: parsed.deadline ?? null,
    summary: parsed.summary ?? null,
    actionSteps: Array.isArray(parsed.actionSteps) ? parsed.actionSteps : [],
    audience: parsed.audience ?? null,
    sourceConfidence: Number(parsed.sourceConfidence ?? 60),
  };
}

export async function ask(input: AskInput, userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const tipIds = await searchTipIds(input.question, { collegeId: user.collegeId, branchId: user.branchId }, 6);
  const tips = await prisma.tip.findMany({
    where: { id: { in: tipIds }, status: { in: ["VERIFIED", "PENDING"] } },
    include: { author: true, branch: true },
  });

  const context = tips
    .map(
      (tip, index) =>
        `[${index + 1}] ${tip.title}\nCategory: ${tip.category}\nUrgency: ${tip.urgency}\nSummary: ${
          tip.summary ?? tip.body
        }\nActions: ${tip.actionSteps.join("; ") || "No action steps listed."}`,
    )
    .join("\n\n");

  const session =
    input.sessionId
      ? await prisma.chatSession.findFirst({ where: { id: input.sessionId, userId } })
      : await prisma.chatSession.create({
          data: { userId, title: input.question.slice(0, 80) },
        });

  if (!session) throw new AppError(404, "Chat session not found");

  await prisma.chatMessage.create({
    data: { sessionId: session.id, userId, role: "USER", content: input.question, sources: [] },
  });

  let answer: string;
  if (openaiKey) {
    const model = new ChatOpenAI({
      apiKey: openaiKey,
      model: env.OPENAI_CHAT_MODEL,
      maxTokens: 3000,
      temperature: 0.2,
    });

    const result = await model.invoke([
      [
        "system",
        "Answer as Sahayyam, a grounded college intelligence assistant. Use only the provided tip context. Cite tips like [1]. If context is insufficient, say so clearly and suggest what to ask seniors.",
      ],
      ["human", `Question: ${input.question}\n\nTip context:\n${context || "No relevant tips found."}`],
    ]);
    answer = String(result.content);
  } else {
    answer = context
      ? `Based on the available tips: ${tips[0]?.summary ?? tips[0]?.body} See source [1].`
      : "I do not have enough verified college intelligence to answer that yet. Ask a senior to submit a relevant tip.";
  }

  const assistantMessage = await prisma.chatMessage.create({
    data: {
      sessionId: session.id,
      role: "ASSISTANT",
      content: answer,
      sources: tips.map((tip) => tip.id),
    },
  });

  return { sessionId: session.id, answer, sources: tips, messageId: assistantMessage.id };
}
