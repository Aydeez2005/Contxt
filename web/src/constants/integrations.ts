import { Jira, Linear, Slack, Notion, Github, GoogleCalendar } from "@thesvg/react";
import type { ElementType } from "react";

export type IntegrationConfig = {
  service: string;
  label: string;
  desc: string;
  color: string;
  bg: string;
  Icon: ElementType;
};

export const INTEGRATIONS_CONFIG: IntegrationConfig[] = [
  { service: "jira",   label: "Jira",           desc: "Issues & sprints",      color: "#0052CC", bg: "#EBF2FF", Icon: Jira          },
  { service: "linear", label: "Linear",          desc: "Issues & projects",     color: "#5E6AD2", bg: "#EDEDF8", Icon: Linear        },
  { service: "slack",  label: "Slack",           desc: "Messages & channels",   color: "#611F69", bg: "#F5EDF7", Icon: Slack         },
  { service: "notion", label: "Notion",          desc: "Docs & databases",      color: "#191919", bg: "#F0EFED", Icon: Notion        },
  { service: "github", label: "GitHub",          desc: "Code & pull requests",  color: "#1F6FEB", bg: "#EBF2FF", Icon: Github        },
  { service: "gcal",   label: "Google Calendar", desc: "Events & availability", color: "#1A73E8", bg: "#EAF2FF", Icon: GoogleCalendar },
];

export function getIntegrationConfig(service: string): IntegrationConfig | undefined {
  return INTEGRATIONS_CONFIG.find(c => c.service === service);
}
