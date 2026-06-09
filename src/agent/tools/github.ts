import type { OrgIntegration } from "../../db/schema.ts";

export type GitHubPR = {
  id: number;
  title: string;
  state: string;
  url: string;
  updatedAt: string;
};

export async function getOpenPRs(
  githubLogin: string,
  integrations: OrgIntegration[]
): Promise<GitHubPR[]> {
  const integration = integrations.find((i) => i.service === "github");
  if (!integration) return [];

  const meta = integration.metadata as { org?: string } | null;
  const orgName = meta?.org ?? "";

  const res = await fetch(
    `https://api.github.com/search/issues?q=type:pr+state:open+author:${githubLogin}${orgName ? `+org:${orgName}` : ""}&per_page=5`,
    {
      headers: {
        Authorization: `Bearer ${integration.accessToken}`,
        Accept: "application/vnd.github+json",
      },
    }
  );

  if (!res.ok) return [];

  const data = (await res.json()) as {
    items?: Array<{ id: number; title: string; state: string; html_url: string; updated_at: string }>;
  };

  return (data.items ?? []).map((i) => ({
    id: i.id,
    title: i.title,
    state: i.state,
    url: i.html_url,
    updatedAt: i.updated_at,
  }));
}
