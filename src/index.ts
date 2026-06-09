import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger as honoLogger } from "hono/logger";
import { hmacVerify } from "./middleware/hmac.ts";
import { adminAuth } from "./middleware/adminAuth.ts";
import { handleTelegramWebhook } from "./adapters/telegram.ts";
import { createOrg, getOrg, registerBot, listIntegrations, addIntegration } from "./admin/onboarding.ts";
import { createCheckout, cancelSubscription, getSubscription, handleStripeWebhook } from "./admin/billing.ts";
import { listMembers, inviteMember, patchMember, removeMember, createInviteLink } from "./admin/members.ts";
import { oauthConnect, oauthCallback } from "./admin/oauth.ts";
import { testQuery } from "./admin/query.ts";
import { startRefreshLoop } from "./context/refresh.ts";
import { setWebhook, getBotInfo, isBotConfigured } from "./lib/telegram.ts";
import { logger } from "./lib/logger.ts";

const app = new Hono();

app.use("*", honoLogger());
app.use("*", cors({ origin: "*", allowHeaders: ["Content-Type", "Authorization"] }));

app.get("/health", async (c) => {
  const bot = isBotConfigured() ? await getBotInfo().catch(() => null) : null;
  return c.json({
    status: "ok",
    ts: new Date().toISOString(),
    redis: !!(process.env.UPSTASH_REDIS_REST_URL),
    db: !!(process.env.DATABASE_URL),
    ai: !!(process.env.ANTHROPIC_API_KEY),
    bot: bot ? { username: bot.username, id: bot.id } : null,
  });
});

// Single shared bot — all orgs route through one webhook
app.post("/webhook/telegram", hmacVerify, handleTelegramWebhook);

// Register the global webhook with Telegram (call once after deploy)
app.post("/admin/bot/webhook", async (c) => {
  const baseUrl = process.env.BASE_URL;
  if (!baseUrl) return c.json({ error: "BASE_URL is not set." }, 400);
  if (!isBotConfigured()) return c.json({ error: "TELEGRAM_BOT_TOKEN is not set." }, 400);

  const webhookUrl = `${baseUrl}/webhook/telegram`;
  const result = await setWebhook(webhookUrl);

  if (!result.ok) return c.json({ error: result.description ?? "Failed to set webhook." }, 502);

  const bot = await getBotInfo();
  logger.info({ webhookUrl, bot: bot?.username }, "Telegram webhook registered");
  return c.json({ ok: true, webhookUrl, bot: bot?.username ?? null });
});

// Org registration — public
app.post("/admin/orgs", createOrg);

// Protected admin routes
app.get("/admin/orgs/:slug", adminAuth, getOrg);
app.post("/admin/orgs/:slug/bot", adminAuth, registerBot);
app.get("/admin/orgs/:slug/integrations", adminAuth, listIntegrations);
app.post("/admin/orgs/:slug/integrations/:service", adminAuth, addIntegration);
app.get("/admin/orgs/:slug/members", adminAuth, listMembers);
app.post("/admin/orgs/:slug/members/invite", adminAuth, inviteMember);
app.post("/admin/orgs/:slug/invite-link", adminAuth, createInviteLink);
app.patch("/admin/orgs/:slug/members/:memberId", adminAuth, patchMember);
app.delete("/admin/orgs/:slug/members/:memberId", adminAuth, removeMember);
app.get("/admin/orgs/:slug/integrations/:service/connect", adminAuth, oauthConnect);
app.get("/oauth/callback/:service", oauthCallback);
app.post("/admin/orgs/:slug/subscribe", adminAuth, createCheckout);
app.delete("/admin/orgs/:slug/subscribe", adminAuth, cancelSubscription);
app.get("/admin/orgs/:slug/billing", adminAuth, getSubscription);
app.post("/admin/orgs/:slug/query", adminAuth, testQuery);
app.post("/webhooks/stripe", handleStripeWebhook);

const port = Number(process.env.PORT ?? 3001);

startRefreshLoop();

export default { port, fetch: app.fetch };

logger.info(
  { port, bot: isBotConfigured(), redis: !!(process.env.UPSTASH_REDIS_REST_URL), db: !!(process.env.DATABASE_URL), ai: !!(process.env.ANTHROPIC_API_KEY) },
  "Contxt server starting"
);
