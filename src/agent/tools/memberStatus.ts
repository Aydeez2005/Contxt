import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "../../db/client.ts";
import { memberSnapshots } from "../../db/schema.ts";
import { buildMemberSnapshot } from "../../context/memberSnapshot.ts";
import type { OrgContext, ToolResult } from "../types.ts";

const Input = z.object({ member_id: z.string().uuid() });

export async function memberStatus(
  rawInput: unknown,
  ctx: OrgContext
): Promise<ToolResult> {
  const parsed = Input.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: "Invalid input: member_id must be a UUID." };
  }

  const [snapshot] = await db
    .select()
    .from(memberSnapshots)
    .where(
      and(
        eq(memberSnapshots.orgId, ctx.org.id),
        eq(memberSnapshots.memberId, parsed.data.member_id)
      )
    )
    .limit(1);

  const isStale =
    !snapshot ||
    Date.now() - new Date(snapshot.updatedAt!).getTime() > 15 * 60 * 1000;

  const fresh = isStale
    ? await buildMemberSnapshot(parsed.data.member_id, ctx)
    : snapshot;

  return {
    success: true,
    data: {
      memberId: parsed.data.member_id,
      activeTasks: fresh.activeTasks,
      blockers: fresh.blockers,
      lastActivity: fresh.lastActivity,
      calendarStatus: fresh.calendarStatus,
    },
  };
}
