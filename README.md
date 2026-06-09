# Contxt

An AI-powered Telegram bot that gives your team instant context — who's working on what, blockers, calendar status — by pulling from Jira, Linear, Slack, GitHub, and Google Calendar.

---

## Prerequisites

Before you start, install these on your machine:

- **Bun** — `curl -fsSL https://bun.sh/install | bash`
- **PostgreSQL database** — use [Neon](https://neon.tech) (free tier, no install needed)
- **Upstash Redis** — use [Upstash](https://upstash.com) (free tier, no install needed)
- **Anthropic API key** — [console.anthropic.com](https://console.anthropic.com)
- **A Telegram bot token** — message [@BotFather](https://t.me/BotFather) on Telegram, send `/newbot`, follow the steps

---

## Step 1 — Clone and install

```bash
git clone <repo-url>
cd contxt
bun install
cd web && bun install && cd ..
```

---

## Step 2 — Set up environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in the required values:

```env
ANTHROPIC_API_KEY=sk-ant-...        # from console.anthropic.com
DATABASE_URL=postgres://...         # from Neon dashboard → Connection string
TELEGRAM_BOT_TOKEN=123456:ABC...    # from @BotFather
BASE_URL=https://...                # your public URL (see Step 3)
PORT=3001
NODE_ENV=development
```

Leave the OAuth and Redis fields empty for now — the bot works without them.

---

## Step 3 — Expose the server publicly (for Telegram webhooks)

Telegram needs a public HTTPS URL to deliver messages to your local server. Use Cloudflare Tunnel (free, no account needed):

```bash
# Install cloudflared
brew install cloudflare/cloudflare/cloudflared   # macOS
# or: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/

# Start a tunnel pointing to your server port
cloudflared tunnel --url http://localhost:3001
```

Copy the generated URL (e.g. `https://something.trycloudflare.com`) and set it as `BASE_URL` in your `.env`.

---

## Step 4 — Push the database schema

```bash
bun run db:push
```

When prompted about the unique constraint, type `y` to confirm.

---

## Step 5 — Start the server

```bash
bun run dev
```

You should see:
```
{"msg":"Contxt server starting","port":3001,"bot":true,"db":true,"ai":true}
```

---

## Step 6 — Register the Telegram webhook

This tells Telegram where to send messages. Run once after starting:

```bash
curl -X POST http://localhost:3001/admin/bot/webhook
```

---

## Step 7 — Find your Telegram ID

Open Telegram, search for **@Cotxtbot** and send any message. Since you're not registered yet, the bot replies asking you to contact your admin — but it also shows your Telegram ID in that message. Note it down.

---

## Step 8 — Create your workspace

```bash
curl -X POST http://localhost:3001/admin/orgs \
  -H "Content-Type: application/json" \
  -d '{"name":"My Team","slug":"my-team","adminTelegramId":<YOUR_TELEGRAM_ID>,"adminDisplayName":"Your Name"}'
```

Save the `adminToken` from the response — you'll need it for all admin API calls.

---

## Step 9 — Test the bot

Message **@Cotxtbot** on Telegram. You should now get a real AI response. Try:
- `Who is working on what?`
- `What's blocking the team?`

---

## Adding teammates

You **do not** create a new bot for each person. Everyone uses the same **@Cotxtbot**.

To add a teammate:

**1. Generate an invite link** (as admin):
```bash
curl -X POST http://localhost:3001/admin/orgs/my-team/invite-link \
  -H "Authorization: <adminToken>"
```

Returns:
```json
{ "link": "https://t.me/Cotxtbot?start=abc123...", "expiresIn": "7 days" }
```

**2. Send the link to your teammate.**

**3. Teammate clicks the link** → opens @Cotxtbot in Telegram → sends `/start` → instantly registered and ready to use.

That's it. No manual API calls needed on their end.

---

## Running the frontend (dashboard)

```bash
bun run web:dev
```

Opens at `http://localhost:3000`.

---

## Running everything at once

```bash
bun run dev:all
```

---

## Useful scripts

| Command | What it does |
|---------|-------------|
| `bun run dev` | Start backend with hot reload |
| `bun run web:dev` | Start frontend dev server |
| `bun run dev:all` | Start both together |
| `bun run db:push` | Sync schema to database |
| `bun run db:studio` | Open visual database browser |

---

## Connecting tools (optional)

Once the bot is working, you can connect Slack, GitHub, Linear, Jira, and Google Calendar so the bot can pull real data.

Each tool requires registering an OAuth app on that service's developer portal to get a Client ID and Secret. See `.env.example` for the variable names and callback URLs.

To connect a tool after adding its credentials to `.env`:

```
GET /admin/orgs/<slug>/integrations/<service>/connect
Authorization: <adminToken>
```

Open that URL in your browser — it redirects to the service login and stores the token automatically.

Services: `slack`, `linear`, `github`, `gcal`, `jira`
