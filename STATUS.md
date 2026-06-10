# Contxt — Status

## Backend

| Area | Status | Blocker |
|------|--------|---------|
| Telegram webhook + `/start` invite flow | ✅ Tested | — |
| Org / member / snapshot CRUD APIs | ✅ Tested | — |
| Agent orchestrator (`whoIsWorkingOn`, `memberStatus`) | ✅ Tested | — |
| OAuth handlers — all 5 services | ⚠️ Written, not tested | Need OAuth app credentials per service |
| Tool API clients (Jira, Linear, Slack, GitHub, GCal) | ⚠️ Written, not tested | Blocked on OAuth above |
| Notion tool | ✅ Built | Wired into `toolDefinitions` and `dispatchTool` |
| `org_embeddings` indexing pipeline | ✅ Built | Indexes Notion pages every 10 min via refresh loop |
| `orgSearch` vector similarity | ⚠️ Keyword fallback | Anthropic has no embeddings API; SQL `LIKE` search works on indexed content |
| Telegram `/link` command (member self-service identity) | ✅ Built | `/link jira`, `/link slack`, `/link github`, `/link linear`, `/link gcal` |
| `member_snapshots` unique constraint | ✅ Fixed | Schema + `onConflictDoUpdate` target corrected; migration applied |
| OAuth token refresh on expiry | ✅ Built | `getValidToken()` wired into all 6 tool clients |

## Frontend

| Area | Status | Note |
|------|--------|------|
| Dashboard shell (sidebar, topbar, layout) | ✅ Built | — |
| All dashboard pages (overview, members, integrations, bot, test) | ⚠️ Mock data | Need to swap `MOCK_*` → `api.*` calls |
| OAuth connect button (integrations page) | ✅ Built | Opens OAuth redirect flow for jira/linear/slack/github/gcal; Notion uses token dialog |
| Invite link generator (members page) | ✅ Built | Generates one-time link, copy-to-clipboard |
| Graph page (`/dashboard/[slug]/graph`) | ✅ Built | react-flow — members/tools as nodes, task assignments + blockers as edges |
