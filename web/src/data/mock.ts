import type { OrgData, Member, Integration, MemberSnapshot } from "@/lib/api";

export const MOCK_ORG: OrgData = {
  id: "1",
  name: "Acme Corp",
  slug: "acme-corp",
  telegramBotUsername: "acme_contxt_bot",
  botConfigured: true,
  botUsername: "acme_contxt_bot",
};

export const MOCK_MEMBERS: Member[] = [
  { id: "1", displayName: "Alex Chen",  telegramUsername: "alexchen", role: "admin",  isActive: true,  joinedAt: new Date(Date.now() - 864e5 * 10).toISOString() },
  { id: "2", displayName: "Sarah Kim",  telegramUsername: "sarahkim", role: "member", isActive: true,  joinedAt: new Date(Date.now() - 864e5 * 5).toISOString()  },
  { id: "3", displayName: "Bruno D.",   telegramUsername: "brunod",   role: "member", isActive: true,  joinedAt: new Date(Date.now() - 864e5 * 2).toISOString()  },
  { id: "4", displayName: "Lena Park",  telegramUsername: "lenapark", role: "member", isActive: false, joinedAt: new Date(Date.now() - 864e5 * 30).toISOString() },
];

export const MOCK_INTEGRATIONS: Integration[] = [
  { id: "1", service: "jira",   createdAt: new Date(Date.now() - 864e5 * 7).toISOString() },
  { id: "2", service: "slack",  createdAt: new Date(Date.now() - 864e5 * 7).toISOString() },
  { id: "3", service: "github", createdAt: new Date(Date.now() - 864e5 * 3).toISOString() },
];

export const MOCK_SNAPSHOTS: MemberSnapshot[] = [
  {
    memberId: "1",
    activeTasks: [
      { id: "t1", title: "Fix auth bug",        status: "in_progress", tool: "jira",   url: "#" },
      { id: "t2", title: "Review PR #42",        status: "in_progress", tool: "github", url: "#" },
      { id: "t3", title: "Deploy to staging",    status: "in_progress", tool: "slack",  url: "#" },
    ],
    blockers: [],
    calendarStatus: "free",
    lastActivity: { tool: "jira", description: "Moved STRIPE-41 to In Progress", timestamp: String(Math.floor(Date.now() / 1000) - 120) },
    updatedAt: new Date().toISOString(),
  },
  {
    memberId: "2",
    activeTasks: [
      { id: "t4", title: "Write release notes",  status: "in_progress", tool: "notion", url: "#" },
      { id: "t5", title: "Code review feedback", status: "in_progress", tool: "github", url: "#" },
    ],
    blockers: [{ description: "Blocked by Alex on API spec", source_tool: "jira" }],
    calendarStatus: "busy",
    lastActivity: { tool: "github", description: "Left 3 comments on PR #42", timestamp: String(Math.floor(Date.now() / 1000) - 840) },
    updatedAt: new Date().toISOString(),
  },
  {
    memberId: "3",
    activeTasks: [
      { id: "t6", title: "Triage open issues",   status: "in_progress", tool: "jira",   url: "#" },
      { id: "t7", title: "Update sprint board",  status: "in_progress", tool: "linear", url: "#" },
      { id: "t8", title: "Sync with Sarah",      status: "in_progress", tool: "slack",  url: "#" },
    ],
    blockers: [],
    calendarStatus: "free",
    lastActivity: { tool: "linear", description: "Moved 4 tickets to Done", timestamp: String(Math.floor(Date.now() / 1000) - 3600) },
    updatedAt: new Date().toISOString(),
  },
];

export type ActivityItem = {
  name: string;
  color: string;
  query: string;
  answer: string;
  sources: string[];
  time: string;
};

export const MOCK_ACTIVITY: ActivityItem[] = [
  {
    name: "Alex Chen",
    color: "#0052CC",
    query: "What's blocking the Stripe sprint?",
    answer: "Two open Jira blockers — STRIPE-41 waiting on API spec, STRIPE-43 unassigned. Estimated delay is 2 days.",
    sources: ["jira", "github"],
    time: "2 min ago",
  },
  {
    name: "Sarah Kim",
    color: "#611F69",
    query: "Anyone free for a code review at 3 pm?",
    answer: "Cedrick and Lena are both free 3–4 pm today. Mark has a meeting until 3:30 but is free after.",
    sources: ["gcal"],
    time: "14 min ago",
  },
  {
    name: "Bruno D.",
    color: "#1A73E8",
    query: "What did the team ship last week?",
    answer: "3 PRs merged: auth refactor, CSV export, and dark mode fix. 7 Jira tickets closed across two sprints.",
    sources: ["github", "jira"],
    time: "1 hr ago",
  },
];
