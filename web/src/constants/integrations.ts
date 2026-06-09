import { Layers, Hash, FileText, Calendar, GitFork, Zap } from "lucide-react";
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
  { service: "jira",   label: "Jira",           desc: "Issues & sprints",      color: "#0052CC", bg: "#EBF2FF", Icon: Layers   },
  { service: "linear", label: "Linear",          desc: "Issues & projects",     color: "#5E6AD2", bg: "#EDEDF8", Icon: Zap      },
  { service: "slack",  label: "Slack",           desc: "Messages & channels",   color: "#611F69", bg: "#F5EDF7", Icon: Hash     },
  { service: "notion", label: "Notion",          desc: "Docs & databases",      color: "#191919", bg: "#F0EFED", Icon: FileText },
  { service: "github", label: "GitHub",          desc: "Code & pull requests",  color: "#1F6FEB", bg: "#EBF2FF", Icon: GitFork  },
  { service: "gcal",   label: "Google Calendar", desc: "Events & availability", color: "#1A73E8", bg: "#EAF2FF", Icon: Calendar },
];

export function getIntegrationConfig(service: string): IntegrationConfig | undefined {
  return INTEGRATIONS_CONFIG.find(c => c.service === service);
}
