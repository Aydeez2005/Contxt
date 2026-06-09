"use client";

import { usePathname } from "next/navigation";
import { useDashboard } from "@/lib/dashboard-context";
import { navLabelFromPathname } from "@/constants/nav";
import { getSetupSteps, isSetupComplete } from "@/utils/dashboard";

const SB = "rgba(213,211,202,0.45)";

type TopbarProps = {
  slug: string;
};

export function Topbar({ slug }: TopbarProps) {
  const pathname = usePathname();
  const { org, members, integrations } = useDashboard();

  const steps = getSetupSteps(org, integrations, members);
  const complete = isSetupComplete(steps);
  const doneCount = steps.filter(s => s.done).length;
  const label = navLabelFromPathname(slug, pathname);

  return (
    <div style={{
      height: 56, borderBottom: `1px solid ${SB}`,
      display: "flex", alignItems: "center", padding: "0 2rem", gap: 12,
      position: "sticky", top: 0,
      background: "rgba(248,247,242,0.92)", backdropFilter: "blur(20px)", zIndex: 10,
    }}>
      <h1 style={{ flex: 1, fontSize: 14, fontFamily: "var(--font-dm-sans)", fontWeight: 600, color: "var(--ink)" }}>
        {label}
      </h1>

      {complete ? (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ height: 6, width: 6, borderRadius: "50%", background: "#4ade80" }} />
          <span style={{ fontSize: 12, color: "var(--ink-50)", fontFamily: "var(--font-dm-sans)" }}>
            Setup complete
          </span>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", gap: 3 }}>
            {steps.map((s, i) => (
              <div key={i} style={{ height: 3, width: 18, borderRadius: 999, background: s.done ? "var(--ink)" : "var(--rule)", transition: "background 0.3s" }} />
            ))}
          </div>
          <span style={{ fontSize: 11, color: "var(--ink-30)", fontFamily: "var(--font-dm-sans)" }}>
            {doneCount}/{steps.length}
          </span>
        </div>
      )}
    </div>
  );
}
