# Contxt — Status

## Backend

| Area | Status | Blocker |
|------|--------|---------|
| Telegram webhook + `/start` invite flow | ✅ Tested | — |
| Org / member / snapshot CRUD APIs | ✅ Tested | — |
| Agent orchestrator (`whoIsWorkingOn`, `memberStatus`) | ✅ Tested | — |
| OAuth handlers — all 5 services | ⚠️ Written, not tested | Need OAuth app credentials per service |
| Tool API clients (Jira, Linear, Slack, GitHub, GCal) | ⚠️ Written, not tested | Blocked on OAuth above |
| Notion tool | ❌ Not wired | Not in `toolDefinitions` or `dispatchTool` |
| `org_embeddings` indexing pipeline | ❌ Not built | Nothing writes to the table |
| `orgSearch` vector similarity | ❌ Not built | Falls back to SQL `LIKE` on empty table |
| Telegram `/link` command (member self-service identity) | ❌ Not built | Members can't set `jiraEmail`, `slackUserId` etc. themselves |
| `member_snapshots` unique constraint | ❌ Bug | `onConflictDoUpdate` targets non-existent constraint → duplicates |
| OAuth token refresh on expiry | ❌ Not built | `refreshToken` stored but never used |

## Frontend

| Area | Status | Note |
|------|--------|------|
| Dashboard shell (sidebar, topbar, layout) | ✅ Built | — |
| All dashboard pages (overview, members, integrations, bot, test) | ⚠️ Mock data | Need to swap `MOCK_*` → `api.*` calls |
| OAuth connect button (integrations page) | ❌ Not built | Opens `GET .../integrations/:service/connect` |
| Invite link generator (members page) | ❌ Not built | Calls `POST .../invite-link`, shows result |
| Graph page (`/dashboard/[slug]/graph`) | ❌ Not built | `react-flow` — members/tools/tasks as nodes, assignments/blockers as edges, data from `member_snapshots` |
