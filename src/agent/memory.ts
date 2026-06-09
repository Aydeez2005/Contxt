import { redis } from "../lib/redis.ts";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages.js";

const MAX_HISTORY = 20;
const TTL = 60 * 60 * 24; // 24h

function key(memberId: string) {
  return `memory:${memberId}`;
}

export async function loadHistory(memberId: string): Promise<MessageParam[]> {
  const data = await redis.get<MessageParam[]>(key(memberId));
  return data ?? [];
}

export async function appendHistory(
  memberId: string,
  messages: MessageParam[]
): Promise<void> {
  const existing = await loadHistory(memberId);
  const updated = [...existing, ...messages].slice(-MAX_HISTORY);
  await redis.set(key(memberId), updated, { ex: TTL });
}

export async function clearHistory(memberId: string): Promise<void> {
  await redis.del(key(memberId));
}
