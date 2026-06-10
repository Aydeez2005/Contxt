const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

function getToken(slug: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(`contxt_token_${slug}`);
}

function saveToken(slug: string, token: string) {
  localStorage.setItem(`contxt_token_${slug}`, token);
}

async function request<T>(path: string, options?: RequestInit, slug?: string): Promise<T> {
  const token = slug ? getToken(slug) : null;
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

export type OrgData = {
  id: string;
  name: string;
  slug: string;
  telegramBotToken: string | null;
  telegramBotUsername: string | null;
};

export type Member = {
  id: string;
  displayName: string | null;
  telegramUsername: string | null;
  role: string;
  isActive: boolean;
  joinedAt: string;
};

export type Integration = {
  id: string;
  service: string;
  createdAt: string;
};

export type MemberSnapshot = {
  memberId: string;
  activeTasks: Array<{ id: string; title: string; status: string; tool: string; url?: string }> | null;
  blockers: Array<{ description: string; source_tool: string }> | null;
  calendarStatus: string | null;
  updatedAt: string | null;
};

export type RegisterPayload = {
  name: string;
  slug: string;
  adminTelegramId: number;
  adminDisplayName?: string;
};

export const api = {
  register(data: RegisterPayload) {
    return request<{ orgId: string; slug: string; adminToken: string; nextSteps: string[] }>(
      "/admin/orgs",
      { method: "POST", body: JSON.stringify(data) }
    );
  },

  login(slug: string, token: string) {
    saveToken(slug, token);
    return request<OrgData>(`/admin/orgs/${slug}`, {}, slug);
  },

  getOrg(slug: string) {
    return request<OrgData>(`/admin/orgs/${slug}`, {}, slug);
  },

  getMembers(slug: string) {
    return request<Member[]>(`/admin/orgs/${slug}/members`, {}, slug);
  },

  inviteMember(slug: string, data: { telegramId: number; displayName?: string; role?: string }) {
    return request<{ memberId: string }>(`/admin/orgs/${slug}/members/invite`, {
      method: "POST",
      body: JSON.stringify(data),
    }, slug);
  },

  removeMember(slug: string, memberId: string) {
    return request<{ ok: boolean }>(`/admin/orgs/${slug}/members/${memberId}`, {
      method: "DELETE",
    }, slug);
  },

  getSnapshots(slug: string) {
    return request<MemberSnapshot[]>(`/admin/orgs/${slug}/snapshots`, {}, slug);
  },

  getIntegrations(slug: string) {
    return request<Integration[]>(`/admin/orgs/${slug}/integrations`, {}, slug);
  },

  connectIntegration(slug: string, service: string, data: { accessToken: string; metadata?: Record<string, unknown> }) {
    return request<{ ok: boolean; service: string }>(`/admin/orgs/${slug}/integrations/${service}`, {
      method: "POST",
      body: JSON.stringify(data),
    }, slug);
  },

  oauthConnectUrl(slug: string, service: string): string {
    const token = getToken(slug) ?? "";
    return `${API}/admin/orgs/${slug}/integrations/${service}/connect?token=${encodeURIComponent(token)}`;
  },

  createInviteLink(slug: string) {
    return request<{ link: string; expiresIn: string }>(`/admin/orgs/${slug}/invite-link`, {
      method: "POST",
    }, slug);
  },

  registerBot(slug: string, token: string) {
    return request<{ ok: boolean; webhookUrl: string; botUsername?: string }>(
      `/admin/orgs/${slug}/bot`,
      { method: "POST", body: JSON.stringify({ token }) },
      slug
    );
  },

  query(slug: string, text: string, telegramId: number) {
    return request<{ reply: string }>(`/admin/orgs/${slug}/query`, {
      method: "POST",
      body: JSON.stringify({ text, telegramId }),
    }, slug);
  },

  saveToken,
  getToken,
};
