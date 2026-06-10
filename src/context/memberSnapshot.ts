import { eq, and } from "drizzle-orm";
import { db } from "../db/client.ts";
import { members, memberSnapshots } from "../db/schema.ts";
import { redis } from "../lib/redis.ts";
import { logger } from "../lib/logger.ts";
import { getAssignedIssues as getJiraIssues } from "../agent/tools/jira.ts";
import { getAssignedIssues as getLinearIssues } from "../agent/tools/linear.ts";
import { getRecentMessages as getSlackMessages } from "../agent/tools/slack.ts";
import { getOpenPRs } from "../agent/tools/github.ts";
import { getCurrentStatus as getCalendarStatus } from "../agent/tools/calendar.ts";
import type { OrgContext } from "../agent/types.ts";
import type { MemberSnapshot } from "../db/schema.ts";

const SNAPSHOT_TTL = 900;

function snapshotCacheKey(memberId: string) {
  return `snapshot:${memberId}`;
}

export async function buildMemberSnapshot(
  memberId: string,
  ctx: OrgContext
): Promise<MemberSnapshot> {
  const cached = await redis.get<MemberSnapshot>(snapshotCacheKey(memberId));
  if (cached) return cached;

  const [member] = await db
    .select()
    .from(members)
    .where(and(eq(members.id, memberId), eq(members.orgId, ctx.org.id)))
    .limit(1);

  if (!member) throw new Error(`Member ${memberId} not found in org ${ctx.org.id}`);

  const meta = member.metadata ?? {};

  const [jiraTasks, linearTasks, slackMsgs, prs, calStatus] = await Promise.allSettled([
    meta.jiraEmail ? getJiraIssues(meta.jiraEmail, ctx.integrations) : Promise.resolve([]),
    meta.linearEmail ? getLinearIssues(meta.linearEmail, ctx.integrations) : Promise.resolve([]),
    meta.slackUserId ? getSlackMessages(meta.slackUserId, ctx.integrations) : Promise.resolve([]),
    meta.githubLogin ? getOpenPRs(meta.githubLogin, ctx.integrations) : Promise.resolve([]),
    meta.calendarEmail ? getCalendarStatus(meta.calendarEmail, ctx.integrations) : Promise.resolve({ status: "available" as const, nextEvent: null }),
  ]);

  const activeTasks = [
    ...(jiraTasks.status === "fulfilled"
      ? jiraTasks.value.map((t) => ({ ...t, tool: "jira" }))
      : []),
    ...(linearTasks.status === "fulfilled"
      ? linearTasks.value.map((t) => ({ ...t, tool: "linear" }))
      : []),
    ...(prs.status === "fulfilled"
      ? prs.value.map((pr) => ({ id: String(pr.id), title: pr.title, status: pr.state, url: pr.url, tool: "github" }))
      : []),
  ];

  const slackMessages = slackMsgs.status === "fulfilled" ? slackMsgs.value : [];
  const blockers = slackMessages
    .filter((m) => /blocked|stuck|waiting on/i.test(m.text))
    .map((m) => ({ description: m.text, source_tool: "slack", url: "" }));

  const lastSlack = slackMessages[0];
  const lastActivity = lastSlack
    ? { tool: "slack", description: lastSlack.text.slice(0, 200), timestamp: lastSlack.timestamp }
    : null;

  const cal = calStatus.status === "fulfilled"
    ? calStatus.value
    : { status: "available" as const, nextEvent: null };

  const rawContext = `Member: ${member.displayName ?? member.telegramUsername ?? ""}
Active tasks: ${activeTasks.map((t) => t.title).join(", ")}
Blockers: ${blockers.map((b) => b.description).join(", ")}
Calendar: ${cal.status}`;

  const now = new Date();

  await db
    .insert(memberSnapshots)
    .values({
      orgId: ctx.org.id,
      memberId,
      activeTasks,
      blockers,
      lastActivity,
      calendarStatus: cal.status,
      rawContext,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [memberSnapshots.orgId, memberSnapshots.memberId],
      set: {
        activeTasks,
        blockers,
        lastActivity,
        calendarStatus: cal.status,
        rawContext,
        updatedAt: now,
      },
    })
    .catch((e) => logger.warn({ err: e }, "snapshot upsert failed"));

  const [snapshot] = await db
    .select()
    .from(memberSnapshots)
    .where(eq(memberSnapshots.memberId, memberId))
    .limit(1);

  await redis.set(snapshotCacheKey(memberId), snapshot, { ex: SNAPSHOT_TTL });

  return snapshot;
}
