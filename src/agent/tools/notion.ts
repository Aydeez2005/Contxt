import type { OrgIntegration } from "../../db/schema.ts";
import { getValidToken } from "../../lib/tokenRefresh.ts";

export type NotionPage = {
  id: string;
  title: string;
  url: string;
  lastEdited: string;
};

export async function searchPages(
  query: string,
  integrations: OrgIntegration[]
): Promise<NotionPage[]> {
  const integration = integrations.find((i) => i.service === "notion");
  if (!integration) return [];

  const token = await getValidToken(integration);
  const res = await fetch("https://api.notion.com/v1/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, page_size: 5 }),
  });

  if (!res.ok) return [];

  const data = (await res.json()) as {
    results?: Array<{
      id: string;
      url: string;
      last_edited_time: string;
      properties?: { title?: { title?: Array<{ plain_text: string }> } };
      title?: Array<{ plain_text: string }>;
    }>;
  };

  return (data.results ?? []).map((r) => ({
    id: r.id,
    title:
      r.properties?.title?.title?.[0]?.plain_text ??
      r.title?.[0]?.plain_text ??
      "Untitled",
    url: r.url,
    lastEdited: r.last_edited_time,
  }));
}
