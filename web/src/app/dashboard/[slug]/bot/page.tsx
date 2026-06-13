"use client";

import { useState, use } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { useDashboard } from "@/lib/dashboard-context";
import { ActionBtn } from "@/components/dashboard/action-btn";
import { Spinner } from "@/components/kibo-ui/spinner";
import { api } from "@/lib/api";

export default function BotPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { org, loading, reload } = useDashboard();

  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleConnect() {
    setConnecting(true);
    setError(null);
    try {
      await api.registerBot(slug);
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect bot.");
    } finally {
      setConnecting(false);
    }
  }

  function handleCopy() {
    const username = org?.botUsername ?? org?.telegramBotUsername;
    if (!username) return;
    navigator.clipboard.writeText(`https://t.me/${username}`);
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

  const botUsername = org?.botUsername ?? org?.telegramBotUsername;
  const isConnected = !!botUsername;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", maxWidth: 520 }}>

      <div style={{ borderRadius: 12, border: "1px solid var(--rule)", background: "white", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ padding: "1rem 1.375rem", borderBottom: "1px solid var(--rule)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 13.5, fontFamily: "var(--font-dm-sans)", fontWeight: 600, color: "var(--ink)" }}>Telegram bot</p>
            <p style={{ fontSize: 11.5, color: "var(--ink-30)", fontFamily: "var(--font-dm-sans)", marginTop: 2 }}>
              {isConnected ? `@${botUsername}` : "Not linked"}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ height: 7, width: 7, borderRadius: "50%", background: isConnected ? "#22c55e" : "var(--rule)" }} />
            <span style={{ fontSize: 11.5, fontFamily: "var(--font-dm-sans)", color: "var(--ink-30)" }}>
              {isConnected ? "Live" : "Offline"}
            </span>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "1.375rem", display: "flex", flexDirection: "column", gap: "1.125rem" }}>

          {isConnected ? (
            <>
              {/* Link row */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, borderRadius: 8, border: "1px solid var(--rule)", background: "var(--surface)", padding: "0.5rem 0.75rem" }}>
                <span style={{ flex: 1, fontSize: 12.5, fontFamily: "monospace", color: "var(--ink-70)" }}>
                  t.me/{botUsername}
                </span>
                <button
                  onClick={handleCopy}
                  title="Copy link"
                  style={{ height: 26, width: 26, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, background: "none", border: "none", cursor: "pointer", transition: "background 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--rule)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
                >
                  {copied
                    ? <Check style={{ width: 12, height: 12, color: "#22c55e" }} />
                    : <Copy style={{ width: 12, height: 12, color: "var(--ink-30)" }} />
                  }
                </button>
                <a
                  href={`https://t.me/${botUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ height: 26, width: 26, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, color: "var(--ink-30)", transition: "background 0.15s, color 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--rule)"; e.currentTarget.style.color = "var(--ink)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--ink-30)"; }}
                >
                  <ExternalLink style={{ width: 12, height: 12 }} />
                </a>
              </div>

              <p style={{ fontSize: 12.5, color: "var(--ink-30)", fontFamily: "var(--font-dm-sans)", lineHeight: 1.6 }}>
                Share this link with your team. Members open it, start the bot, and can immediately ask questions across your connected tools.
              </p>

              {error && (
                <p style={{ fontSize: 12.5, color: "#dc2626", fontFamily: "var(--font-dm-sans)" }}>{error}</p>
              )}

              <ActionBtn onClick={handleConnect} disabled={connecting} variant="ghost">
                {connecting && <Spinner size={12} />}
                Re-link bot
              </ActionBtn>
            </>
          ) : (
            <>
              <p style={{ fontSize: 13, color: "var(--ink-50)", fontFamily: "var(--font-dm-sans)", lineHeight: 1.65 }}>
                The bot is configured on the server. Click below to link it to this workspace so your team can start using it.
              </p>

              {error && (
                <p style={{ fontSize: 12.5, color: "#dc2626", fontFamily: "var(--font-dm-sans)" }}>{error}</p>
              )}

              <ActionBtn onClick={handleConnect} disabled={connecting}>
                {connecting ? <><Spinner size={12} />Linking…</> : "Link bot to this workspace"}
              </ActionBtn>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
