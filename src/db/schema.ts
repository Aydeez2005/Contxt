import {
  pgTable,
  uuid,
  text,
  bigint,
  boolean,
  jsonb,
  timestamp,
  unique,
  customType,
} from "drizzle-orm/pg-core";

const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return "vector(1536)";
  },
  toDriver(value: number[]): string {
    return `[${value.join(",")}]`;
  },
  fromDriver(value: string): number[] {
    return value
      .replace(/^\[|\]$/g, "")
      .split(",")
      .map(Number);
  },
});

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  telegramBotToken: text("telegram_bot_token"),
  telegramBotUsername: text("telegram_bot_username"),
  adminToken: text("admin_token").$defaultFn(() => crypto.randomUUID()),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type MemberMeta = {
  jiraEmail?: string;
  linearEmail?: string;
  slackUserId?: string;
  githubLogin?: string;
  calendarEmail?: string;
};

export const members = pgTable(
  "members",
  {
    id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    orgId: uuid("org_id").notNull().references(() => organizations.id),
    telegramId: bigint("telegram_id", { mode: "number" }).notNull(),
    telegramUsername: text("telegram_username"),
    displayName: text("display_name"),
    role: text("role").notNull().default("member"),
    isActive: boolean("is_active").notNull().default(true),
    metadata: jsonb("metadata").$type<MemberMeta>(),
    joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [unique().on(t.orgId, t.telegramId)]
);

export const orgIntegrations = pgTable(
  "org_integrations",
  {
    id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    orgId: uuid("org_id").notNull().references(() => organizations.id),
    service: text("service").notNull(),
    accessToken: text("access_token").notNull(),
    refreshToken: text("refresh_token"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [unique().on(t.orgId, t.service)]
);

export const memberSnapshots = pgTable("member_snapshots", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  orgId: uuid("org_id").notNull().references(() => organizations.id),
  memberId: uuid("member_id").notNull().references(() => members.id),
  activeTasks: jsonb("active_tasks"),
  blockers: jsonb("blockers"),
  lastActivity: jsonb("last_activity"),
  calendarStatus: text("calendar_status"),
  rawContext: text("raw_context"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const orgEmbeddings = pgTable("org_embeddings", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  orgId: uuid("org_id").notNull().references(() => organizations.id),
  sourceTool: text("source_tool").notNull(),
  sourceId: text("source_id").notNull(),
  content: text("content").notNull(),
  embedding: vector("embedding"),
  indexedAt: timestamp("indexed_at", { withTimezone: true }).defaultNow(),
});

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  orgId: uuid("org_id").notNull().references(() => organizations.id),
  memberId: uuid("member_id").notNull().references(() => members.id),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type Organization = typeof organizations.$inferSelect;
export type Member = typeof members.$inferSelect;
export type OrgIntegration = typeof orgIntegrations.$inferSelect;
export type MemberSnapshot = typeof memberSnapshots.$inferSelect;
export type OrgEmbedding = typeof orgEmbeddings.$inferSelect;
export type Message = typeof messages.$inferSelect;
