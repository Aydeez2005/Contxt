/**
 * Seeds the demo org with realistic test data:
 * 8 members, 6 integrations, and rich member snapshots.
 *
 * Usage: bun scripts/seed-demo.ts
 */

import { eq } from "drizzle-orm";
import { db } from "../src/db/client.ts";
import { members, memberSnapshots, orgIntegrations, organizations } from "../src/db/schema.ts";

const DEMO_SLUG = "demo";

async function main() {
  const [org] = await db.select().from(organizations).where(eq(organizations.slug, DEMO_SLUG)).limit(1);
  if (!org) { console.error("Demo org not found — run the server and POST /admin/orgs first"); process.exit(1); }

  console.log(`Seeding org: ${org.name} (${org.id})`);

  // ── 1. Members ───────────────────────────────────────────────────────────────
  const MEMBERS = [
    { displayName: "Alex Chen",     telegramId: 100001, role: "admin",  meta: { jiraEmail: "alex@acme.io",   githubLogin: "alexchen",   slackUserId: "U001", linearEmail: "alex@acme.io"   } },
    { displayName: "Sarah Kim",     telegramId: 100002, role: "member", meta: { jiraEmail: "sarah@acme.io",  githubLogin: "sarahkim",   slackUserId: "U002", linearEmail: "sarah@acme.io"  } },
    { displayName: "Bruno D.",      telegramId: 100003, role: "member", meta: { jiraEmail: "bruno@acme.io",  githubLogin: "brunod",     slackUserId: "U003", linearEmail: "bruno@acme.io"  } },
    { displayName: "Lena Park",     telegramId: 100004, role: "member", meta: { jiraEmail: "lena@acme.io",   githubLogin: "lenapark",   slackUserId: "U004", linearEmail: "lena@acme.io"   } },
    { displayName: "Marcus Rivera", telegramId: 100005, role: "member", meta: { githubLogin: "marcusr",      slackUserId: "U005", linearEmail: "marcus@acme.io"  } },
    { displayName: "Yui Tanaka",    telegramId: 100006, role: "member", meta: { jiraEmail: "yui@acme.io",   slackUserId: "U006", linearEmail: "yui@acme.io"    } },
    { displayName: "Felix Wagner",  telegramId: 100007, role: "member", meta: { jiraEmail: "felix@acme.io",  githubLogin: "felixw",     slackUserId: "U007"                                } },
    { displayName: "Priya Nair",    telegramId: 100008, role: "member", meta: { jiraEmail: "priya@acme.io",  githubLogin: "priyanair",  slackUserId: "U008", linearEmail: "priya@acme.io"  } },
  ];

  const memberIds: Record<string, string> = {};

  for (const m of MEMBERS) {
    const existing = await db.select({ id: members.id })
      .from(members)
      .where(eq(members.telegramId, m.telegramId))
      .limit(1);

    if (existing[0]) {
      memberIds[m.displayName] = existing[0].id;
      console.log(`  → ${m.displayName} already exists`);
      continue;
    }

    const [inserted] = await db.insert(members).values({
      orgId: org.id,
      telegramId: m.telegramId,
      displayName: m.displayName,
      role: m.role,
      isActive: true,
      metadata: m.meta,
      joinedAt: new Date(),
    }).returning({ id: members.id });

    memberIds[m.displayName] = inserted.id;
    console.log(`  ✓ Created ${m.displayName}`);
  }

  // ── 2. Integrations ──────────────────────────────────────────────────────────
  const INTEGRATIONS = [
    { service: "jira",   accessToken: "fake-jira-token",   metadata: { cloudId: "demo", baseUrl: "https://acme.atlassian.net" } },
    { service: "linear", accessToken: "fake-linear-token",  metadata: null },
    { service: "slack",  accessToken: "fake-slack-token",   metadata: { teamId: "T001" } },
    { service: "github", accessToken: "fake-github-token",  metadata: { org: "acme-corp" } },
    { service: "gcal",   accessToken: "fake-gcal-token",    metadata: null },
    { service: "notion", accessToken: "fake-notion-token",  metadata: null },
  ];

  for (const i of INTEGRATIONS) {
    await db.insert(orgIntegrations).values({
      orgId: org.id,
      service: i.service,
      accessToken: i.accessToken,
      metadata: i.metadata,
      createdAt: new Date(),
    }).onConflictDoUpdate({
      target: [orgIntegrations.orgId, orgIntegrations.service],
      set: { accessToken: i.accessToken },
    });
    console.log(`  ✓ Integration: ${i.service}`);
  }

  // ── 3. Snapshots ─────────────────────────────────────────────────────────────
  const SNAPSHOTS: Record<string, {
    activeTasks: { id: string; title: string; status: string; tool: string; url?: string }[];
    blockers: { description: string; source_tool: string; url: string }[];
    calendarStatus: string;
    lastActivity: { tool: string; description: string; timestamp: string };
  }> = {
    "Alex Chen": {
      activeTasks: [
        { id: "ACME-101", title: "Architect new auth service",        status: "In Progress", tool: "jira",   url: "#" },
        { id: "ACME-102", title: "Review Q3 roadmap with Sarah",      status: "In Review",   tool: "linear", url: "#" },
        { id: "pr-441",   title: "Auth service PR — initial scaffold", status: "open",        tool: "github", url: "#" },
      ],
      blockers: [{ description: "Waiting on Bruno D. to finish DB schema migration before auth can go to staging", source_tool: "slack", url: "#" }],
      calendarStatus: "in_meeting",
      lastActivity: { tool: "slack", description: "Auth service goes to staging Thursday — Bruno please confirm migration ETA", timestamp: "1718700000" },
    },
    "Sarah Kim": {
      activeTasks: [
        { id: "LIN-88",  title: "Design system token refresh",    status: "In Progress", tool: "linear", url: "#" },
        { id: "LIN-91",  title: "Mobile onboarding flow v2",      status: "In Review",   tool: "linear", url: "#" },
        { id: "pr-338",  title: "Design token CSS variables",     status: "open",        tool: "github", url: "#" },
        { id: "ACME-87", title: "User research synthesis — May",  status: "In Progress", tool: "jira",   url: "#" },
      ],
      blockers: [{ description: "Waiting on Felix Wagner to implement the new nav component before I can finalise the mobile screens", source_tool: "slack", url: "#" }],
      calendarStatus: "available",
      lastActivity: { tool: "notion", description: "Updated design system docs — new token naming convention is live", timestamp: "1718699000" },
    },
    "Bruno D.": {
      activeTasks: [
        { id: "ACME-110", title: "DB schema migration — user_events table", status: "In Progress", tool: "jira",   url: "#" },
        { id: "ACME-113", title: "Redis cache layer for snapshot service",  status: "To Do",       tool: "jira",   url: "#" },
        { id: "pr-452",   title: "Add user_events migration",               status: "open",        tool: "github", url: "#" },
        { id: "LIN-95",   title: "Refactor tenant resolver middleware",     status: "In Progress", tool: "linear", url: "#" },
      ],
      blockers: [{ description: "Blocked by Priya Nair — need her data pipeline schema before user_events table is finalised", source_tool: "slack", url: "#" }],
      calendarStatus: "available",
      lastActivity: { tool: "github", description: "Pushed migration draft — needs review before merge", timestamp: "1718698000" },
    },
    "Lena Park": {
      activeTasks: [
        { id: "LIN-77",  title: "Dashboard graph page — react-flow",  status: "In Progress", tool: "linear", url: "#" },
        { id: "LIN-80",  title: "Integrations page OAuth flow",       status: "Done",        tool: "linear", url: "#" },
        { id: "pr-421",  title: "Graph page initial implementation",  status: "open",        tool: "github", url: "#" },
        { id: "pr-408",  title: "OAuth connect button",               status: "merged",      tool: "github", url: "#" },
      ],
      blockers: [],
      calendarStatus: "busy",
      lastActivity: { tool: "github", description: "Graph page PR open for review — react-flow with force layout", timestamp: "1718701000" },
    },
    "Marcus Rivera": {
      activeTasks: [
        { id: "LIN-60",  title: "Set up Railway staging environment", status: "Done",        tool: "linear", url: "#" },
        { id: "LIN-63",  title: "CI/CD pipeline — GitHub Actions",   status: "In Progress", tool: "linear", url: "#" },
        { id: "pr-399",  title: "Dockerfile multi-stage build",      status: "merged",      tool: "github", url: "#" },
        { id: "ACME-99", title: "Uptime monitoring — BetterStack",   status: "In Progress", tool: "jira",   url: "#" },
      ],
      blockers: [{ description: "Blocked on Alex Chen approving the new staging secrets before pipeline can run end-to-end", source_tool: "slack", url: "#" }],
      calendarStatus: "available",
      lastActivity: { tool: "slack", description: "CI pipeline is green except for secret injection — Alex needs to approve", timestamp: "1718697000" },
    },
    "Yui Tanaka": {
      activeTasks: [
        { id: "ACME-120", title: "Analytics pipeline — event ingestion",  status: "In Progress", tool: "jira",   url: "#" },
        { id: "ACME-123", title: "Embed org content into vector store",    status: "To Do",       tool: "jira",   url: "#" },
        { id: "LIN-70",   title: "Data warehouse schema v2",              status: "In Review",   tool: "linear", url: "#" },
      ],
      blockers: [{ description: "Waiting on Bruno D. for user_events schema — can't finalise ingestion pipeline without it", source_tool: "slack", url: "#" }],
      calendarStatus: "in_meeting",
      lastActivity: { tool: "notion", description: "Wrote up data warehouse schema proposal — needs sign-off from Alex Chen", timestamp: "1718695000" },
    },
    "Felix Wagner": {
      activeTasks: [
        { id: "LIN-83",  title: "Mobile nav component — new design",  status: "In Progress", tool: "linear", url: "#" },
        { id: "LIN-86",  title: "Push notification permission flow",  status: "To Do",       tool: "linear", url: "#" },
        { id: "pr-433",  title: "Nav component implementation",       status: "open",        tool: "github", url: "#" },
      ],
      blockers: [],
      calendarStatus: "available",
      lastActivity: { tool: "github", description: "Nav component 80% done — Sarah Kim reviewing design alignment", timestamp: "1718702000" },
    },
    "Priya Nair": {
      activeTasks: [
        { id: "ACME-130", title: "Data pipeline schema — user events",   status: "In Progress", tool: "jira",   url: "#" },
        { id: "ACME-133", title: "ETL job — Jira → data warehouse",      status: "In Progress", tool: "jira",   url: "#" },
        { id: "pr-460",   title: "ETL scaffold + Jira connector",        status: "open",        tool: "github", url: "#" },
        { id: "LIN-73",   title: "Document data pipeline architecture",  status: "In Review",   tool: "linear", url: "#" },
      ],
      blockers: [],
      calendarStatus: "available",
      lastActivity: { tool: "notion", description: "Data pipeline architecture doc published — Bruno D. and Yui please review", timestamp: "1718703000" },
    },
  };

  for (const [name, snap] of Object.entries(SNAPSHOTS)) {
    const memberId = memberIds[name];
    if (!memberId) { console.log(`  ⚠ No member ID for ${name}, skipping`); continue; }

    const rawContext = `Member: ${name}\nActive tasks: ${snap.activeTasks.map(t => t.title).join(", ")}\nBlockers: ${snap.blockers.map(b => b.description).join(", ")}\nCalendar: ${snap.calendarStatus}`;

    await db.insert(memberSnapshots).values({
      orgId: org.id,
      memberId,
      activeTasks: snap.activeTasks,
      blockers: snap.blockers,
      lastActivity: snap.lastActivity,
      calendarStatus: snap.calendarStatus,
      rawContext,
      updatedAt: new Date(),
    }).onConflictDoUpdate({
      target: [memberSnapshots.orgId, memberSnapshots.memberId],
      set: {
        activeTasks: snap.activeTasks,
        blockers: snap.blockers,
        lastActivity: snap.lastActivity,
        calendarStatus: snap.calendarStatus,
        rawContext,
        updatedAt: new Date(),
      },
    });
    console.log(`  ✓ Snapshot: ${name} (${snap.activeTasks.length} tasks, ${snap.blockers.length} blockers)`);
  }

  console.log("\nDone.");
}

main().catch(e => { console.error(e); process.exit(1); });
