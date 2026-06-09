import type { Context } from "hono";
import { resolveTenant } from "../middleware/tenantResolve.ts";
import { runOrchestrator } from "../agent/orchestrator.ts";
import { sendMessage } from "../lib/telegram.ts";
import { logger } from "../lib/logger.ts";

export async function handleTelegramWebhook(c: Context) {
  const body = await c.req.json().catch(() => null);
  if (!body?.message) return c.json({ ok: true });

  const { text, from, chat } = body.message;
  const telegramId: number = from?.id;
  const chatId: number = chat?.id;

  if (!telegramId || !chatId) return c.json({ ok: true });

  // /start command — tell the user their Telegram ID so they can give it to their admin
  if (text?.startsWith("/start")) {
    await sendMessage(chatId,
      `Welcome to Contxt!\n\nYour Telegram ID is: ${telegramId}\n\nShare this with your workspace admin so they can add you.`
    );
    return c.json({ ok: true });
  }

  if (!text) return c.json({ ok: true });

  const tenant = await resolveTenant(telegramId).catch(() => null);

  if (!tenant) {
    await sendMessage(chatId,
      `You're not registered in any workspace yet.\n\nYour Telegram ID is: ${telegramId}\n\nShare this with your admin to get access.`
    );
    return c.json({ ok: true });
  }

  if (!tenant.member.isActive) {
    await sendMessage(chatId, "Your seat is inactive. Contact your workspace admin.");
    return c.json({ ok: true });
  }

  const reply = await runOrchestrator({
    org: tenant.org,
    member: tenant.member,
    integrations: tenant.integrations,
    text,
    chatId,
  }).catch((e) => {
    logger.error({ err: e, telegramId, orgId: tenant.org.id }, "Orchestrator error");
    return "Something went wrong. Please try again in a moment.";
  });

  await sendMessage(chatId, reply);
  return c.json({ ok: true });
}
