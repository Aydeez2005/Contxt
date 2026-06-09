import type { Context } from "hono";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "../db/client.ts";
import { organizations, members, orgIntegrations } from "../db/schema.ts";
import { runOrchestrator } from "../agent/orchestrator.ts";

const QuerySchema = z.object({
  text: z.string().min(1),
  telegramId: z.number().int(),
});

export async function testQuery(c: Context) {
  const slug = c.req.param("slug");
  if (!slug) return c.json({ error: "Missing slug." }, 400);

  const body = await c.req.json().catch(() => null);
  const parsed = QuerySchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, slug))
    .limit(1);

  if (!org) return c.json({ error: "Org not found." }, 404);

  const [member] = await db
    .select()
    .from(members)
    .where(
      and(
        eq(members.orgId, org.id),
        eq(members.telegramId, parsed.data.telegramId)
      )
    )
    .limit(1);

  if (!member) return c.json({ error: "No member with that telegramId in this org." }, 404);
  if (!member.isActive) return c.json({ error: "Member is inactive." }, 403);

  const integrations = await db
    .select()
    .from(orgIntegrations)
    .where(eq(orgIntegrations.orgId, org.id));

  const reply = await runOrchestrator({
    org,
    member,
    integrations,
    text: parsed.data.text,
    chatId: 0,
  });

  return c.json({ reply, memberId: member.id, orgId: org.id });
}
