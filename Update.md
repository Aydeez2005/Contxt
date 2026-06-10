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
- Ran `bunx drizzle-kit push` to apply new DB constraints — failed in piped shell (needs TTY). Run manually in terminal to apply the two new unique constraints (`member_snapshots`, `org_embeddings`).
- Verified both backend (port 3000) and frontend (port 3001) running cleanly
- Reviewed all pages live: dashboard overview, members (invite link card visible), integrations (OAuth buttons working), graph (members + tool nodes rendering)
