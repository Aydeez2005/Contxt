import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "../../db/client.ts";
import { members, memberSnapshots } from "../../db/schema.ts";
import { buildMemberSnapshot } from "../../context/memberSnapshot.ts";
import type { OrgContext, ToolResult } from "../types.ts";

const Input = z.object({ member_name: z.string() });

function fuzzyMatch(query: string, candidates: { id: string; displayName: string | null; telegramUsername: string | null }[]) {
  const q = query.toLowerCase();
  return candidates.find(
    (m) =>
      m.displayName?.toLowerCase().includes(q) ||
      m.telegramUsername?.toLowerCase().includes(q)
  ) ?? null;
}

export async function whoIsWorkingOn(
  rawInput: unknown,
  ctx: OrgContext
): Promise<ToolResult> {
  const parsed = Input.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: "Invalid input: member_name is required." };
  }

  const orgMembers = await db
    .select({ id: members.id, displayName: members.displayName, telegramUsername: members.telegramUsername })
    .from(members)
    .where(and(eq(members.orgId, ctx.org.id), eq(members.isActive, true)));

  const matched = fuzzyMatch(parsed.data.member_name, orgMembers);
  if (!matched) {
    return {
      success: false,
      error: `No active member found matching "${parsed.data.member_name}".`,
    };
  }

  const [snapshot] = await db
    .select()
    .from(memberSnapshots)
    .where(
      and(
        eq(memberSnapshots.orgId, ctx.org.id),
        eq(memberSnapshots.memberId, matched.id)
      )
    )
    .limit(1);

  const isStale =
    !snapshot ||
    Date.now() - new Date(snapshot.updatedAt!).getTime() > 15 * 60 * 1000;

  const fresh = isStale
    ? await buildMemberSnapshot(matched.id, ctx)
    : snapshot;

  return {
    success: true,
    data: {
      member: matched.displayName ?? matched.telegramUsername,
      activeTasks: fresh.activeTasks,
      blockers: fresh.blockers,
      lastActivity: fresh.lastActivity,
      calendarStatus: fresh.calendarStatus,
    },
  };
}
