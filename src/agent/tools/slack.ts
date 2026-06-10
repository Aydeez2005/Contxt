import type { OrgIntegration } from "../../db/schema.ts";
import { getValidToken } from "../../lib/tokenRefresh.ts";

export type SlackMessage = {
  text: string;
  timestamp: string;
  channel: string;
};

export async function getRecentMessages(
  slackUserId: string,
  integrations: OrgIntegration[]
): Promise<SlackMessage[]> {
  const integration = integrations.find((i) => i.service === "slack");
  if (!integration) return [];

  const token = await getValidToken(integration);
  const res = await fetch(
    `https://slack.com/api/search.messages?query=from:<@${slackUserId}>&count=5&sort=timestamp`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) return [];

  const data = (await res.json()) as {
    messages?: {
      matches?: Array<{ text: string; ts: string; channel: { name: string } }>;
    };
  };

  return (data.messages?.matches ?? []).map((m) => ({
    text: m.text,
    timestamp: m.ts,
    channel: m.channel.name,
  }));
}
