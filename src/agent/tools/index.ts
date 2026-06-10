import type { Tool } from "@anthropic-ai/sdk/resources/messages.js";

export const toolDefinitions: Tool[] = [
  {
    name: "whoIsWorkingOn",
    description:
      "Returns what a specific member is currently working on — active tasks, blockers, last activity, and calendar status. Use when asked about a person by name.",
    input_schema: {
      type: "object" as const,
      properties: {
        member_name: {
          type: "string",
          description: "The display name or Telegram username of the member.",
        },
      },
      required: ["member_name"],
    },
  },
  {
    name: "memberStatus",
    description:
      "Returns the current status of a member by their member ID. Used internally for precision lookups.",
    input_schema: {
      type: "object" as const,
      properties: {
        member_id: {
          type: "string",
          description: "The UUID of the member.",
        },
      },
      required: ["member_id"],
    },
  },
  {
    name: "orgSearch",
    description:
      "Semantic search across all connected org tools (Notion, Slack, Jira, GitHub). Use when asked about decisions, docs, threads, or anything that isn't a person status.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "The natural language search query.",
        },
        filter_tool: {
          type: "string",
          description:
            "Optional: limit search to a specific tool (notion, slack, jira, github).",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "notionSearch",
    description:
      "Search Notion pages directly for docs, meeting notes, decisions, or any written content in the workspace. Use when the question is specifically about Notion content.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "The search query to find relevant Notion pages.",
        },
      },
      required: ["query"],
    },
  },
];
