import type { Context } from "hono";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../db/client.ts";
import { organizations, members, orgIntegrations } from "../db/schema.ts";
import { redis } from "../lib/redis.ts";
import { getBotInfo, isBotConfigured } from "../lib/telegram.ts";
import { logger } from "../lib/logger.ts";

const CreateOrgSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  adminTelegramId: z.number().int(),
  adminDisplayName: z.string().optional(),
});

const AddIntegrationSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().optional(),
  expiresAt: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function createOrg(c: Context) {
  const body = await c.req.json().catch(() => null);
  const parsed = CreateOrgSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

  const { name, slug, adminTelegramId, adminDisplayName } = parsed.data;

  const existing = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.slug, slug))
    .limit(1);

  if (existing[0]) return c.json({ error: "Slug already taken." }, 409);

  const adminToken = crypto.randomUUID();

  const org = await db
    .insert(organizations)
    .values({ name, slug, adminToken, createdAt: new Date() })
    .returning({ id: organizations.id });

  const orgId = org[0].id;

  await db.insert(members).values({
    orgId,
    telegramId: adminTelegramId,
    displayName: adminDisplayName ?? null,
    role: "admin",
    isActive: true,
    joinedAt: new Date(),
  });

  logger.info({ orgId, slug }, "Org created");

  const bot = isBotConfigured() ? await getBotInfo().catch(() => null) : null;

  return c.json({
    orgId,
    slug,
    adminToken,
    bot: bot ? `@${bot.username}` : null,
    nextSteps: [
      `1. Your team members message @${bot?.username ?? "ContxtBot"} on Telegram`,
      `2. They send /start to get their Telegram ID`,
      `3. Add them: POST /admin/orgs/${slug}/members/invite { telegramId: <id> }`,
    ],
  });
}

// Kept for dashboard display — stores nothing sensitive, just syncs bot username to org record
export async function registerBot(c: Context) {
  const slug = c.req.param("slug");
  if (!slug) return c.json({ error: "Missing slug." }, 400);

  if (!isBotConfigured()) return c.json({ error: "TELEGRAM_BOT_TOKEN is not configured on the server." }, 400);

  const [org] = await db.select({ id: organizations.id }).from(organizations).where(eq(organizations.slug, slug)).limit(1);
  if (!org) return c.json({ error: "Org not found." }, 404);

  const bot = await getBotInfo();
  if (!bot) return c.json({ error: "Could not reach Telegram API." }, 502);

  await db.update(organizations).set({ telegramBotUsername: bot.username }).where(eq(organizations.id, org.id));
  await redis.del(`tenant:${org.id}`);

  return c.json({ ok: true, botUsername: bot.username });
}

export async function listIntegrations(c: Context) {
  const slug = c.req.param("slug");
  if (!slug) return c.json({ error: "Missing slug." }, 400);

  const [org] = await db.select().from(organizations).where(eq(organizations.slug, slug)).limit(1);
  if (!org) return c.json({ error: "Org not found." }, 404);

  const integrations = await db
    .select({ id: orgIntegrations.id, service: orgIntegrations.service, createdAt: orgIntegrations.createdAt })
    .from(orgIntegrations)
    .where(eq(orgIntegrations.orgId, org.id));

  return c.json(integrations);
}

export async function addIntegration(c: Context) {
  const slug = c.req.param("slug");
  const service = c.req.param("service");
  if (!slug || !service) return c.json({ error: "Missing slug or service." }, 400);

  const body = await c.req.json().catch(() => null);
  const parsed = AddIntegrationSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

  const [org] = await db.select().from(organizations).where(eq(organizations.slug, slug)).limit(1);
  if (!org) return c.json({ error: "Org not found." }, 404);

  await db
    .insert(orgIntegrations)
    .values({
      orgId: org.id,
      service,
      accessToken: parsed.data.accessToken,
      refreshToken: parsed.data.refreshToken ?? null,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
      metadata: parsed.data.metadata ?? null,
      createdAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [orgIntegrations.orgId, orgIntegrations.service],
      set: {
        accessToken: parsed.data.accessToken,
        refreshToken: parsed.data.refreshToken ?? null,
        expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
        metadata: parsed.data.metadata ?? null,
      },
    });

  await redis.del(`tenant:${org.id}`);

  return c.json({ ok: true, service });
}

export async function getOrg(c: Context) {
  const slug = c.req.param("slug");
  if (!slug) return c.json({ error: "Missing slug." }, 400);

  const [org] = await db
    .select({ id: organizations.id, name: organizations.name, slug: organizations.slug, telegramBotUsername: organizations.telegramBotUsername })
    .from(organizations)
    .where(eq(organizations.slug, slug))
    .limit(1);

  if (!org) return c.json({ error: "Org not found." }, 404);

  const bot = isBotConfigured() ? await getBotInfo().catch(() => null) : null;

  return c.json({
    ...org,
    telegramBotToken: undefined,
    botConfigured: isBotConfigured(),
    botUsername: bot?.username ?? org.telegramBotUsername ?? null,
  });
}
