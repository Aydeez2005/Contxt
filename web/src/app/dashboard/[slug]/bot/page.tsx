"use client";

import { useState, use } from "react";
import { Bot, Copy, Check } from "lucide-react";
import { useDashboard } from "@/lib/dashboard-context";
import { ActionBtn } from "@/components/dashboard/action-btn";
import { DashInput, FieldLabel } from "@/components/dashboard/dash-input";
import { Spinner } from "@/components/kibo-ui/spinner";
import { Banner } from "@/components/kibo-ui/banner";
import { api } from "@/lib/api";

export default function BotPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { org, loading, reload } = useDashboard();

  const [botToken, setBotToken] = useState("");
  const [botLoading, setBotLoading] = useState(false);
  const [botMsg, setBotMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleRegisterBot(e: React.FormEvent) {
    e.preventDefault();
    setBotLoading(true);
    setBotMsg(null);
    try {
      const res = await api.registerBot(slug, botToken);
      setBotMsg({ type: "success", text: `@${res.botUsername ?? "bot"} is live.` });
      setBotToken("");
      reload();
    } catch (err) {
      setBotMsg({ type: "error", text: err instanceof Error ? err.message : "Failed." });
    } finally {
      setBotLoading(false);
    }
  }

  function handleCopyBotLink() {
    if (!org?.telegramBotUsername) return;
    navigator.clipboard.writeText(`https://t.me/${org.telegramBotUsername}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <Spinner size={22} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", maxWidth: 560 }}>

      {/* Status card */}
      {org?.telegramBotToken ? (
        <div style={{ borderRadius: 16, border: "1px solid rgba(74,222,128,0.25)", background: "rgba(74,222,128,0.04)", padding: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{ height: 36, width: 36, borderRadius: 10, background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Bot style={{ width: 16, height: 16, color: "#16a34a" }} />
            </div>
            <div>
              <p style={{ fontSize: 14, fontFamily: "var(--font-dm-sans)", fontWeight: 600, color: "var(--ink)" }}>Bot connected</p>
              <p style={{ fontSize: 11.5, color: "var(--ink-50)", fontFamily: "var(--font-dm-sans)" }}>@{org.telegramBotUsername}</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, borderRadius: 9, border: "1px solid var(--rule)", background: "var(--surface)", padding: "0.5rem 0.875rem" }}>
            <span style={{ flex: 1, fontSize: 12.5, fontFamily: "monospace", color: "var(--ink-50)" }}>
              t.me/{org.telegramBotUsername}
            </span>
            <button
              onClick={handleCopyBotLink}
              style={{ height: 24, width: 24, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, background: "none", border: "none", cursor: "pointer", transition: "background 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--rule)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
            >
              {copied
                ? <Check style={{ width: 12, height: 12, color: "#16a34a" }} />
                : <Copy style={{ width: 12, height: 12, color: "var(--ink-30)" }} />
              }
            </button>
          </div>
          <p style={{ fontSize: 12, color: "var(--ink-50)", marginTop: 12, fontFamily: "var(--font-dm-sans)", lineHeight: 1.6 }}>
            Share this link with your team — they start the bot and ask questions.
          </p>
        </div>
      ) : (
        <div style={{ borderRadius: 16, border: "1px solid rgba(251,191,36,0.28)", background: "rgba(251,191,36,0.04)", padding: "1.125rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ height: 36, width: 36, borderRadius: 10, background: "rgba(251,191,36,0.09)", border: "1px solid rgba(251,191,36,0.22)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Bot style={{ width: 16, height: 16, color: "#b45309" }} />
            </div>
            <div>
              <p style={{ fontSize: 14, fontFamily: "var(--font-dm-sans)", fontWeight: 600, color: "var(--ink)" }}>No bot connected yet</p>
              <p style={{ fontSize: 11.5, color: "var(--ink-50)", fontFamily: "var(--font-dm-sans)", marginTop: 2 }}>Follow the steps below to get started.</p>
            </div>
          </div>
        </div>
      )}

      {/* Connect form */}
      <div style={{ borderRadius: 16, border: "1px solid var(--rule)", background: "white", overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--rule)" }}>
          <p style={{ fontSize: 14, fontFamily: "var(--font-dm-sans)", fontWeight: 600, color: "var(--ink)" }}>
            {org?.telegramBotToken ? "Replace bot token" : "Connect your bot"}
          </p>
        </div>
        <div style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {!org?.telegramBotToken && (
            <ol style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                <>Open Telegram and message <span style={{ fontFamily: "monospace", color: "var(--ink)" }}>@BotFather</span></>,
                <>Send <span style={{ fontFamily: "monospace", color: "var(--ink)" }}>/newbot</span> and follow the prompts</>,
                <>Copy the token BotFather gives you</>,
                <>Paste it below and click Connect</>,
              ].map((step, i) => (
                <li key={i} style={{ display: "flex", gap: 12, fontSize: 13.5, color: "var(--ink-50)", fontFamily: "var(--font-dm-sans)" }}>
                  <span style={{ height: 20, width: 20, borderRadius: 6, flexShrink: 0, background: "var(--surface)", border: "1px solid var(--rule)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9.5, fontWeight: 700, color: "var(--ink-30)", marginTop: 2, fontFamily: "var(--font-dm-sans)" }}>
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          )}

          {botMsg && (
            <Banner variant={botMsg.type === "success" ? "success" : "error"} onDismiss={() => setBotMsg(null)}>
              {botMsg.text}
            </Banner>
          )}

          <form onSubmit={handleRegisterBot} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <FieldLabel>Bot token</FieldLabel>
              <DashInput mono placeholder="1234567890:AAF..." value={botToken} onChange={e => setBotToken(e.target.value)} required />
            </div>
            <ActionBtn type="submit" disabled={botLoading}>
              {botLoading && <Spinner size={12} />}
              {org?.telegramBotToken ? "Update bot" : "Connect bot"}
            </ActionBtn>
          </form>
        </div>
      </div>
    </div>
  );
}
