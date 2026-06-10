import { eq, and } from "drizzle-orm";
import { db } from "../db/client.ts";
import { orgIntegrations } from "../db/schema.ts";
import { redis } from "./redis.ts";
import { logger } from "./logger.ts";
import type { OrgIntegration } from "../db/schema.ts";

const TOKEN_REFRESH_URLS: Record<string, string> = {
  slack: "https://slack.com/api/oauth.v2.access",
  linear: "https://api.linear.app/oauth/token",
  github: "https://github.com/login/oauth/access_token",
  gcal: "https://oauth2.googleapis.com/token",
  jira: "https://auth.atlassian.com/oauth/token",
};

const CLIENT_ID_ENVS: Record<string, string> = {
  slack: "SLACK_CLIENT_ID",
  linear: "LINEAR_CLIENT_ID",
  github: "GITHUB_CLIENT_ID",
  gcal: "GOOGLE_CLIENT_ID",
  jira: "ATLASSIAN_CLIENT_ID",
};

const CLIENT_SECRET_ENVS: Record<string, string> = {
  slack: "SLACK_CLIENT_SECRET",
  linear: "LINEAR_CLIENT_SECRET",
  github: "GITHUB_CLIENT_SECRET",
  gcal: "GOOGLE_CLIENT_SECRET",
  jira: "ATLASSIAN_CLIENT_SECRET",
};

// Returns true if the token expires within 5 minutes or is already expired
function isExpiredOrSoon(expiresAt: Date | null): boolean {
  if (!expiresAt) return false;
  return expiresAt.getTime() - Date.now() < 5 * 60 * 1000;
}

async function doRefresh(integration: OrgIntegration): Promise<string | null> {
  const { service, refreshToken, orgId } = integration;
  if (!refreshToken) return null;

  const tokenUrl = TOKEN_REFRESH_URLS[service];
  const clientId = process.env[CLIENT_ID_ENVS[service] ?? ""]
  const clientSecret = process.env[CLIENT_SECRET_ENVS[service] ?? ""];

  if (!tokenUrl || !clientId || !clientSecret) {
    logger.warn({ service }, "Cannot refresh token: missing OAuth config");
    return null;
  }

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }).toString(),
  });

  if (!res.ok) {
    logger.warn({ service, status: res.status }, "Token refresh failed");
    return null;
  }

  const data = (await res.json()) as Record<string, unknown>;
  const newAccessToken = data.access_token as string | undefined;
  if (!newAccessToken) return null;

  const newRefreshToken = (data.refresh_token as string | undefined) ?? refreshToken;
  const expiresIn = data.expires_in as number | undefined;
  const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;

  await db
    .update(orgIntegrations)
    .set({ accessToken: newAccessToken, refreshToken: newRefreshToken, expiresAt })
    .where(and(eq(orgIntegrations.orgId, orgId), eq(orgIntegrations.service, service)));

  // Bust the tenant cache for this org so the fresh token is picked up
  await redis.del(`tenant:org:${orgId}`);

  logger.info({ service, orgId }, "Token refreshed");
  return newAccessToken;
}

/**
 * Returns a valid access token for the integration, refreshing if needed.
 * Pass the integration object from the DB; returns null if refresh fails or
 * no refresh token is available.
 */
export async function getValidToken(integration: OrgIntegration): Promise<string> {
  if (!isExpiredOrSoon(integration.expiresAt)) {
    return integration.accessToken;
  }

  const refreshed = await doRefresh(integration);
  return refreshed ?? integration.accessToken;
}
