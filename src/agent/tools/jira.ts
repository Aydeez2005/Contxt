import type { OrgIntegration } from "../../db/schema.ts";
import { getValidToken } from "../../lib/tokenRefresh.ts";

export type JiraIssue = {
  id: string;
  key: string;
  title: string;
  status: string;
  assignee: string | null;
  url: string;
};

function getIntegration(integrations: OrgIntegration[]) {
  return integrations.find((i) => i.service === "jira") ?? null;
}

export async function getAssignedIssues(
  assigneeEmail: string,
  integrations: OrgIntegration[]
): Promise<JiraIssue[]> {
  const integration = getIntegration(integrations);
  if (!integration) return [];

  const meta = integration.metadata as { cloudId?: string; baseUrl?: string } | null;
  const baseUrl = meta?.baseUrl ?? (meta?.cloudId ? `https://api.atlassian.com/ex/jira/${meta.cloudId}` : null);
  if (!baseUrl) return [];

  const token = await getValidToken(integration);
  const res = await fetch(
    `${baseUrl}/rest/api/3/search?jql=assignee="${assigneeEmail}" AND statusCategory != Done&maxResults=10`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    }
  );

  if (!res.ok) return [];

  const data = (await res.json()) as { issues?: unknown[] };
  const issues = (data.issues ?? []) as Array<{
    id: string;
    key: string;
    fields: { summary: string; status: { name: string }; assignee: { emailAddress: string } | null };
  }>;

  return issues.map((i) => ({
    id: i.id,
    key: i.key,
    title: i.fields.summary,
    status: i.fields.status.name,
    assignee: i.fields.assignee?.emailAddress ?? null,
    url: `${baseUrl}/browse/${i.key}`,
  }));
}
