import type { OrgData, Member, Integration } from "@/lib/api";

export const FACE_COLORS = ["#0052CC", "#611F69", "#1A73E8", "#5E6AD2", "#16a34a"];

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map(w => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export type SetupStep = { label: string; done: boolean };

export function getSetupSteps(
  org: OrgData | null,
  integrations: Integration[],
  members: Member[],
): SetupStep[] {
  return [
    { label: "Workspace created",              done: true },
    { label: "Telegram bot connected",         done: !!org?.telegramBotUsername },
    { label: "At least one integration added", done: integrations.length > 0 },
    { label: "Team members invited",           done: members.filter(m => m.role !== "admin").length > 0 },
  ];
}

export function isSetupComplete(steps: SetupStep[]): boolean {
  return steps.every(s => s.done);
}
