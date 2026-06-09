"use client";

import Link from "next/link";

const EXAMPLES = {
  login: {
    query: "What is blocking the Stripe sprint?",
    answer: "Two open Jira blockers. STRIPE-41 is waiting on API spec from design — Sarah confirmed ETA Thursday. STRIPE-43 is unassigned.",
    sources: ["Jira", "GitHub"],
    heading: "Your team's memory,\non demand.",
    chips: ["No new app", "Instant answers", "All your tools"],
  },
  register: {
    query: "Anyone free for a code review at 3 pm?",
    answer: "Cedrick and Lena are both free 3–4 pm today. Mark has a meeting until 3:30 but is free after.",
    sources: ["Google Calendar"],
    heading: "Get started in\nfive minutes.",
    chips: ["No code required", "5-min setup", "Every tool, one bot"],
  },
};

export function AuthPanel({ variant = "login" }: { variant?: "login" | "register" }) {
  const ex = EXAMPLES[variant];

  return (
    <div
      className="beam-border-panel"
      style={{ flex: "0 0 42%", position: "sticky", top: "1.5rem", height: "calc(100vh - 3rem)" }}
    >
      <div
        style={{
          borderRadius: 21,
          height: "100%",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "2.5rem",
          background: [
            "radial-gradient(ellipse 65% 48% at 18% 22%, rgba(94,106,210,0.18) 0%, transparent 58%)",
            "radial-gradient(ellipse 52% 58% at 84% 80%, rgba(26,115,232,0.13) 0%, transparent 55%)",
            "radial-gradient(ellipse 42% 65% at 54% 52%, rgba(97,31,105,0.1) 0%, transparent 62%)",
            "var(--dark)",
          ].join(", "),
        }}
      >
        {/* ── Top: brand ── */}
        <div>
          <Link href="/" style={{ textDecoration: "none" }}>
            <span style={{
              fontFamily: "var(--font-syne)", fontWeight: 800,
              letterSpacing: "-0.025em", fontSize: "1.125rem", color: "#F8F7F2",
            }}>
              contxt
            </span>
          </Link>
          <p style={{
            fontSize: 11.5, color: "rgba(255,255,255,0.32)",
            marginTop: 6, fontFamily: "var(--font-dm-sans)",
          }}>
            Organisational intelligence
          </p>
        </div>

        {/* ── Middle: tagline + chips ── */}
        <div>
          <p style={{
            fontFamily: "var(--font-syne)", fontWeight: 800,
            fontSize: "clamp(1.875rem, 3vw, 2.875rem)",
            letterSpacing: "-0.04em", lineHeight: 1.08,
            color: "#F8F7F2", marginBottom: "1.5rem",
            whiteSpace: "pre-line",
          }}>
            {ex.heading}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {ex.chips.map(c => (
              <span key={c} style={{
                fontSize: 11.5, padding: "4px 12px", borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.05)",
                color: "rgba(255,255,255,0.52)",
                fontFamily: "var(--font-dm-sans)",
              }}>
                {c}
              </span>
            ))}
          </div>
        </div>

        {/* ── Bottom: conversation preview ── */}
        <div style={{
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.04)",
          backdropFilter: "blur(24px)",
          padding: "1.25rem",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80" }} />
            <span style={{
              fontSize: 9.5, fontFamily: "var(--font-syne)", fontWeight: 700,
              letterSpacing: "0.1em", textTransform: "uppercase",
              color: "rgba(255,255,255,0.38)",
            }}>
              Live example
            </span>
          </div>
          <p style={{
            fontSize: 13, color: "rgba(255,255,255,0.68)",
            fontFamily: "var(--font-dm-sans)", marginBottom: 9,
            fontStyle: "italic", lineHeight: 1.5,
          }}>
            &ldquo;{ex.query}&rdquo;
          </p>
          <p style={{
            fontSize: 12, color: "rgba(255,255,255,0.42)",
            fontFamily: "var(--font-dm-sans)", lineHeight: 1.68,
          }}>
            {ex.answer}
          </p>
          <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
            {ex.sources.map(s => (
              <span key={s} style={{
                fontSize: 9.5, padding: "2px 9px", borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.42)",
                fontFamily: "var(--font-syne)", fontWeight: 600,
              }}>
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
