import type { Context } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../db/client.ts";
import { members } from "../db/schema.ts";
import { redis } from "../lib/redis.ts";
import { resolveTenant } from "../middleware/tenantResolve.ts";
import { redeemInvite } from "../admin/members.ts";
import { runOrchestrator } from "../agent/orchestrator.ts";
import { sendMessage } from "../lib/telegram.ts";
import { logger } from "../lib/logger.ts";
import type { MemberMeta } from "../db/schema.ts";

const LINK_FIELDS: Record<string, keyof MemberMeta> = {
  jira: "jiraEmail",
  linear: "linearEmail",
  slack: "slackUserId",
  github: "githubLogin",
  gcal: "calendarEmail",
};

async function handleLinkCommand(
  chatId: number,
  memberId: string,
  args: string
): Promise<void> {
  const parts = args.trim().split(/\s+/);
  const service = parts[0]?.toLowerCase();
  const value = parts[1];

  if (!service || !value) {
    await sendMessage(
      chatId,
      `Usage: /link <service> <value>\n\nSupported services:\n• jira <email>\n• linear <email>\n• slack <userId>\n• github <username>\n• gcal <email>`
    );
    return;
  }

  const field = LINK_FIELDS[service];
  if (!field) {
    await sendMessage(chatId, `Unknown service "${service}". Supported: jira, linear, slack, github, gcal`);
    return;
  }

  const [member] = await db.select().from(members).where(eq(members.id, memberId)).limit(1);
  if (!member) {
    await sendMessage(chatId, "Could not find your member record.");
    return;
  }

  const merged: MemberMeta = { ...(member.metadata ?? {}), [field]: value };
  await db.update(members).set({ metadata: merged }).where(eq(members.id, memberId));
  await redis.del(`snapshot:${memberId}`);
  await redis.del(`tenant:${member.telegramId}`);

  await sendMessage(chatId, `Linked! Your ${service} identity is now set to: ${value}`);
}

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

  // /link <service> <value> — member self-service identity linking
  if (text?.startsWith("/link")) {
    const tenant = await resolveTenant(telegramId).catch(() => null);
    if (!tenant) {
      await sendMessage(chatId, "You're not registered in any workspace yet.");
      return c.json({ ok: true });
    }
    await handleLinkCommand(chatId, tenant.member.id, text.slice("/link".length));
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
