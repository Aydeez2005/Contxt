import { eq, and } from "drizzle-orm";
import { db } from "../db/client.ts";
import { orgEmbeddings } from "../db/schema.ts";
import { searchPages } from "../agent/tools/notion.ts";
import { logger } from "../lib/logger.ts";
import type { OrgIntegration } from "../db/schema.ts";

/**
 * Indexes content from connected tools into org_embeddings so orgSearch
 * can find it via keyword (and eventually vector) search.
 *
 * Currently indexes: Notion pages.
 * Embeddings are stored without a vector for now — keyword search is the
 * fallback until an embeddings API is wired in.
 */
export async function indexOrgContent(
  orgId: string,
  integrations: OrgIntegration[]
): Promise<void> {
  await indexNotionPages(orgId, integrations);
}

async function indexNotionPages(
  orgId: string,
  integrations: OrgIntegration[]
): Promise<void> {
  const notionIntegration = integrations.find((i) => i.service === "notion");
  if (!notionIntegration) return;

  // Fetch a broad set of recently edited pages
  const pages = await searchPages("", notionIntegration ? [notionIntegration] : []).catch(
    (e) => {
      logger.warn({ err: e, orgId }, "Notion page fetch failed during indexing");
      return [];
    }
  );

  if (pages.length === 0) return;

  for (const page of pages) {
    const content = `${page.title}\nLast edited: ${page.lastEdited}\nURL: ${page.url}`;

    await db
      .insert(orgEmbeddings)
      .values({
        orgId,
        sourceTool: "notion",
        sourceId: page.id,
        content,
        indexedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [orgEmbeddings.orgId, orgEmbeddings.sourceTool, orgEmbeddings.sourceId],
        set: { content, indexedAt: new Date() },
      })
      .catch((e) => logger.warn({ err: e, pageId: page.id }, "Failed to index Notion page"));
  }

  logger.info({ orgId, count: pages.length }, "Notion pages indexed");
}
