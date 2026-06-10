import { z } from "zod";
import { searchPages } from "./notion.ts";
import type { OrgContext, ToolResult } from "../types.ts";

const Input = z.object({
  query: z.string(),
});

export async function notionSearch(
  rawInput: unknown,
  ctx: OrgContext
): Promise<ToolResult> {
  const parsed = Input.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: "Invalid input: query is required." };
  }

  const pages = await searchPages(parsed.data.query, ctx.integrations);

  if (pages.length === 0) {
    return {
      success: true,
      data: { results: [], note: "No matching Notion pages found." },
    };
  }

  return { success: true, data: { results: pages } };
}
