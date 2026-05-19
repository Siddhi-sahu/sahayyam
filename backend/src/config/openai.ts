import { env } from "./env";

export function getOpenAIKey() {
  const key = env.OPENAI_API_KEY?.trim();
  if (!key || key.startsWith("__")) return null;
  return key;
}
