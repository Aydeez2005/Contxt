import type { Context } from "hono";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "../db/client.ts";
import { members, organizations, memberSnapshots } from "../db/schema.ts";
import { redis } from "../lib/redis.ts";
import type { MemberMeta } from "../db/schema.ts";

const InviteMemberSchema = z.object({
  telegramId: z.number().int(),
  displayName: z.string().optional(),
  role: z.enum(["admin", "member"]).default("member"),
});

async function requireOrg(slug: string) {
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, slug))
    .limit(1);
  return org ?? null;
}

export async function listMembers(c: Context) {
  const slug = c.req.param("slug");
  if (!slug) return c.json({ error: "Missing slug." }, 400);

  const org = await requireOrg(slug);
  if (!org) return c.json({ error: "Org not found." }, 404);

  const result = await db
    .select({
      id: members.id,
      telegramUsername: members.telegramUsername,
      displayName: members.displayName,
      role: members.role,
      isActive: members.isActive,
      joinedAt: members.joinedAt,
    })
    .from(members)
    .where(eq(members.orgId, org.id));

  return c.json(result);
}

export async function inviteMember(c: Context) {
  const slug = c.req.param("slug");
  if (!slug) return c.json({ error: "Missing slug." }, 400);

  const org = await requireOrg(slug);
  if (!org) return c.json({ error: "Org not found." }, 404);

  const body = await c.req.json().catch(() => null);
  const parsed = InviteMemberSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: z.flattenError(parsed.error) }, 400);

  const { telegramId, displayName, role } = parsed.data;

  const existing = await db
    .select({ id: members.id })
    .from(members)
    .where(and(eq(members.orgId, org.id), eq(members.telegramId, telegramId)))
    .limit(1);

  if (existing[0]) return c.json({ error: "Member already exists." }, 409);

  const inserted = await db
    .insert(members)
    .values({ orgId: org.id, telegramId, displayName: displayName ?? null, role, isActive: true, joinedAt: new Date() })
    .returning({ id: members.id });

  await redis.del(`tenant:${telegramId}`);

  return c.json({ memberId: inserted[0].id }, 201);
}

const PatchMemberSchema = z.object({
  displayName: z.string().optional(),
  metadata: z.object({
    jiraEmail: z.email().optional(),
    linearEmail: z.email().optional(),
    slackUserId: z.string().optional(),
    githubLogin: z.string().optional(),
    calendarEmail: z.email().optional(),
  }).optional(),
});

export async function patchMember(c: Context) {
  const slug = c.req.param("slug");
  const memberId = c.req.param("memberId");
  if (!slug || !memberId) return c.json({ error: "Missing slug or memberId." }, 400);

  const org = await requireOrg(slug);
  if (!org) return c.json({ error: "Org not found." }, 404);

  const [member] = await db
    .select()
    .from(members)
    .where(and(eq(members.id, memberId), eq(members.orgId, org.id)))
    .limit(1);

  if (!member) return c.json({ error: "Member not found." }, 404);

  const body = await c.req.json().catch(() => null);
  const parsed = PatchMemberSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: z.flattenError(parsed.error) }, 400);

  const { displayName, metadata } = parsed.data;

  const mergedMeta: MemberMeta = { ...(member.metadata ?? {}), ...(metadata ?? {}) };

  await db
    .update(members)
    .set({
      ...(displayName !== undefined ? { displayName } : {}),
      metadata: mergedMeta,
    })
    .where(eq(members.id, memberId));

  await redis.del(`snapshot:${memberId}`);

  return c.json({ ok: true });
}

const INVITE_TTL = 60 * 60 * 24 * 7; // 7 days

function inviteKey(token: string) {
  return `invite:${token}`;
}

export async function createInviteLink(c: Context) {
  const slug = c.req.param("slug");
  if (!slug) return c.json({ error: "Missing slug." }, 400);

  const org = await requireOrg(slug);
  if (!org) return c.json({ error: "Org not found." }, 404);

  const token = crypto.randomUUID().replace(/-/g, "");
  await redis.set(inviteKey(token), { orgId: org.id, slug }, { ex: INVITE_TTL });

  const botUsername = org.telegramBotUsername ?? "Cotxtbot";
  const link = `https://t.me/${botUsername}?start=${token}`;

  return c.json({ link, expiresIn: "7 days" });
}

export async function redeemInvite(
  token: string,
  telegramId: number,
  displayName: string | null,
  telegramUsername: string | null
): Promise<{ orgId: string; memberId: string } | null> {
  const stored = await redis.get<{ orgId: string; slug: string }>(inviteKey(token));
  if (!stored) return null;

  await redis.del(inviteKey(token));

  const existing = await db
    .select({ id: members.id })
    .from(members)
    .where(and(eq(members.orgId, stored.orgId), eq(members.telegramId, telegramId)))
    .limit(1);

  if (existing[0]) return { orgId: stored.orgId, memberId: existing[0].id };

  const inserted = await db
    .insert(members)
    .values({
      orgId: stored.orgId,
      telegramId,
      displayName,
      telegramUsername,
      role: "member",
      isActive: true,
      joinedAt: new Date(),
    })
    .returning({ id: members.id });

  await redis.del(`tenant:${telegramId}`);

  return { orgId: stored.orgId, memberId: inserted[0].id };
}

export async function getMemberSnapshots(c: Context) {
  const slug = c.req.param("slug");
  if (!slug) return c.json({ error: "Missing slug." }, 400);

  const org = await requireOrg(slug);
  if (!org) return c.json({ error: "Org not found." }, 404);

  const rows = await db
    .select({
      memberId: memberSnapshots.memberId,
      activeTasks: memberSnapshots.activeTasks,
      blockers: memberSnapshots.blockers,
      calendarStatus: memberSnapshots.calendarStatus,
      updatedAt: memberSnapshots.updatedAt,
    })
    .from(memberSnapshots)
    .where(eq(memberSnapshots.orgId, org.id));

  return c.json(rows);
}

export async function removeMember(c: Context) {
  const slug = c.req.param("slug");
  const memberId = c.req.param("memberId");
  if (!slug || !memberId) return c.json({ error: "Missing slug or memberId." }, 400);

  const org = await requireOrg(slug);
  if (!org) return c.json({ error: "Org not found." }, 404);

  const [member] = await db
    .select()
    .from(members)
    .where(and(eq(members.id, memberId), eq(members.orgId, org.id)))
    .limit(1);

  if (!member) return c.json({ error: "Member not found." }, 404);

  await db.update(members).set({ isActive: false }).where(eq(members.id, memberId));
  await redis.del(`tenant:${member.telegramId}`);

  return c.json({ ok: true });
}
