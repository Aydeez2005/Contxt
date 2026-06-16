import { eq } from "drizzle-orm";
import { db } from "../db/client.ts";
import { organizations, members } from "../db/schema.ts";
import { orgIntegrations } from "../db/schema.ts";
import { buildMemberSnapshot } from "./memberSnapshot.ts";
import { indexOrgContent } from "./indexEmbeddings.ts";
import { logger } from "../lib/logger.ts";

const INTERVAL_MS = 10 * 60 * 1000;

export function startRefreshLoop() {
  setInterval(async () => {
    try {
      const orgs = await db.select().from(organizations);

      for (const org of orgs) {
        const orgMembers = await db
          .select()
          .from(members)
          .where(eq(members.orgId, org.id));

        const integrations = await db
          .select()
          .from(orgIntegrations)
          .where(eq(orgIntegrations.orgId, org.id));

        // Nothing to refresh if no integrations are connected
        if (integrations.length === 0) continue;

        const activeMembers = orgMembers.filter((m) => m.isActive);

        await Promise.allSettled(
          activeMembers.map((member) =>
            buildMemberSnapshot(member.id, { org, member, integrations }).catch(
              (e) =>
                logger.warn(
                  { err: e, memberId: member.id },
                  "snapshot refresh failed"
                )
            )
          )
        );

        await indexOrgContent(org.id, integrations).catch((e) =>
          logger.warn({ err: e, orgId: org.id }, "embedding indexing failed")
        );
      }

      logger.info("Context refresh completed");
    } catch (e) {
      logger.error({ err: e }, "Context refresh loop error");
    }
  }, INTERVAL_MS);

  logger.info("Context refresh loop started (10min interval)");
}
