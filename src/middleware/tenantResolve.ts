import { eq, and } from "drizzle-orm";
import { db } from "../db/client.ts";
import { members, organizations, orgIntegrations } from "../db/schema.ts";
import { redis } from "../lib/redis.ts";
import type { Organization, Member, OrgIntegration } from "../db/schema.ts";

export type TenantContext = {
  org: Organization;
  member: Member;
  integrations: OrgIntegration[];
};

export async function resolveTenant(
  telegramId: number
): Promise<TenantContext | null> {
  const cacheKey = `tenant:${telegramId}`;
  const cached = await redis.get<TenantContext>(cacheKey);
  if (cached) return cached;

  const rows = await db
    .select()
    .from(members)
    .innerJoin(organizations, eq(members.orgId, organizations.id))
    .where(eq(members.telegramId, telegramId))
    .limit(1);

  if (!rows[0]) return null;

  const { members: member, organizations: org } = rows[0];

  const integrations = await db
    .select()
    .from(orgIntegrations)
    .where(eq(orgIntegrations.orgId, org.id));

  const ctx: TenantContext = { org, member, integrations };
  await redis.set(cacheKey, ctx, { ex: 300 });
  return ctx;
}

