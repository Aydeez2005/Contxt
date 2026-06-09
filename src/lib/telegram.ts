const API = (token: string) => `https://api.telegram.org/bot${token}`;

function token(): string {
  const t = process.env.TELEGRAM_BOT_TOKEN;
  if (!t) throw new Error("TELEGRAM_BOT_TOKEN is not set");
  return t;
}

export async function sendMessage(chatId: number, text: string): Promise<void> {
  await fetch(`${API(token())}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  }).catch(() => null);
}

export async function setWebhook(url: string): Promise<{ ok: boolean; description?: string }> {
  const res = await fetch(`${API(token())}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url,
      secret_token: process.env.TELEGRAM_WEBHOOK_SECRET ?? "",
      allowed_updates: ["message"],
    }),
  });
  return res.json() as Promise<{ ok: boolean; description?: string }>;
}

export async function getBotInfo(): Promise<{ id: number; username: string; first_name: string } | null> {
  const res = await fetch(`${API(token())}/getMe`);
  if (!res.ok) return null;
  const data = await res.json() as { ok: boolean; result?: { id: number; username: string; first_name: string } };
  return data.result ?? null;
}

export function isBotConfigured(): boolean {
  return !!process.env.TELEGRAM_BOT_TOKEN;
}
