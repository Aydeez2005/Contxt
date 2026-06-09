import type { OrgIntegration } from "../../db/schema.ts";

export type LinearIssue = {
  id: string;
  title: string;
  status: string;
  url: string;
};

export async function getAssignedIssues(
  memberEmail: string,
  integrations: OrgIntegration[]
): Promise<LinearIssue[]> {
  const integration = integrations.find((i) => i.service === "linear");
  if (!integration) return [];

  const query = `
    query {
      issues(filter: { assignee: { email: { eq: "${memberEmail}" } }, state: { type: { nin: ["completed", "cancelled"] } } }, first: 10) {
        nodes { id title url state { name } }
      }
    }
  `;

  const res = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${integration.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) return [];

  const data = (await res.json()) as {
    data?: { issues?: { nodes?: Array<{ id: string; title: string; url: string; state: { name: string } }> } };
  };

  return (data.data?.issues?.nodes ?? []).map((n) => ({
    id: n.id,
    title: n.title,
    status: n.state.name,
    url: n.url,
  }));
}
