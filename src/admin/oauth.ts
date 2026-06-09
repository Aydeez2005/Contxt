import type { Context } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../db/client.ts";
import { organizations, orgIntegrations } from "../db/schema.ts";
import { redis } from "../lib/redis.ts";
import { logger } from "../lib/logger.ts";

const STATE_TTL = 600; // 10 minutes

type ServiceConfig = {
  authUrl: string;
  tokenUrl: string;
  scopes: string;
  clientIdEnv: string;
  clientSecretEnv: string;
  extraParams?: Record<string, string>;
};

const SERVICES: Record<string, ServiceConfig> = {
  slack: {
    authUrl: "https://slack.com/oauth/v2/authorize",
    tokenUrl: "https://slack.com/api/oauth.v2.access",
    scopes: "channels:history,search:read,users:read,users:read.email",
    clientIdEnv: "SLACK_CLIENT_ID",
    clientSecretEnv: "SLACK_CLIENT_SECRET",
  },
  linear: {
    authUrl: "https://linear.app/oauth/authorize",
    tokenUrl: "https://api.linear.app/oauth/token",
    scopes: "read",
    clientIdEnv: "LINEAR_CLIENT_ID",
    clientSecretEnv: "LINEAR_CLIENT_SECRET",
  },
  github: {
    authUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    scopes: "repo,read:org,read:user",
    clientIdEnv: "GITHUB_CLIENT_ID",
    clientSecretEnv: "GITHUB_CLIENT_SECRET",
  },
  gcal: {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: "https://www.googleapis.com/auth/calendar.readonly",
    clientIdEnv: "GOOGLE_CLIENT_ID",
    clientSecretEnv: "GOOGLE_CLIENT_SECRET",
    extraParams: { access_type: "offline", prompt: "consent" },
  },
  jira: {
    authUrl: "https://auth.atlassian.com/authorize",
    tokenUrl: "https://auth.atlassian.com/oauth/token",
    scopes: "read:jira-work read:jira-user offline_access",
    clientIdEnv: "ATLASSIAN_CLIENT_ID",
    clientSecretEnv: "ATLASSIAN_CLIENT_SECRET",
    extraParams: { audience: "api.atlassian.com", prompt: "consent" },
  },
};

function stateKey(state: string) {
  return `oauth:state:${state}`;
}

function callbackUrl(service: string) {
  const base = process.env.BASE_URL ?? "http://localhost:3001";
  return `${base}/oauth/callback/${service}`;
}

async function getOrg(slug: string) {
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, slug))
    .limit(1);
  return org ?? null;
}

export async function oauthConnect(c: Context) {
  const slug = c.req.param("slug");
  const service = c.req.param("service");
  if (!slug || !service) return c.json({ error: "Missing slug or service." }, 400);

  const cfg = SERVICES[service];
  if (!cfg) return c.json({ error: `Unknown service: ${service}` }, 400);

  const clientId = process.env[cfg.clientIdEnv];
  if (!clientId) return c.json({ error: `${cfg.clientIdEnv} is not configured` }, 500);

  const org = await getOrg(slug);
  if (!org) return c.json({ error: "Org not found." }, 404);

  const state = crypto.randomUUID();
  await redis.set(stateKey(state), { orgId: org.id, slug }, { ex: STATE_TTL });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl(service),
    response_type: "code",
    scope: cfg.scopes,
    state,
    ...(cfg.extraParams ?? {}),
  });

  return c.redirect(`${cfg.authUrl}?${params.toString()}`);
}

export async function oauthCallback(c: Context) {
  const service = c.req.param("service");
  if (!service) return c.text("Missing service.", 400);

  const cfg = SERVICES[service];
  if (!cfg) return c.text("Unknown service", 400);

  const { code, state, error } = c.req.query();

  if (error) {
    logger.warn({ service, error }, "OAuth denied by user");
    return c.html(`<h2>Authorization cancelled.</h2><p>${error}</p>`);
  }

  if (!code || !state) return c.text("Missing code or state", 400);

  const stored = await redis.get<{ orgId: string; slug: string }>(stateKey(state));
  if (!stored) return c.text("Invalid or expired state. Please try connecting again.", 400);

  await redis.del(stateKey(state));

  const clientId = process.env[cfg.clientIdEnv]!;
  const clientSecret = process.env[cfg.clientSecretEnv];
  if (!clientSecret) return c.text(`${cfg.clientSecretEnv} is not configured`, 500);

  // Exchange code for token
  const tokenRes = await fetch(cfg.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: callbackUrl(service),
      client_id: clientId,
      client_secret: clientSecret,
    }).toString(),
  });

  if (!tokenRes.ok) {
    const body = await tokenRes.text();
    logger.error({ service, status: tokenRes.status, body }, "Token exchange failed");
    return c.html(`<h2>Token exchange failed.</h2><pre>${body}</pre>`);
  }

  const tokenData = (await tokenRes.json()) as Record<string, unknown>;

  const accessToken =
    (tokenData.access_token as string) ??
    // Slack v2 nests the bot token here
    ((tokenData.authed_user as Record<string, string> | undefined)?.access_token as string | undefined);

  if (!accessToken) {
    return c.html(`<h2>No access token returned.</h2><pre>${JSON.stringify(tokenData, null, 2)}</pre>`);
  }

  const refreshToken = (tokenData.refresh_token as string | undefined) ?? null;
  const expiresIn = tokenData.expires_in as number | undefined;
  const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;

  // Jira: fetch cloud ID so we know which instance to query
  let metadata: Record<string, unknown> | null = null;
  if (service === "jira") {
    const resourcesRes = await fetch(
      "https://api.atlassian.com/oauth/token/accessible-resources",
      { headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" } }
    );
    if (resourcesRes.ok) {
      const resources = (await resourcesRes.json()) as Array<{ id: string; url: string; name: string }>;
      if (resources[0]) {
        metadata = { cloudId: resources[0].id, baseUrl: `https://api.atlassian.com/ex/jira/${resources[0].id}` };
      }
    }
  }

  // Slack: store bot token (authed_user token goes to member, bot token to org)
  if (service === "slack" && tokenData.access_token) {
    // tokenData.access_token is the bot token for the workspace
    metadata = { teamId: (tokenData.team as Record<string, string> | undefined)?.id ?? null };
  }

  await db
    .insert(orgIntegrations)
    .values({
      orgId: stored.orgId,
      service,
      accessToken,
      refreshToken,
      expiresAt,
      metadata,
      createdAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [orgIntegrations.orgId, orgIntegrations.service],
      set: { accessToken, refreshToken, expiresAt, metadata },
    });

  await redis.del(`tenant:${stored.orgId}`);

  logger.info({ service, orgId: stored.orgId }, "Integration connected via OAuth");

  return c.html(`
    <!DOCTYPE html>
    <html>
      <head><title>Connected</title><style>body{font-family:sans-serif;max-width:480px;margin:80px auto;text-align:center}</style></head>
      <body>
        <h2>✓ ${service.charAt(0).toUpperCase() + service.slice(1)} connected!</h2>
        <p>You can close this window and return to your workspace.</p>
      </body>
    </html>
  `);
}
