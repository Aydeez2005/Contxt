"use client";

import { createContext, useContext, useEffect, useReducer, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api, AuthError, type OrgData, type Member, type Integration } from "@/lib/api";

type Data = {
  org: OrgData | null;
  members: Member[];
  integrations: Integration[];
  loading: boolean;
};

type Action =
  | { type: "RELOAD" }
  | { type: "DONE"; org: OrgData; members: Member[]; integrations: Integration[] }
  | { type: "ERROR" };

export type DashboardState = Data & { reload: () => void };

function reducer(state: Data, action: Action): Data {
  switch (action.type) {
    case "RELOAD":
      return { ...state, loading: true };
    case "DONE":
      return { loading: false, org: action.org, members: action.members, integrations: action.integrations };
    case "ERROR":
      return { loading: false, org: null, members: [], integrations: [] };
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
  const router = useRouter();
  const [state, dispatch] = useReducer(reducer, initial);

  const load = useCallback(async () => {
    if (!api.getToken(slug)) {
      router.replace("/login");
      return;
    }
    try {
      const [orgData, membersData, integrationsData] = await Promise.all([
        api.getOrg(slug),
        api.getMembers(slug),
        api.getIntegrations(slug),
      ]);
      dispatch({ type: "DONE", org: orgData, members: membersData, integrations: integrationsData });
    } catch (err) {
      if (err instanceof AuthError) {
        router.replace("/login");
        return;
      }
      dispatch({ type: "ERROR" });
    }
  }, [slug, router]);

  const reload = useCallback(() => {
    dispatch({ type: "RELOAD" });
    load();
  }, [load]);

  useEffect(() => { load(); }, [load]);

  return (
    <DashboardContext.Provider value={{ ...state, reload }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard(): DashboardState {
  return useContext(DashboardContext);
}
