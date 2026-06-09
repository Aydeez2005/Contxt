import type { Context } from "hono";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../db/client.ts";
import { organizations, members } from "../db/schema.ts";
import { logger } from "../lib/logger.ts";

const SubscribeSchema = z.object({ seatCount: z.number().int().min(1).default(5) });

type SimulatedSubscription = {
  orgId: string;
  seatCount: number;
  plan: string;
  status: "active" | "cancelled";
  createdAt: string;
};

const subscriptions = new Map<string, SimulatedSubscription>();

export function getSubscriptionByOrgId(orgId: string): SimulatedSubscription | null {
  return subscriptions.get(orgId) ?? null;
}

export async function createCheckout(c: Context) {
  const slug = c.req.param("slug");
  if (!slug) return c.json({ error: "Missing slug." }, 400);

  const body = await c.req.json().catch(() => null);
  const parsed = SubscribeSchema.safeParse(body ?? {});
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

  const [org] = await db.select().from(organizations).where(eq(organizations.slug, slug)).limit(1);
  if (!org) return c.json({ error: "Org not found." }, 404);

  const sub: SimulatedSubscription = {
    orgId: org.id,
    seatCount: parsed.data.seatCount,
    plan: "starter",
    status: "active",
    createdAt: new Date().toISOString(),
  };

  subscriptions.set(org.id, sub);
  logger.info({ orgId: org.id, seatCount: parsed.data.seatCount }, "Simulated subscription created");

  return c.json({
    simulated: true,
    message: "Subscription activated (simulated — no real charge).",
    orgId: org.id,
    plan: "starter",
    seatCount: parsed.data.seatCount,
  });
}

export async function cancelSubscription(c: Context) {
  const slug = c.req.param("slug");
  if (!slug) return c.json({ error: "Missing slug." }, 400);

  const [org] = await db.select().from(organizations).where(eq(organizations.slug, slug)).limit(1);
  if (!org) return c.json({ error: "Org not found." }, 404);

  subscriptions.delete(org.id);
  await db.update(members).set({ isActive: false }).where(eq(members.orgId, org.id));
  logger.info({ orgId: org.id }, "Simulated subscription cancelled");

  return c.json({ simulated: true, message: "Subscription cancelled. All members deactivated." });
}

export async function getSubscription(c: Context) {
  const slug = c.req.param("slug");
  if (!slug) return c.json({ error: "Missing slug." }, 400);

  const [org] = await db.select().from(organizations).where(eq(organizations.slug, slug)).limit(1);
  if (!org) return c.json({ error: "Org not found." }, 404);

  const sub = subscriptions.get(org.id);
  return c.json({ plan: sub?.plan ?? "trial", seatLimit: sub?.seatCount ?? 5, subscription: sub ?? null });
}

export async function handleStripeWebhook(c: Context) {
  return c.json({ received: true, note: "Stripe webhooks are simulated." });
}
