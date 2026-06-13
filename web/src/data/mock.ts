import type { OrgData, Member, Integration } from "@/lib/api";

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
