import { eq } from "drizzle-orm";
import { db } from "../db/client.ts";
import { members, messages } from "../db/schema.ts";
import { getAnthropic, MODEL } from "../lib/anthropic.ts";
import { logger } from "../lib/logger.ts";
import { buildSystemPrompt } from "./prompts.ts";
import { loadHistory, appendHistory } from "./memory.ts";
import { toolDefinitions } from "./tools/index.ts";
import { whoIsWorkingOn } from "./tools/whoIsWorkingOn.ts";
import { memberStatus } from "./tools/memberStatus.ts";
import { orgSearch } from "./tools/orgSearch.ts";
import type { OrgContext } from "./types.ts";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages.js";

type OrchestratorInput = OrgContext & {
  text: string;
  chatId: number;
};

async function dispatchTool(
  name: string,
  input: unknown,
  ctx: OrgContext
): Promise<unknown> {
  switch (name) {
    case "whoIsWorkingOn":
      return whoIsWorkingOn(input, ctx);
    case "memberStatus":
      return memberStatus(input, ctx);
    case "orgSearch":
      return orgSearch(input, ctx);
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

export async function runOrchestrator(input: OrchestratorInput): Promise<string> {
  const { org, member, integrations, text } = input;

  const orgMembers = await db
    .select({ displayName: members.displayName, telegramUsername: members.telegramUsername })
    .from(members)
    .where(eq(members.orgId, org.id));

  const systemPrompt = buildSystemPrompt(org, orgMembers, integrations);
  const history = await loadHistory(member.id);

  const userMessage: MessageParam = { role: "user", content: text };
  const conversation: MessageParam[] = [...history, userMessage];

  let finalText = "";

  for (let i = 0; i < 10; i++) {
    const response = await getAnthropic().messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      tools: toolDefinitions,
      messages: conversation,
    });

    if (response.stop_reason === "end_turn") {
      const textBlock = response.content.find((b) => b.type === "text");
      finalText = textBlock?.type === "text" ? textBlock.text : "";
      conversation.push({ role: "assistant", content: response.content });
      break;
    }

    if (response.stop_reason === "tool_use") {
      conversation.push({ role: "assistant", content: response.content });

      const toolResults: MessageParam = {
        role: "user",
        content: await Promise.all(
          response.content
            .filter((b) => b.type === "tool_use")
            .map(async (block) => {
              if (block.type !== "tool_use") return null!;
              const ctx: OrgContext = { org, member, integrations };
              const result = await dispatchTool(block.name, block.input, ctx).catch(
                (e) => ({ error: String(e) })
              );
              return {
                type: "tool_result" as const,
                tool_use_id: block.id,
                content: JSON.stringify(result),
              };
            })
        ),
      };

      conversation.push(toolResults);
      continue;
    }

    break;
  }

  if (!finalText) finalText = "Sorry, I wasn't able to complete that request.";

  await appendHistory(member.id, [userMessage, { role: "assistant", content: finalText }]);

  await db.insert(messages).values([
    { orgId: org.id, memberId: member.id, role: "user", content: text, createdAt: new Date() },
    { orgId: org.id, memberId: member.id, role: "assistant", content: finalText, createdAt: new Date() },
  ]).catch((e) => logger.warn({ err: e }, "message persist failed"));

  return finalText;
}
