import type { Organization, Member, OrgIntegration } from "../db/schema.ts";

export type OrgContext = {
  org: Organization;
  member: Member;
  integrations: OrgIntegration[];
};

export type ToolResult = {
  success: boolean;
  data?: unknown;
  error?: string;
};
