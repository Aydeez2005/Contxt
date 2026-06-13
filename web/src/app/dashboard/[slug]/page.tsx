"use client";

import { useEffect, useState, useCallback } from "react";
import { ChevronRight, Check } from "lucide-react";
import { useDashboard } from "@/lib/dashboard-context";
import { useRouter } from "next/navigation";
import { use } from "react";
import { HeroDecoration, MembersIllustration, ToolsIllustration, BotIllustration, TrendIllustration } from "@/components/dashboard/illustrations";
import { ServiceBadge } from "@/components/dashboard/service-badge";
import { MemberFaces } from "@/components/dashboard/member-faces";
import { INTEGRATIONS_CONFIG } from "@/constants/integrations";
import { getSetupSteps } from "@/utils/dashboard";
import { Spinner } from "@/components/kibo-ui/spinner";
import { api, type MemberSnapshot, type Member } from "@/lib/api";

const MEMBER_COLORS = ["#6366f1","#8b5cf6","#ec4899","#f59e0b","#10b981","#3b82f6","#ef4444","#14b8a6"];

function relativeTime(ts: string): string {
  const diff = Date.now() - parseInt(ts, 10) * 1000;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.floor(hrs / 24)} days ago`;
}

type ActivityItem = {
  memberId: string;
  name: string;
  color: string;
  tool: string;
  description: string;
  time: string;
};

function deriveActivity(members: Member[], snapshots: MemberSnapshot[]): ActivityItem[] {
  const snapMap = new Map(snapshots.map(s => [s.memberId, s]));
  return members
    .filter(m => m.isActive)
    .map((m, i) => {
      const snap = snapMap.get(m.id);
      if (!snap?.lastActivity) return null;
      return {
        memberId: m.id,
        name: m.displayName ?? m.telegramUsername ?? "?",
        color: MEMBER_COLORS[i % MEMBER_COLORS.length],
        tool: snap.lastActivity.tool,
        description: snap.lastActivity.description,
        time: relativeTime(snap.lastActivity.timestamp),
      };
    })
    .filter(Boolean) as ActivityItem[];
}

export default function OverviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const { org, members, integrations, loading } = useDashboard();

  const [snapshots, setSnapshots] = useState<MemberSnapshot[]>([]);
  const [snapsLoading, setSnapsLoading] = useState(true);

  const loadSnapshots = useCallback(async () => {
    setSnapsLoading(true);
    try { setSnapshots(await api.getSnapshots(slug)); }
    catch { setSnapshots([]); }
    finally { setSnapsLoading(false); }
  }, [slug]);

  useEffect(() => {
    if (!loading) loadSnapshots();
  }, [loading, loadSnapshots]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <Spinner size={22} />
      </div>
    );
  }

  const activeMembers = members.filter(m => m.isActive);
  const setupSteps = getSetupSteps(org, integrations, members);
  const setupDone = setupSteps.filter(s => s.done).length;
  const activity = deriveActivity(members, snapshots);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.375rem" }}>

      {/* Hero card */}
      <div style={{ borderRadius: 20, border: "1px solid var(--rule)", background: "white", overflow: "hidden", position: "relative", padding: "2rem 2.5rem" }}>
        <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, overflow: "hidden", opacity: 0.04, pointerEvents: "none" }}>
          <HeroDecoration />
        </div>
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1.5rem" }}>
          <div>
            <p style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--ink-15)", fontFamily: "var(--font-dm-sans)", fontWeight: 600, marginBottom: 10 }}>
              Organisation
            </p>
            <h2 style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 800, fontSize: "clamp(2rem, 3.5vw, 3rem)", letterSpacing: "-0.045em", color: "var(--ink)", lineHeight: 0.95 }}>
              {org?.name ?? slug}
            </h2>
            <p style={{ fontSize: 12, color: "var(--ink-30)", marginTop: 10, fontFamily: "monospace" }}>
              {slug} · {activeMembers.length} active member{activeMembers.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div style={{ display: "flex", borderRadius: 14, border: "1px solid var(--rule)", background: "var(--surface)", overflow: "hidden" }}>
            {[
              { val: activeMembers.length, label: "Members" },
              { val: integrations.length,  label: "Integrations" },
              { val: org?.telegramBotUsername ? "Live" : "Off", label: "Bot" },
            ].map(({ val, label }, i, arr) => (
              <div key={label} style={{ padding: "1.125rem 1.75rem", textAlign: "center", borderRight: i < arr.length - 1 ? "1px solid var(--rule)" : "none" }}>
                <p style={{ fontSize: "1.875rem", fontFamily: "var(--font-dm-sans)", fontWeight: 800, letterSpacing: "-0.04em", color: "var(--ink)", lineHeight: 1 }}>
                  {val}
                </p>
                <p style={{ fontSize: 11, color: "var(--ink-30)", marginTop: 5, fontFamily: "var(--font-dm-sans)" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4 stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.875rem" }}>
        {[
          {
            label: "Active members", value: activeMembers.length,
            Illustration: MembersIllustration,
            sub: <MemberFaces members={activeMembers} />,
          },
          {
            label: "Connected tools", value: integrations.length,
            Illustration: ToolsIllustration,
            sub: (
              <div style={{ display: "flex", gap: 5, marginTop: 16, flexWrap: "wrap" }}>
                {integrations.length === 0
                  ? <span style={{ fontSize: 11, color: "var(--ink-30)", fontFamily: "var(--font-dm-sans)" }}>None yet</span>
                  : integrations.map(t => <ServiceBadge key={t.service} service={t.service} size={26} />)
                }
              </div>
            ),
          },
          {
            label: "Telegram bot", value: org?.telegramBotUsername ? "Active" : "Not set",
            Illustration: BotIllustration,
            sub: org?.telegramBotUsername ? (
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 16 }}>
                <div style={{ height: 6, width: 6, borderRadius: "50%", background: "#4ade80" }} />
                <span style={{ fontSize: 11, color: "var(--ink-50)", fontFamily: "var(--font-dm-sans)" }}>@{org.telegramBotUsername}</span>
              </div>
            ) : (
              <button onClick={() => router.push(`/dashboard/${slug}/bot`)} style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, color: "var(--ink-30)", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "var(--font-dm-sans)", transition: "color 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.color = "var(--ink)"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "var(--ink-30)"; }}
              >
                Set up now <ChevronRight style={{ width: 12, height: 12 }} />
              </button>
            ),
          },
          {
            label: "Setup progress", value: `${setupDone}/${setupSteps.length}`,
            Illustration: TrendIllustration,
            sub: (
              <div style={{ display: "flex", gap: 4, marginTop: 16 }}>
                {setupSteps.map((s, i) => (
                  <div key={i} style={{ flex: 1, height: 3, borderRadius: 999, background: s.done ? "var(--ink)" : "var(--rule)", transition: "background 0.3s" }} />
                ))}
              </div>
            ),
          },
        ].map(({ label, value, Illustration, sub }) => (
          <div key={label} style={{ borderRadius: 16, border: "1px solid var(--rule)", background: "white", padding: "1.25rem 1.375rem", display: "flex", flexDirection: "column", transition: "box-shadow 0.2s, border-color 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 18px rgba(24,23,15,0.06)"; e.currentTarget.style.borderColor = "var(--ink-08)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = "var(--rule)"; }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontSize: 11.5, color: "var(--ink-30)", fontFamily: "var(--font-dm-sans)" }}>{label}</p>
                <p style={{ fontSize: "1.75rem", fontFamily: "var(--font-dm-sans)", fontWeight: 800, letterSpacing: "-0.03em", marginTop: 4, color: "var(--ink)", lineHeight: 1 }}>
                  {value}
                </p>
              </div>
              <Illustration />
            </div>
            {sub}
          </div>
        ))}
      </div>

      {/* 2-column: activity feed + right panel */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "0.875rem", alignItems: "start" }}>

        {/* Activity feed */}
        <div style={{ borderRadius: 16, border: "1px solid var(--rule)", background: "white", overflow: "hidden" }}>
          <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--rule)", display: "flex", alignItems: "center", gap: 10 }}>
            <p style={{ fontSize: 13.5, fontFamily: "var(--font-dm-sans)", fontWeight: 600, color: "var(--ink)", flex: 1 }}>Recent activity</p>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ height: 6, width: 6, borderRadius: "50%", background: "#4ade80" }} />
              <span style={{ fontSize: 11, color: "var(--ink-30)", fontFamily: "var(--font-dm-sans)" }}>Live</span>
            </div>
          </div>
          <div>
            {snapsLoading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
                <Spinner size={18} />
              </div>
            ) : activity.length === 0 ? (
              <div style={{ padding: "2rem 1.5rem", textAlign: "center", fontSize: 13, color: "var(--ink-30)", fontFamily: "var(--font-dm-sans)", lineHeight: 1.6 }}>
                No activity yet — snapshots update every 10 minutes after the Telegram bot receives its first query.
              </div>
            ) : activity.map(({ memberId, name, color, tool, description, time }, i, arr) => (
              <div key={memberId} style={{ padding: "1.125rem 1.5rem", borderBottom: i < arr.length - 1 ? "1px solid var(--rule)" : "none", transition: "background 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "var(--surface)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
              >
                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ height: 28, width: 28, borderRadius: "50%", flexShrink: 0, background: `${color}16`, border: `1.5px solid ${color}28`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10.5, fontWeight: 700, color, fontFamily: "var(--font-dm-sans)" }}>
                    {name[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontFamily: "var(--font-dm-sans)", fontWeight: 600, color: "var(--ink)" }}>{name}</span>
                      <span style={{ fontSize: 11, color: "var(--ink-15)", fontFamily: "var(--font-dm-sans)" }}>{time}</span>
                    </div>
                    <p style={{ fontSize: 12.5, color: "var(--ink-70)", fontFamily: "var(--font-dm-sans)", lineHeight: 1.65 }}>{description}</p>
                    <div style={{ display: "flex", gap: 5, marginTop: 10 }}>
                      <ServiceBadge service={tool} size={22} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>

          {/* Connected stack */}
          <div style={{ borderRadius: 16, border: "1px solid var(--rule)", background: "white", overflow: "hidden" }}>
            <div style={{ padding: "0.875rem 1.25rem", borderBottom: "1px solid var(--rule)" }}>
              <p style={{ fontSize: 13.5, fontFamily: "var(--font-dm-sans)", fontWeight: 600, color: "var(--ink)" }}>Connected stack</p>
            </div>
            <div>
              {INTEGRATIONS_CONFIG.map(({ service, label }, i, arr) => {
                const connected = integrations.find(t => t.service === service);
                return (
                  <div key={service} style={{ display: "flex", alignItems: "center", gap: 10, padding: "0.6rem 1.25rem", borderBottom: i < arr.length - 1 ? "1px solid var(--rule)" : "none", transition: "background 0.15s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "var(--surface)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <ServiceBadge service={service} size={28} />
                    <span style={{ flex: 1, fontSize: 13, fontFamily: "var(--font-dm-sans)", color: connected ? "var(--ink)" : "var(--ink-30)" }}>{label}</span>
                    <div style={{ height: 7, width: 7, borderRadius: "50%", background: connected ? "#4ade80" : "var(--rule)", flexShrink: 0 }} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Setup checklist */}
          <div style={{ borderRadius: 16, border: "1px solid var(--rule)", background: "white", overflow: "hidden" }}>
            <div style={{ padding: "0.875rem 1.25rem", borderBottom: "1px solid var(--rule)" }}>
              <p style={{ fontSize: 13.5, fontFamily: "var(--font-dm-sans)", fontWeight: 600, color: "var(--ink)" }}>Setup checklist</p>
              <p style={{ fontSize: 11.5, color: "var(--ink-30)", marginTop: 2, fontFamily: "var(--font-dm-sans)" }}>{setupDone} of {setupSteps.length} complete</p>
            </div>
            <div>
              {setupSteps.map(({ label, done }, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "0.7rem 1.25rem", borderBottom: i < setupSteps.length - 1 ? "1px solid var(--rule)" : "none", transition: "background 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--surface)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                >
                  {done ? (
                    <div style={{ height: 18, width: 18, borderRadius: "50%", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.28)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Check style={{ width: 10, height: 10, color: "#16a34a" }} />
                    </div>
                  ) : (
                    <div style={{ height: 18, width: 18, borderRadius: "50%", border: "1.5px solid var(--rule)", flexShrink: 0 }} />
                  )}
                  <span style={{ flex: 1, fontSize: 12.5, fontFamily: "var(--font-dm-sans)", color: done ? "var(--ink-15)" : "var(--ink-70)", textDecoration: done ? "line-through" : "none" }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
