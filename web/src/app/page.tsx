"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Jira, Linear, Slack, Notion, Github, GoogleCalendar } from "@thesvg/react";

/* ─── Scroll-reveal ─────────────────────────────────────────────── */
function Reveal({
  children,
  delay = 0,
  className = "",
  style,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
          io.disconnect();
        }
      },
      { threshold: 0.06, rootMargin: "0px 0px -24px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: 0,
        transform: "translateY(22px)",
        transition: `opacity 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}ms,
                     transform 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ─── Wordmark ──────────────────────────────────────────────────── */
function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <span
      style={{
        fontFamily: "var(--font-syne, system-ui)",
        fontWeight: 700,
        fontSize: 18,
        letterSpacing: "-0.03em",
        color: light ? "rgba(248,247,242,0.85)" : "var(--ink)",
        lineHeight: 1,
        userSelect: "none",
      }}
    >
      Contxt
    </span>
  );
}

/* ─── Telegram mockup ───────────────────────────────────────────── */
const TELE_MESSAGES: {
  from: "user" | "bot";
  text: string;
  sources?: string[];
}[] = [
  { from: "user", text: "What's blocking the Stripe sprint?" },
  {
    from: "bot",
    text: "Two open Jira blockers. STRIPE-41 needs design spec — Sarah confirmed ETA Thursday. STRIPE-43 is unassigned.",
    sources: ["Jira", "GitHub"],
  },
  { from: "user", text: "Who's free for a code review at 3 pm?" },
  {
    from: "bot",
    text: "Cedrick and Lena are both free 3–4 pm. Mark available after 3:30.",
    sources: ["Calendar"],
  },
];

function TelegramMockup() {
  const [visibleIds, setVisibleIds] = useState<number[]>([]);
  const [typing, setTyping] = useState(false);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    let alive = true;

    const run = async () => {
      const wait = (ms: number) =>
        new Promise<void>((r) => setTimeout(r, ms));

      while (alive) {
        setFade(true);
        setVisibleIds([]);
        setTyping(false);

        await wait(800);  if (!alive) break;
        setVisibleIds([0]);                   // user 1

        await wait(900);  if (!alive) break;
        setTyping(true);

        await wait(1400); if (!alive) break;
        setTyping(false);
        setVisibleIds((v) => [...v, 1]);      // bot 1

        await wait(1100); if (!alive) break;
        setVisibleIds((v) => [...v, 2]);      // user 2

        await wait(900);  if (!alive) break;
        setTyping(true);

        await wait(1300); if (!alive) break;
        setTyping(false);
        setVisibleIds((v) => [...v, 3]);      // bot 2

        await wait(3200); if (!alive) break;  // pause to read
        setFade(false);                       // fade out

        await wait(600);  if (!alive) break;
      }
    };

    run();
    return () => { alive = false; };
  }, []);

  return (
    <div
      style={{
        animation: "mockup-enter 0.95s cubic-bezier(0.16,1,0.3,1) 0.5s both",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: 340,
          background: "#121828",
          borderRadius: 22,
          overflow: "hidden",
          boxShadow:
            "0 0 0 1px rgba(255,255,255,0.06), 0 40px 80px rgba(0,0,0,0.28), 0 8px 20px rgba(0,0,0,0.14)",
          opacity: fade ? 1 : 0,
          transition: "opacity 0.55s ease",
        }}
      >
        {/* Telegram header */}
        <div
          style={{
            background: "#141a27",
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div
            style={{
              width: 34, height: 34, borderRadius: "50%",
              background: "#2b5ea7",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 700, color: "white",
              fontFamily: "var(--font-syne)",
              flexShrink: 0,
            }}
          >
            C
          </div>
          <div>
            <div style={{ color: "rgba(255,255,255,0.9)", fontSize: 13.5, fontWeight: 600, fontFamily: "var(--font-syne)", lineHeight: 1 }}>
              Contxt Bot
            </div>
            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, fontFamily: "var(--font-dm-sans)", marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#4ade80" }} />
              online
            </div>
          </div>
        </div>

        {/* Messages */}
        <div
          style={{
            padding: "14px 11px",
            display: "flex",
            flexDirection: "column",
            gap: 7,
            minHeight: 310,
            background: "#0f1520",
          }}
        >
          {TELE_MESSAGES.map((msg, i) =>
            visibleIds.includes(i) ? (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: msg.from === "user" ? "flex-end" : "flex-start",
                  animation:
                    msg.from === "user"
                      ? "msg-in-right 0.32s cubic-bezier(0.16,1,0.3,1)"
                      : "msg-in-left 0.32s cubic-bezier(0.16,1,0.3,1)",
                }}
              >
                <div
                  style={{
                    background: msg.from === "user" ? "#2b5278" : "#1a2840",
                    color:
                      msg.from === "user"
                        ? "rgba(255,255,255,0.9)"
                        : "rgba(255,255,255,0.78)",
                    borderRadius:
                      msg.from === "user"
                        ? "14px 14px 4px 14px"
                        : "14px 14px 14px 4px",
                    padding: "8px 12px",
                    maxWidth: "84%",
                    fontSize: 11,
                    lineHeight: 1.52,
                    fontFamily: "var(--font-dm-sans)",
                  }}
                >
                  {msg.text}
                  {msg.sources && (
                    <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
                      {msg.sources.map((s) => (
                        <span
                          key={s}
                          style={{
                            fontSize: 9,
                            padding: "2px 7px",
                            borderRadius: 999,
                            border: "1px solid rgba(255,255,255,0.14)",
                            color: "rgba(255,255,255,0.42)",
                            fontFamily: "var(--font-syne)",
                            fontWeight: 600,
                            letterSpacing: "0.05em",
                          }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null
          )}

          {typing && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                animation: "msg-in-left 0.28s cubic-bezier(0.16,1,0.3,1)",
              }}
            >
              <div
                style={{
                  background: "#1a2840",
                  borderRadius: "14px 14px 14px 4px",
                  padding: "10px 14px",
                  display: "flex",
                  gap: 5,
                  alignItems: "center",
                }}
              >
                {[0, 1, 2].map((j) => (
                  <div
                    key={j}
                    style={{
                      width: 5, height: 5, borderRadius: "50%",
                      background: "rgba(255,255,255,0.32)",
                      animation: `pulse-dot 1.1s ease-in-out ${j * 160}ms infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input bar */}
        <div
          style={{
            background: "#141a27",
            borderTop: "1px solid rgba(255,255,255,0.05)",
            padding: "9px 11px",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              flex: 1,
              height: 34,
              background: "#1a2840",
              borderRadius: 17,
              display: "flex",
              alignItems: "center",
              padding: "0 12px",
            }}
          >
            <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.18)", fontFamily: "var(--font-dm-sans)" }}>
              Ask anything…
            </span>
          </div>
          <div
            style={{
              width: 34, height: 34, borderRadius: "50%",
              background: "#2b5ea7",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
                stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Step illustrations ─────────────────────────────────────────── */
function StepIllustration({ step }: { step: number }) {
  const TOOL_NODES = [
    { l: "J",  color: "#0052CC", angle: -90  },
    { l: "L",  color: "#5E6AD2", angle: -30  },
    { l: "Gh", color: "#1F6FEB", angle:  30  },
    { l: "G",  color: "#1A73E8", angle:  90  },
    { l: "S",  color: "#611F69", angle: 150  },
    { l: "N",  color: "#2F2F2F", angle: 210  },
  ];

  if (step === 0) {
    // Hub & spoke — tools connecting to Contxt
    const ox = 148, oy = 122, orbit = 88;
    return (
      <svg viewBox="0 0 296 244" width="100%" aria-hidden fill="none">
        {/* Orbit ring */}
        <circle cx={ox} cy={oy} r={orbit} stroke="var(--rule)" strokeWidth="1" strokeDasharray="3 5" />
        {TOOL_NODES.map(t => {
          const rad = (t.angle * Math.PI) / 180;
          const tx = ox + Math.cos(rad) * orbit;
          const ty = oy + Math.sin(rad) * orbit;
          const ix = ox + Math.cos(rad) * 28;
          const iy = oy + Math.sin(rad) * 28;
          const ex = ox + Math.cos(rad) * (orbit - 20);
          const ey = oy + Math.sin(rad) * (orbit - 20);
          return (
            <g key={t.l}>
              <line x1={ix} y1={iy} x2={ex} y2={ey}
                stroke={t.color} strokeWidth="1.2" strokeOpacity="0.25" strokeDasharray="3.5 3" />
              <circle cx={tx} cy={ty} r="22" fill={t.color} fillOpacity="0.08" />
              <circle cx={tx} cy={ty} r="17" fill="var(--paper)" stroke={t.color} strokeWidth="1" strokeOpacity="0.45" />
              <text x={tx} y={ty + 4.5} textAnchor="middle" fontSize="9" fontWeight="700"
                fontFamily="Syne, system-ui" fill={t.color}>{t.l}</text>
            </g>
          );
        })}
        {/* Center glow halo */}
        <circle cx={ox} cy={oy} r="36" fill="var(--ink)" fillOpacity="0.06" />
        {/* Center Contxt block */}
        <rect x={ox - 24} y={oy - 24} width="48" height="48" rx="14" fill="var(--ink)" />
        <text x={ox} y={oy - 5} textAnchor="middle" fontSize="7.5" fontWeight="600"
          fontFamily="Syne, system-ui" fill="rgba(248,247,242,0.4)">CONTXT</text>
        <text x={ox} y={oy + 11} textAnchor="middle" fontSize="13" fontWeight="800"
          fontFamily="Syne, system-ui" fill="#F8F7F2">Cx</text>
        {/* "6 sources" badge */}
        <rect x={ox - 30} y={oy + 30} width="60" height="16" rx="8" fill="var(--surface)" stroke="var(--rule)" />
        <text x={ox} y={oy + 41} textAnchor="middle" fontSize="7.5" fontWeight="600"
          fontFamily="Syne, system-ui" fill="var(--ink-30)">6 sources live</text>
      </svg>
    );
  }

  if (step === 1) {
    // Team of coloured avatar circles
    const members = [
      { i: "AC", color: "#0052CC", x: 64,  y: 88 },
      { i: "MS", color: "#611F69", x: 148, y: 66 },
      { i: "LK", color: "#5E6AD2", x: 232, y: 88 },
      { i: "BD", color: "#1F6FEB", x: 106, y: 158 },
      { i: "RJ", color: "#1A73E8", x: 190, y: 158 },
    ];
    return (
      <svg viewBox="0 0 296 244" width="100%" aria-hidden fill="none">
        {/* Thin connection lines */}
        <line x1="64"  y1="88"  x2="148" y2="66"  stroke="var(--rule)" strokeWidth="1" />
        <line x1="148" y1="66"  x2="232" y2="88"  stroke="var(--rule)" strokeWidth="1" />
        <line x1="64"  y1="88"  x2="106" y2="158" stroke="var(--rule)" strokeWidth="1" />
        <line x1="232" y1="88"  x2="190" y2="158" stroke="var(--rule)" strokeWidth="1" />
        <line x1="148" y1="66"  x2="106" y2="158" stroke="var(--rule)" strokeWidth="1" />
        <line x1="148" y1="66"  x2="190" y2="158" stroke="var(--rule)" strokeWidth="1" />
        <line x1="106" y1="158" x2="190" y2="158" stroke="var(--rule)" strokeWidth="1" />
        {/* Avatars */}
        {members.map(m => (
          <g key={m.i}>
            <circle cx={m.x} cy={m.y} r="26" fill={m.color} fillOpacity="0.09" />
            <circle cx={m.x} cy={m.y} r="22" fill={m.color} fillOpacity="0.14" stroke={m.color} strokeWidth="1" strokeOpacity="0.5" />
            <text x={m.x} y={m.y + 5} textAnchor="middle" fontSize="10.5" fontWeight="700"
              fontFamily="Syne, system-ui" fill={m.color}>{m.i}</text>
          </g>
        ))}
        {/* Plus / invite button */}
        <circle cx="252" cy="158" r="22" fill="var(--surface)" stroke="var(--rule)" strokeWidth="1.5" strokeDasharray="3 3" />
        <line x1="244" y1="158" x2="260" y2="158" stroke="var(--ink-30)" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="252" y1="150" x2="252" y2="166" stroke="var(--ink-30)" strokeWidth="1.8" strokeLinecap="round" />
        {/* Telegram ready badge */}
        <rect x="88" y="202" width="120" height="22" rx="11" fill="var(--ink)" fillOpacity="0.07" stroke="var(--rule)" />
        <circle cx="105" cy="213" r="7" fill="#2b5ea7" fillOpacity="0.75" />
        <text x="162" y="217" textAnchor="middle" fontSize="8" fontWeight="600"
          fontFamily="Syne, system-ui" fill="var(--ink-30)">All on Telegram</text>
      </svg>
    );
  }

  // step 2 — Ask anything (dark Telegram-style chat)
  return (
    <svg viewBox="0 0 296 244" width="100%" aria-hidden fill="none">
      {/* Chat window */}
      <rect x="28" y="10" width="240" height="218" rx="22" fill="var(--dark)" />
      <rect x="28" y="10" width="240" height="218" rx="22" stroke="rgba(255,255,255,0.06)" />
      {/* Top bar */}
      <circle cx="148" cy="35" r="14" fill="#2b5ea7" fillOpacity="0.8" />
      <text x="148" y="40" textAnchor="middle" fontSize="10" fontWeight="700"
        fontFamily="Syne, system-ui" fill="rgba(255,255,255,0.9)">Cx</text>
      <rect x="118" y="56" width="60" height="5" rx="2.5" fill="rgba(255,255,255,0.1)" />
      {/* User question — right */}
      <rect x="108" y="74" width="140" height="26" rx="13" fill="#2b5ea7" fillOpacity="0.8" />
      <text x="178" y="89" textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.92)"
        fontFamily="system-ui, sans-serif">Who owns the Q2 roadmap?</text>
      {/* Bot reply — left */}
      <rect x="40" y="114" width="178" height="74" rx="14" fill="rgba(255,255,255,0.07)" />
      <rect x="55" y="128" width="100" height="5" rx="2.5" fill="rgba(255,255,255,0.28)" />
      <rect x="55" y="141" width="140" height="5" rx="2.5" fill="rgba(255,255,255,0.18)" />
      <rect x="55" y="154" width="85" height="5" rx="2.5" fill="rgba(255,255,255,0.12)" />
      {/* Source chips */}
      <rect x="55" y="168" width="44" height="12" rx="6" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.12)" />
      <text x="77" y="177" textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.45)"
        fontFamily="system-ui, sans-serif">Notion</text>
      <rect x="106" y="168" width="40" height="12" rx="6" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.12)" />
      <text x="126" y="177" textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.45)"
        fontFamily="system-ui, sans-serif">Slack</text>
      {/* Input bar */}
      <rect x="40" y="202" width="162" height="16" rx="8" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.07)" />
      <text x="52" y="213" fontSize="7.5" fill="rgba(255,255,255,0.2)"
        fontFamily="system-ui, sans-serif">Ask anything...</text>
      {/* Send button */}
      <circle cx="234" cy="210" r="10" fill="#2b5ea7" fillOpacity="0.8" />
      <path d="M229.5 210.5l6-3-0.7 6-2.2-2.2-3.1-0.8z" fill="white" fillOpacity="0.9" />
    </svg>
  );
}

/* ─── Data ──────────────────────────────────────────────────────── */
const CONVERSATIONS = [
  {
    from: "Alex Chen",
    query: "What's blocking the Stripe sprint?",
    answer:
      "Two open Jira blockers. STRIPE-41 is waiting on API spec from design — Sarah confirmed ETA Thursday. STRIPE-43 is unassigned, no action yet.",
    sources: ["Jira", "GitHub"],
  },
  {
    from: "Maria Santos",
    query: "Anyone free for a code review at 3 pm?",
    answer:
      "Cedrick and Lena are both free 3–4 pm today. Mark has a meeting until 3:30 but is free after.",
    sources: ["Google Calendar"],
  },
  {
    from: "Bruno D.",
    query: "What shipped last week?",
    answer:
      "Three PRs merged: auth refactor (#44), rate limiting (#45), new /orgs endpoint (#46). Notion release notes updated Thursday.",
    sources: ["GitHub", "Notion"],
  },
];

const PILLARS = [
  {
    n: "01",
    title: "Zero context-switching",
    body: "Ask about blockers, decisions, and code without leaving your conversation. Every answer arrives in seconds, across every tool at once.",
  },
  {
    n: "02",
    title: "One setup, everyone benefits",
    body: "An admin connects your tools once. Every team member can immediately query the full organisational context — including people who join tomorrow.",
  },
  {
    n: "03",
    title: "Answers that cite their source",
    body: "Every response names exactly which Jira ticket, Slack thread, or GitHub PR it came from. No black boxes.",
  },
];

const STEPS = [
  {
    n: "01",
    label: "Register and connect",
    body: "Create your workspace and paste API tokens for your existing tools. Under five minutes — no engineering required.",
  },
  {
    n: "02",
    label: "Add your team",
    body: "Invite members by Telegram user ID. They are active immediately — no new accounts, no downloads, no onboarding.",
  },
  {
    n: "03",
    label: "Ask in plain language",
    body: "Every member opens your Telegram bot and types their question naturally. Contxt searches across all connected tools in real time.",
  },
];

const TOOL_LIST = [
  { name: "Jira",             tag: "Project tracking",  Icon: Jira,           color: "#0052CC" },
  { name: "Linear",           tag: "Issue tracking",    Icon: Linear,         color: "#5E6AD2" },
  { name: "Slack",            tag: "Team messaging",    Icon: Slack,          color: "#611F69" },
  { name: "Notion",           tag: "Documentation",     Icon: Notion,         color: "#2F2F2F" },
  { name: "GitHub",           tag: "Code & PRs",        Icon: Github,         color: "#1F6FEB" },
  { name: "Google Calendar",  tag: "Scheduling",        Icon: GoogleCalendar, color: "#1A73E8" },
];

/* ─── Layout constant ────────────────────────────────────────────── */
const W = { maxWidth: 1200, margin: "0 auto", padding: "0 2rem" } as const;

/* ─── Page ───────────────────────────────────────────────────────── */
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const howRef = useRef<HTMLDivElement>(null);
  const [howStep, setHowStep] = useState(0);
  const [howProgress, setHowProgress] = useState(0);

  useEffect(() => {
    const fn = () => {
      setScrolled(window.scrollY > 44);

      if (howRef.current) {
        const rect = howRef.current.getBoundingClientRect();
        const h = howRef.current.offsetHeight;
        const wh = window.innerHeight;
        const scrollable = h - wh;
        if (scrollable > 0) {
          const p = Math.max(0, Math.min(1, -rect.top / scrollable));
          setHowProgress(p);
          setHowStep(Math.min(2, Math.floor(p * 3)));
        }
      }
    };
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <div style={{ background: "var(--paper)", color: "var(--ink)", overflowX: "clip" }}>

      {/* ── GLASS PILL NAV ──────────────────────────────────────── */}
      <div
        style={{
          position: "fixed",
          top: 14,
          left: 0, right: 0,
          zIndex: 50,
          display: "flex",
          justifyContent: "center",
          padding: "0 1.25rem",
          pointerEvents: "none",
        }}
      >
        <header
          style={{
            position: "relative",
            width: "100%",
            maxWidth: 1020,
            background: "rgba(248,247,242,0.84)",
            backdropFilter: "blur(24px) saturate(180%)",
            WebkitBackdropFilter: "blur(24px) saturate(180%)",
            border: "1px solid rgba(255,255,255,0.72)",
            boxShadow: scrolled
              ? "0 8px 40px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,1)"
              : "0 2px 24px rgba(0,0,0,0.055), inset 0 1px 0 rgba(255,255,255,1)",
            borderRadius: 999,
            padding: "0.4375rem 0.4375rem 0.4375rem 1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            pointerEvents: "auto",
            transition: "box-shadow 0.4s ease",
            animation: "nav-pill-enter 0.65s cubic-bezier(0.34, 1.56, 0.64, 1) 0.08s both",
          }}
        >
          <Wordmark />

          <nav
            className="hidden md:flex items-center"
            style={{ gap: "2rem", position: "absolute", left: "50%", transform: "translateX(-50%)" }}
          >
            <a href="#why" className="nav-link">Why Contxt</a>
            <a href="#how" className="nav-link">How it works</a>
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <Link href="/login" className="cta-ghost" style={{ fontSize: "0.8125rem" }}>
              Sign in
            </Link>
            <Link
              href="/register"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "#111",
                color: "#f8f7f2",
                fontFamily: "var(--font-syne), system-ui",
                fontWeight: 600,
                fontSize: "0.8125rem",
                borderRadius: 999,
                padding: "0.5rem 1.0625rem",
                textDecoration: "none",
                transition: "background 0.2s, transform 0.22s cubic-bezier(0.34,1.56,0.64,1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#2a2a2a";
                e.currentTarget.style.transform = "scale(1.03)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#111";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              Get started <ArrowRight style={{ width: 12, height: 12 }} />
            </Link>
          </div>
        </header>
      </div>

      {/* ── HERO — two-column with Telegram mockup ───────────────── */}
      <section
        style={{
          minHeight: "100svh",
          paddingTop: 80,
          display: "flex",
          alignItems: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle grid texture */}
        <div aria-hidden style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(var(--rule) 1px, transparent 1px), linear-gradient(90deg, var(--rule) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          opacity: 0.15,
          pointerEvents: "none",
        }} />

        <div style={{ ...W, width: "100%", padding: "4rem 2rem 5.5rem" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "55% 45%",
            gap: "4rem",
            alignItems: "center",
          }}>
            {/* Left: text content */}
            <div>
              <div style={{ animation: "float-up 0.6s cubic-bezier(0.16,1,0.3,1) 0s both" }}>
                <span className="section-label" style={{ marginBottom: "1.5rem" }}>
                  Team intelligence via Telegram
                </span>
              </div>

              <h1
                style={{
                  fontFamily: "var(--font-syne, system-ui)",
                  fontWeight: 800,
                  fontSize: "clamp(50px, 6vw, 88px)",
                  lineHeight: 0.97,
                  letterSpacing: "-0.04em",
                  marginBottom: "1.75rem",
                  maxWidth: "16ch",
                }}
              >
                <span style={{ display: "block", animation: "float-up 0.7s cubic-bezier(0.16,1,0.3,1) 0.06s both" }}>
                  Know{" "}
                  <em style={{ fontFamily: "var(--font-cormorant, Georgia)", fontStyle: "italic", fontWeight: 400, letterSpacing: "-0.02em" }}>
                    everything.
                  </em>
                </span>
                <span style={{ display: "block", animation: "float-up 0.7s cubic-bezier(0.16,1,0.3,1) 0.18s both" }}>
                  Ask{" "}
                  <em style={{ fontFamily: "var(--font-cormorant, Georgia)", fontStyle: "italic", fontWeight: 400, letterSpacing: "-0.02em" }}>
                    anything.
                  </em>
                </span>
              </h1>

              <p
                style={{
                  fontFamily: "var(--font-dm-sans, system-ui)",
                  fontSize: "1.0rem",
                  lineHeight: 1.78,
                  color: "var(--ink-50)",
                  maxWidth: 400,
                  marginBottom: "2.25rem",
                  animation: "float-up 0.7s cubic-bezier(0.16,1,0.3,1) 0.3s both",
                }}
              >
                Connect Jira, Slack, Notion and GitHub once.
                Your entire team gets instant answers — right inside
                Telegram, no onboarding required.
              </p>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1.25rem",
                  flexWrap: "wrap",
                  animation: "float-up 0.7s cubic-bezier(0.16,1,0.3,1) 0.42s both",
                }}
              >
                <div className="beam-border-pill">
                  <Link href="/register" className="cta-primary" style={{ fontSize: "0.9375rem", padding: "0.75rem 1.625rem" }}>
                    Register your company <ArrowRight style={{ width: 15, height: 15 }} />
                  </Link>
                </div>
                <a href="#demo" className="cta-ghost">
                  See it live
                </a>
              </div>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "1.75rem",
                  marginTop: "2.25rem",
                  animation: "float-up 0.7s cubic-bezier(0.16,1,0.3,1) 0.52s both",
                }}
              >
                {["5-minute setup", "No new app", "No credit card"].map((t) => (
                  <span
                    key={t}
                    style={{
                      fontFamily: "var(--font-dm-sans, system-ui)",
                      fontSize: 12,
                      color: "var(--ink-30)",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <svg width="11" height="9" viewBox="0 0 12 9" fill="none" aria-hidden>
                      <path d="M1 4.5L4.2 7.5L11 1" stroke="var(--ink-30)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: Telegram mockup */}
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
              <TelegramMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── INTEGRATIONS STRIP ─────────────────────────────────── */}
      <section
        style={{
          background: "var(--paper-2)",
          borderTop: "1px solid var(--rule)",
          borderBottom: "1px solid var(--rule)",
          paddingTop: "3rem",
          paddingBottom: "3rem",
        }}
      >
        <div style={{ ...W }}>
          <Reveal>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "2rem" }}>
              <div>
                <span className="section-label">Integrations</span>
                <h3
                  style={{
                    fontFamily: "var(--font-syne)",
                    fontWeight: 700,
                    fontSize: "clamp(1.25rem, 2.5vw, 1.5rem)",
                    letterSpacing: "-0.02em",
                    color: "var(--ink)",
                    margin: 0,
                    lineHeight: 1.1,
                  }}
                >
                  Works with your entire stack.
                </h3>
              </div>
              <span
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: 11.5,
                  color: "var(--ink-15)",
                  whiteSpace: "nowrap",
                  paddingBottom: 3,
                }}
              >
                More coming soon
              </span>
            </div>
          </Reveal>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "1px",
              background: "var(--rule)",
              border: "1px solid var(--rule)",
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            {TOOL_LIST.map(({ name, tag, Icon, color }, i) => (
              <Reveal key={name} delay={i * 45}>
                <div
                  style={{
                    background: "var(--paper)",
                    padding: "1.375rem 1.375rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    cursor: "default",
                    position: "relative",
                    overflow: "hidden",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--paper-2)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "var(--paper)"; }}
                >
                  {/* soft color orb */}
                  <div
                    aria-hidden
                    style={{
                      position: "absolute",
                      top: -24, left: -24,
                      width: 88, height: 88,
                      borderRadius: "50%",
                      background: `radial-gradient(circle, ${color}28 0%, transparent 68%)`,
                      pointerEvents: "none",
                    }}
                  />
                  {/* icon container */}
                  <div
                    style={{
                      width: 42, height: 42,
                      borderRadius: 11,
                      border: "1px solid var(--rule)",
                      background: "var(--paper)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      position: "relative",
                    }}
                  >
                    <Icon width={22} height={22} />
                  </div>
                  {/* text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "var(--font-syne)", fontWeight: 600, fontSize: 13.5, color: "var(--ink)", lineHeight: 1 }}>
                      {name}
                    </div>
                    <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 11.5, color: "var(--ink-30)", marginTop: 4 }}>
                      {tag}
                    </div>
                  </div>
                  {/* status */}
                  <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80" }} />
                    <span style={{ fontFamily: "var(--font-syne)", fontSize: 8.5, fontWeight: 700, letterSpacing: "0.12em", color: "var(--ink-30)", textTransform: "uppercase" }}>
                      Ready
                    </span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRODUCT IN ACTION ──────────────────────────────────── */}
      <section
        id="demo"
        style={{
          background: "var(--dark)",
          paddingTop: 120,
          paddingBottom: 120,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Beam cone */}
        <div aria-hidden style={{
          position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
          width: "100%", height: "90%",
          background: "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.018) 30%, transparent 75%)",
          clipPath: "polygon(38% 0%, 62% 0%, 92% 100%, 8% 100%)",
          pointerEvents: "none",
          animation: "beam-pulse 8s ease-in-out infinite",
        }} />
        <div aria-hidden style={{
          position: "absolute", top: -100, left: "50%", transform: "translateX(-50%)",
          width: 320, height: 200,
          background: "radial-gradient(ellipse at 50% 100%, rgba(255,255,255,0.22) 0%, transparent 65%)",
          pointerEvents: "none",
          animation: "beam-pulse 8s ease-in-out infinite",
        }} />

        <div style={{ ...W, position: "relative" }}>
          <Reveal>
            <span className="section-label" style={{ color: "rgba(248,247,242,0.32)" }}>
              In action
            </span>
            <h2
              style={{
                fontFamily: "var(--font-syne, system-ui)",
                fontWeight: 700,
                fontSize: "clamp(30px, 3.2vw, 46px)",
                lineHeight: 1.12,
                letterSpacing: "-0.025em",
                color: "rgba(248,247,242,0.92)",
                maxWidth: 540,
                marginBottom: "3.5rem",
              }}
            >
              Real answers from your real stack.{" "}
              <em style={{ fontFamily: "var(--font-cormorant, Georgia)", fontStyle: "italic", fontWeight: 400 }}>
                Every time.
              </em>
            </h2>
          </Reveal>

          <div className="beam-border">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "1px",
                background: "rgba(255,255,255,0.045)",
                borderRadius: 15,
                overflow: "hidden",
              }}
            >
              {CONVERSATIONS.map((c, i) => (
                <Reveal
                  key={c.from}
                  delay={i * 90}
                  style={{
                    background: "var(--dark-2)",
                    padding: "2.25rem",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <span style={{
                    fontFamily: "var(--font-syne)", fontSize: 10, fontWeight: 700,
                    letterSpacing: "0.12em", textTransform: "uppercase",
                    color: "rgba(255,255,255,0.42)", marginBottom: "0.75rem",
                  }}>
                    {c.from}
                  </span>
                  <p style={{
                    fontFamily: "var(--font-cormorant, Georgia)",
                    fontStyle: "italic", fontSize: 22, fontWeight: 400,
                    lineHeight: 1.3, color: "rgba(248,247,242,0.88)",
                    marginBottom: "1.5rem", letterSpacing: "-0.01em",
                  }}>
                    &ldquo;{c.query}&rdquo;
                  </p>
                  <div style={{ height: 1, background: "rgba(255,255,255,0.08)", marginBottom: "1.25rem" }} />
                  <p style={{
                    fontFamily: "var(--font-dm-sans, system-ui)", fontSize: 13.5,
                    lineHeight: 1.82, color: "rgba(248,247,242,0.66)",
                    flex: 1, marginBottom: "1.5rem",
                  }}>
                    {c.answer}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span style={{
                      fontFamily: "var(--font-syne)", fontSize: 9, fontWeight: 700,
                      letterSpacing: "0.16em", textTransform: "uppercase",
                      color: "rgba(255,255,255,0.26)", marginRight: 4,
                    }}>
                      From
                    </span>
                    {c.sources.map((s) => (
                      <span key={s} style={{
                        fontFamily: "var(--font-dm-sans)", fontSize: 10, fontWeight: 500,
                        padding: "2px 9px", borderRadius: 999,
                        border: "1px solid rgba(255,255,255,0.16)",
                        color: "rgba(255,255,255,0.52)",
                      }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── WHY CONTXT ─────────────────────────────────────────── */}
      <section id="why" style={{ paddingTop: 136, paddingBottom: 136 }}>
        <div style={{ ...W }}>
          <Reveal>
            <span className="section-label">Why Contxt</span>
            <h2
              style={{
                fontFamily: "var(--font-syne, system-ui)",
                fontWeight: 700,
                fontSize: "clamp(30px, 3.2vw, 46px)",
                lineHeight: 1.12,
                letterSpacing: "-0.025em",
                maxWidth: 620,
                marginBottom: "5rem",
              }}
            >
              Your team already asks these questions every day.{" "}
              <em style={{ fontFamily: "var(--font-cormorant, Georgia)", fontStyle: "italic", fontWeight: 400, letterSpacing: "-0.01em" }}>
                Now they get answers.
              </em>
            </h2>
          </Reveal>

          <div style={{ borderTop: "1px solid var(--rule)" }}>
            {PILLARS.map((p, i) => (
              <Reveal
                key={p.n}
                delay={i * 80}
                className="pillar-item"
                style={{
                  display: "grid",
                  gridTemplateColumns: "64px 1fr 1fr",
                  gap: "2rem 4rem",
                  padding: "2.875rem 0",
                  borderBottom: "1px solid var(--rule)",
                  cursor: "default",
                }}
              >
                <span style={{ fontFamily: "var(--font-syne)", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", color: "var(--ink-15)", paddingTop: 3 }}>
                  {p.n}
                </span>
                <h3 style={{ fontFamily: "var(--font-syne, system-ui)", fontWeight: 600, fontSize: 20, letterSpacing: "-0.02em", lineHeight: 1.25, color: "var(--ink)" }}>
                  {p.title}
                </h3>
                <p style={{ fontFamily: "var(--font-dm-sans, system-ui)", fontSize: 14.5, lineHeight: 1.75, color: "var(--ink-50)" }}>
                  {p.body}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS — sticky scroll ───────────────────────── */}
      <section
        ref={howRef}
        id="how"
        style={{
          height: "300vh",
          position: "relative",
          background: "var(--surface)",
          borderTop: "1px solid var(--rule)",
          borderBottom: "1px solid var(--rule)",
        }}
      >
        <div
          style={{
            position: "sticky",
            top: 0,
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          {/* Decorative background step number */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              right: "3%",
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: "clamp(140px, 22vw, 300px)",
              fontFamily: "var(--font-syne)",
              fontWeight: 800,
              color: "var(--ink)",
              opacity: 0.028,
              lineHeight: 1,
              userSelect: "none",
              pointerEvents: "none",
              transition: "opacity 0.4s",
            }}
          >
            {String(howStep + 1).padStart(2, "0")}
          </div>

          <div style={{ ...W, width: "100%", position: "relative" }}>

            {/* Section label — always visible */}
            <div style={{ marginBottom: "3.5rem" }}>
              <span className="section-label">How it works</span>
              <h2
                style={{
                  fontFamily: "var(--font-syne, system-ui)",
                  fontWeight: 700,
                  fontSize: "clamp(28px, 2.8vw, 42px)",
                  lineHeight: 1.12,
                  letterSpacing: "-0.025em",
                }}
              >
                Live in five minutes.
              </h2>
            </div>

            {/* Step content + illustration — 2 columns */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6rem", alignItems: "center" }}>

              {/* Left: step text */}
              <div style={{ position: "relative", height: "18rem" }}>
                {STEPS.map((s, i) => (
                  <div
                    key={s.n}
                    style={{
                      position: "absolute",
                      inset: 0,
                      opacity: howStep === i ? 1 : 0,
                      transform:
                        howStep === i
                          ? "translateY(0)"
                          : howStep > i
                          ? "translateY(-20px)"
                          : "translateY(20px)",
                      transition:
                        "opacity 0.55s cubic-bezier(0.16,1,0.3,1), transform 0.55s cubic-bezier(0.16,1,0.3,1)",
                      pointerEvents: howStep === i ? "auto" : "none",
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.125rem" }}>
                      <span style={{
                        fontFamily: "var(--font-syne)", fontSize: 11, fontWeight: 700,
                        letterSpacing: "0.1em", color: "var(--ink-15)",
                      }}>
                        {s.n} / 03
                      </span>
                      <h3 style={{
                        fontFamily: "var(--font-syne, system-ui)", fontWeight: 700,
                        fontSize: "clamp(22px, 2.6vw, 38px)",
                        letterSpacing: "-0.025em", lineHeight: 1.15, color: "var(--ink)",
                      }}>
                        {s.label}
                      </h3>
                      <p style={{
                        fontFamily: "var(--font-dm-sans, system-ui)", fontSize: 15,
                        lineHeight: 1.74, color: "var(--ink-50)", maxWidth: 380,
                      }}>
                        {s.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Right: illustration */}
              <div style={{ position: "relative", height: "18rem" }}>
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: howStep === i ? 1 : 0,
                      transform:
                        howStep === i
                          ? "translateY(0) scale(1)"
                          : howStep > i
                          ? "translateY(-20px) scale(0.94)"
                          : "translateY(20px) scale(0.94)",
                      transition:
                        "opacity 0.6s cubic-bezier(0.16,1,0.3,1), transform 0.6s cubic-bezier(0.16,1,0.3,1)",
                      pointerEvents: howStep === i ? "auto" : "none",
                    }}
                  >
                    <StepIllustration step={i} />
                  </div>
                ))}
              </div>
            </div>

            {/* Step progress indicators */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: "3.5rem" }}>
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  style={{
                    height: 5,
                    width: howStep === i ? 32 : 5,
                    borderRadius: 999,
                    background: howStep === i ? "var(--ink)" : "var(--ink-15)",
                    transition: "width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.3s",
                  }}
                />
              ))}
              <span style={{ fontFamily: "var(--font-syne)", fontSize: 10, fontWeight: 600, color: "var(--ink-30)", letterSpacing: "0.08em", marginLeft: 8 }}>
                {howStep + 1} / 3
              </span>
            </div>
          </div>

          {/* Scroll progress line at bottom */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: "var(--rule)" }}>
            <div style={{
              height: "100%",
              background: "var(--ink)",
              width: `${howProgress * 100}%`,
              opacity: 0.35,
              transition: "width 0.08s linear",
            }} />
          </div>
        </div>
      </section>

      {/* ── SELLING SECTION ────────────────────────────────────── */}
      <section
        style={{
          background: "var(--dark)",
          paddingTop: 120,
          paddingBottom: 120,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle radial warmth */}
        <div aria-hidden style={{
          position: "absolute", top: "-20%", right: "-10%",
          width: "50vw", height: "50vw",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,255,255,0.025) 0%, transparent 65%)",
          pointerEvents: "none",
        }} />

        <div style={{ ...W }}>
          {/* Two-column layout: pain quotes left, CTA right */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1px 1fr",
            gap: "0 5rem",
            alignItems: "center",
          }}>

            {/* Left — the pain questions your team already asks */}
            <Reveal>
              <p style={{
                fontFamily: "var(--font-syne)",
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "rgba(248,247,242,0.25)",
                marginBottom: "2rem",
              }}>
                Sound familiar?
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {[
                  { q: "What's blocking the Stripe sprint?",   o: 0.86 },
                  { q: "Who reviewed the API changes?",        o: 0.52 },
                  { q: "What shipped last week?",              o: 0.26 },
                ].map(({ q, o }) => (
                  <p
                    key={q}
                    style={{
                      fontFamily: "var(--font-cormorant, Georgia)",
                      fontStyle: "italic",
                      fontSize: "clamp(20px, 2.2vw, 28px)",
                      fontWeight: 400,
                      lineHeight: 1.28,
                      letterSpacing: "-0.02em",
                      color: `rgba(248,247,242,${o})`,
                    }}
                  >
                    &ldquo;{q}&rdquo;
                  </p>
                ))}
              </div>
            </Reveal>

            {/* Divider */}
            <div style={{ background: "rgba(255,255,255,0.07)", alignSelf: "stretch" }} />

            {/* Right — the CTA */}
            <Reveal delay={120}>
              <span className="section-label" style={{ color: "rgba(248,247,242,0.28)" }}>
                Get started
              </span>
              <h2
                style={{
                  fontFamily: "var(--font-syne, system-ui)",
                  fontWeight: 700,
                  fontSize: "clamp(28px, 3.4vw, 50px)",
                  lineHeight: 1.1,
                  letterSpacing: "-0.03em",
                  color: "rgba(248,247,242,0.92)",
                  marginBottom: "1rem",
                  marginTop: "1rem",
                }}
              >
                Your team deserves instant answers.
              </h2>
              <p
                style={{
                  fontFamily: "var(--font-dm-sans, system-ui)",
                  fontSize: 15,
                  lineHeight: 1.72,
                  color: "rgba(248,247,242,0.44)",
                  marginBottom: "2.5rem",
                  maxWidth: 360,
                }}
              >
                Connect your tools once. Every employee gets
                answers in Telegram — no new app, no training.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", alignItems: "flex-start" }}>
                <Link
                  href="/register"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    background: "rgba(248,247,242,0.92)",
                    color: "var(--dark)",
                    fontFamily: "var(--font-syne), system-ui",
                    fontWeight: 600,
                    fontSize: "0.9375rem",
                    borderRadius: 999,
                    padding: "0.875rem 1.875rem",
                    textDecoration: "none",
                    transition: "background 0.2s, transform 0.22s cubic-bezier(0.34,1.56,0.64,1)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#fff";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(248,247,242,0.92)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  Register your company <ArrowRight style={{ width: 15, height: 15 }} />
                </Link>

                <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
                  <Link
                    href="/login"
                    style={{
                      fontFamily: "var(--font-dm-sans)",
                      fontSize: 13,
                      fontWeight: 500,
                      color: "rgba(248,247,242,0.3)",
                      textDecoration: "none",
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(248,247,242,0.6)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(248,247,242,0.3)")}
                  >
                    Sign in to existing workspace
                  </Link>
                  <span style={{ color: "rgba(248,247,242,0.1)", fontSize: 12 }}>·</span>
                  <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: 12, color: "rgba(248,247,242,0.2)" }}>
                    No credit card required
                  </span>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer
        style={{
          background: "var(--dark)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          padding: "2.25rem 0",
        }}
      >
        <div style={{ ...W, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
            <Wordmark light />
            <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 11, color: "rgba(248,247,242,0.22)", marginTop: 4 }}>
              Organisational intelligence via Telegram.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
            <Link
              href="/login"
              style={{ fontFamily: "var(--font-dm-sans)", fontSize: 12, color: "rgba(248,247,242,0.22)", textDecoration: "none", transition: "color 0.2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(248,247,242,0.55)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(248,247,242,0.22)")}
            >
              Sign in
            </Link>
            <Link
              href="/register"
              style={{ fontFamily: "var(--font-dm-sans)", fontSize: 12, color: "rgba(248,247,242,0.22)", textDecoration: "none", transition: "color 0.2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(248,247,242,0.55)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(248,247,242,0.22)")}
            >
              Register
            </Link>
          </div>

          <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 11, color: "rgba(248,247,242,0.14)" }}>
            &copy; {new Date().getFullYear()} Contxt. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  );
}
