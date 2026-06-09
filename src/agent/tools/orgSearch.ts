import { z } from "zod";
import { eq, and, like, or } from "drizzle-orm";
import { db } from "../../db/client.ts";
import { orgEmbeddings } from "../../db/schema.ts";
import type { OrgContext, ToolResult } from "../types.ts";

const Input = z.object({
  query: z.string(),
  filter_tool: z.string().optional(),
});

type SearchRow = {
  id: string;
  source_tool: string;
  source_id: string;
  content: string;
};

async function keywordSearch(
  orgId: string,
  query: string,
  filterTool?: string
): Promise<SearchRow[]> {
  const terms = query.split(/\s+/).filter(Boolean);
  const conditions = terms.map((t) => like(orgEmbeddings.content, `%${t}%`));

  const rows = await db
    .select({
      id: orgEmbeddings.id,
      source_tool: orgEmbeddings.sourceTool,
      source_id: orgEmbeddings.sourceId,
      content: orgEmbeddings.content,
    })
    .from(orgEmbeddings)
    .where(
      and(
        eq(orgEmbeddings.orgId, orgId),
        filterTool ? eq(orgEmbeddings.sourceTool, filterTool) : undefined,
        or(...conditions)
      )
    )
    .limit(5);

  return rows.map((r) => ({
    id: r.id,
    source_tool: r.source_tool,
    source_id: r.source_id,
    content: r.content,
  }));
}

export async function orgSearch(
  rawInput: unknown,
  ctx: OrgContext
): Promise<ToolResult> {
  const parsed = Input.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: "Invalid input: query is required." };
  }

  const { query, filter_tool } = parsed.data;

  const results = await keywordSearch(ctx.org.id, query, filter_tool);

  if (results.length === 0) {
    return {
      success: true,
      data: { results: [], note: "No matching content found in the org knowledge base." },
    };
  }

  return { success: true, data: { results } };
}
