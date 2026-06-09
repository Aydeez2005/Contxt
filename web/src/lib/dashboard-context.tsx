"use client";

import { createContext, useContext, useEffect, useReducer, useCallback } from "react";
import { api, type OrgData, type Member, type Integration } from "@/lib/api";
import { MOCK_ORG, MOCK_MEMBERS, MOCK_INTEGRATIONS } from "@/data/mock";

type Data = {
  org: OrgData | null;
  members: Member[];
  integrations: Integration[];
  loading: boolean;
};

type Action =
  | { type: "RELOAD" }
  | { type: "DONE"; org: OrgData; members: Member[]; integrations: Integration[] };

export type DashboardState = Data & { reload: () => void };

// Reducer — all state changes in one dispatch, no cascading renders
function reducer(state: Data, action: Action): Data {
  switch (action.type) {
    case "RELOAD":
      return { ...state, loading: true };
    case "DONE":
      return { loading: false, org: action.org, members: action.members, integrations: action.integrations };
  }
}

const initial: Data = { org: null, members: [], integrations: [], loading: true };

const DashboardContext = createContext<DashboardState>({
  ...initial,
  reload: () => {},
});

export function DashboardProvider({
  slug,
  children,
}: {
  slug: string;
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(reducer, initial);

  const load = useCallback(async () => {
    try {
      const [orgData, membersData, integrationsData] = await Promise.all([
        api.getOrg(slug),
        api.getMembers(slug),
        api.getIntegrations(slug),
      ]);
      dispatch({ type: "DONE", org: orgData, members: membersData, integrations: integrationsData });
    } catch {
      dispatch({
        type: "DONE",
        org: { ...MOCK_ORG, slug },
        members: MOCK_MEMBERS,
        integrations: MOCK_INTEGRATIONS,
      });
    }
  }, [slug]);

  // reload() is user-initiated (button clicks, form submits) — not in an effect body
  const reload = useCallback(() => {
    dispatch({ type: "RELOAD" });
    load();
  }, [load]);

  // Effect only calls load() — no synchronous setState inside the effect body
  useEffect(() => { load(); }, [load]);

  return (
    <DashboardContext.Provider value={{ ...state, reload }}>
      {children}
    </DashboardContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────

export function useDashboard(): DashboardState {
  return useContext(DashboardContext);
}
