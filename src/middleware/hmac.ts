import type { Context, Next } from "hono";

export async function hmacVerify(c: Context, next: Next) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret) return await next();

  const token = c.req.header("X-Telegram-Bot-Api-Secret-Token");
  if (!token || token !== secret) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  await next();
}
