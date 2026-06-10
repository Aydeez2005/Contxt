# Contxt — Update Log

## 2026-06-10

### ✅ Frontend: Graph page — built
- Installed `@xyflow/react` (react-flow v12)
- Added `GET /admin/orgs/:slug/snapshots` backend endpoint (`getMemberSnapshots` in `members.ts`)
- Added `api.getSnapshots(slug)` to `api.ts`
- Created `web/src/app/dashboard/[slug]/graph/page.tsx` with react-flow canvas
  - Members as nodes (left column) — show name, task count, blocker count, calendar status
  - Connected tools as nodes (ring layout around center)
  - Edges: member → tool for each tool they have active tasks in
  - Dashed red edges: member → member for blocker relationships detected by name matching
- Added "Graph" to the sidebar nav

### ✅ Frontend: OAuth connect button — built
- Added `api.oauthConnectUrl(slug, service)` to `api.ts` — builds the redirect URL with the admin token as a query param
- Updated `adminAuth` middleware to also accept `?token=` query param (needed for browser-initiated OAuth redirects)
- Updated integrations page: OAuth services (jira, linear, slack, github, gcal) now open the backend redirect URL in a new tab; Notion keeps the manual token dialog
- Page auto-reloads after 5s to pick up newly connected integrations

### ✅ Frontend: invite link generator — built
- Added `api.createInviteLink(slug)` to `web/src/lib/api.ts`
- Added invite link card to members page with "Generate link" button + copy-to-clipboard
- Link is displayed inline below the card description after generation

### ✅ org_embeddings indexing pipeline — built
- Created `src/context/indexEmbeddings.ts` with `indexOrgContent(orgId, integrations)`
- Indexes Notion pages (title, URL, last-edited) into `org_embeddings` as keyword-searchable content
- Upserts on `(orgId, sourceTool, sourceId)` — added that unique constraint to schema
- Hooked into `refresh.ts` — runs every 10 minutes alongside snapshot refresh
- Note: vector embeddings require a separate embeddings API (not Anthropic); content is stored as plain text for keyword search in the meantime
- **Requires DB migration** for the new `org_embeddings` unique constraint

### ✅ OAuth token refresh — built
- Created `src/lib/tokenRefresh.ts` with `getValidToken(integration)` utility
- Checks `expiresAt`; if expired or within 5 minutes, exchanges the stored `refreshToken` via each service's token URL
- Wired into all 6 tool clients: jira, linear, slack, github, calendar, notion

### ✅ Telegram /link command — built
- Added `/link <service> <value>` handler in `telegram.ts`
- Supports: `jira <email>`, `linear <email>`, `slack <userId>`, `github <username>`, `gcal <email>`
- Updates member metadata in DB, invalidates snapshot + tenant cache

### ✅ Notion tool — wired
- Created `src/agent/tools/notionSearch.ts` wrapping the existing `notion.ts#searchPages`
- Added `notionSearch` tool definition to `src/agent/tools/index.ts`
- Imported and dispatched `notionSearch` in `orchestrator.ts`

### ✅ member_snapshots unique constraint bug — fixed
- Added `unique().on(t.orgId, t.memberId)` constraint to `memberSnapshots` table in `schema.ts`
- Updated `onConflictDoUpdate` target in `memberSnapshot.ts` to `[memberSnapshots.orgId, memberSnapshots.memberId]`
- **Requires DB migration:** run `bunx drizzle-kit generate && bunx drizzle-kit migrate` to apply the new constraint

---

## 2026-06-11

### Session
- Ran `bunx drizzle-kit push` — applied both new unique constraints (`member_snapshots`, `org_embeddings`) ✅
- Upstash Redis token expired (credentials belonged to someone else) — blanked out in `.env`, now using in-memory fallback for local dev
- Redesigned graph page: Obsidian-style circular nodes, task nodes between members and tools, red dashed blocker edges
- Added `scripts/seed-demo.ts` — seeds 8 members, 6 integrations, 29 tasks, 5 blockers into demo org

---

### 📋 Cedrick — todos for tomorrow

**1. Replace mock data on dashboard pages**
The overview, bot setup, and test agent pages still use hardcoded `MOCK_*` data from `web/src/data/mock.ts`.
Swap them out to pull from the real API (same pattern as members/integrations pages which already use `useDashboard()`).
Files: `web/src/app/dashboard/[slug]/page.tsx`, `bot/page.tsx`, `test/page.tsx`

**2. Set up a new Upstash Redis instance**
Old credentials are dead. Create a free database at https://console.upstash.com, then add to `.env`:
```
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```
Restart the backend after. Without Redis, caches reset on every server restart.

**3. Get OAuth app credentials and test the OAuth flows**
5 services need OAuth apps created: Slack, Linear, GitHub, Google (Calendar), Atlassian (Jira).
Add the client ID + secret pairs to `.env` (see `.env.example` for the exact keys).
Then test each "Connect" button on the integrations page end-to-end.

**4. Test Telegram /link command**
Message `@Cotxtbot` on Telegram with e.g. `/link jira your@email.com` and confirm the member metadata updates in the DB.
Also test `/start <invite_token>` via the invite link generated from the members page.

**5. Notion OAuth (optional)**
Notion isn't in the 5 OAuth services — it currently needs a manual token paste.
If you want it on the same OAuth flow, create a Notion integration at https://www.notion.so/my-integrations and add a `notion` entry to `SERVICES` in `src/admin/oauth.ts`.
