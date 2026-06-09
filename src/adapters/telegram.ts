import type { Context } from "hono";
import { resolveTenant } from "../middleware/tenantResolve.ts";
import { redeemInvite } from "../admin/members.ts";
import { runOrchestrator } from "../agent/orchestrator.ts";
import { sendMessage } from "../lib/telegram.ts";
import { logger } from "../lib/logger.ts";

export async function handleTelegramWebhook(c: Context) {
  const body = await c.req.json().catch(() => null);
  if (!body?.message) return c.json({ ok: true });

  const { text, from, chat } = body.message;
  const telegramId: number = from?.id;
  const chatId: number = chat?.id;
  const firstName: string = from?.first_name ?? null;
  const username: string = from?.username ?? null;

  if (!telegramId || !chatId) return c.json({ ok: true });

  // /start <token> — invite deep link, auto-register the user
  if (text?.startsWith("/start")) {
    const token = text.split(" ")[1]?.trim();

    if (token) {
      const result = await redeemInvite(token, telegramId, firstName, username).catch(() => null);
      if (result) {
        await sendMessage(chatId,
          `Welcome to Contxt! 🎉\n\nYou've been added to your workspace. Go ahead and ask me anything — try "What is the team working on?" to get started.`
        );
        return c.json({ ok: true });
      }
      await sendMessage(chatId, `That invite link has expired or already been used. Ask your admin for a new one.`);
      return c.json({ ok: true });
    }

    // Plain /start with no token
    await sendMessage(chatId,
      `Welcome to Contxt!\n\nTo join a workspace, ask your admin to generate an invite link for you.`
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
