"use client";

import { useState, use } from "react";
import { useDashboard } from "@/lib/dashboard-context";
import { INTEGRATIONS_CONFIG } from "@/constants/integrations";
import { ServiceBadge } from "@/components/dashboard/service-badge";
import { ActionBtn } from "@/components/dashboard/action-btn";
import { DashInput, FieldLabel } from "@/components/dashboard/dash-input";
import { Spinner } from "@/components/kibo-ui/spinner";
import { RelativeTime } from "@/components/kibo-ui/relative-time";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api } from "@/lib/api";

export default function IntegrationsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { integrations, loading, reload } = useDashboard();

  const [connectService, setConnectService] = useState<string | null>(null);
  const [connectToken, setConnectToken] = useState("");
  const [connectLoading, setConnectLoading] = useState(false);

  // Services that use the OAuth redirect flow
  const OAUTH_SERVICES = new Set(["jira", "linear", "slack", "github", "gcal"]);

  function handleConnectClick(service: string) {
    if (OAUTH_SERVICES.has(service)) {
      window.open(api.oauthConnectUrl(slug, service), "_blank", "noopener,noreferrer");
      // Reload integrations after a short delay to pick up the newly connected service
      setTimeout(() => reload(), 5000);
    } else {
      setConnectService(service);
      setConnectToken("");
    }
  }

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    if (!connectService) return;
    setConnectLoading(true);
    try {
      await api.connectIntegration(slug, connectService, { accessToken: connectToken });
      setConnectService(null);
      setConnectToken("");
      reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed.");
    } finally {
      setConnectLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <Spinner size={22} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <p style={{ fontSize: 13.5, color: "var(--ink-50)", fontFamily: "var(--font-dm-sans)", lineHeight: 1.65 }}>
        Connect your tools once — every member queries them through the Telegram bot.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.875rem" }}>
        {INTEGRATIONS_CONFIG.map(({ service, label, desc }) => {
          const connected = integrations.find(i => i.service === service);
          return (
            <div
              key={service}
              style={{ borderRadius: 16, border: "1px solid var(--rule)", background: "white", padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: 14, transition: "box-shadow 0.2s, border-color 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 18px rgba(24,23,15,0.06)"; e.currentTarget.style.borderColor = "var(--ink-08)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = "var(--rule)"; }}
            >
              <ServiceBadge service={service} size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontFamily: "var(--font-dm-sans)", fontWeight: 600, color: "var(--ink)" }}>{label}</p>
                <p style={{ fontSize: 11.5, color: "var(--ink-30)", fontFamily: "var(--font-dm-sans)", marginTop: 2 }}>{desc}</p>
                {connected && (
                  <p style={{ fontSize: 10.5, color: "var(--ink-15)", marginTop: 3, fontFamily: "var(--font-dm-sans)" }}>
                    Connected <RelativeTime date={connected.createdAt} />
                  </p>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ height: 6, width: 6, borderRadius: "50%", background: connected ? "#4ade80" : "var(--rule)" }} />
                  <span style={{ fontSize: 11, color: connected ? "#16a34a" : "var(--ink-30)", fontFamily: "var(--font-dm-sans)" }}>
                    {connected ? "Connected" : "Not connected"}
                  </span>
                </div>
                <ActionBtn
                  variant={connected ? "ghost" : "default"}
                  onClick={() => handleConnectClick(service)}
                >
                  {connected ? "Update" : "Connect"}
                </ActionBtn>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={!!connectService} onOpenChange={open => !open && setConnectService(null)}>
        <DialogContent className="bg-[var(--paper)] border-[var(--rule)] shadow-lg">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 700, color: "var(--ink)" }}>
              Connect {INTEGRATIONS_CONFIG.find(c => c.service === connectService)?.label}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleConnect} style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: 4 }}>
            <div>
              <FieldLabel>Access token</FieldLabel>
              <DashInput mono value={connectToken} onChange={e => setConnectToken(e.target.value)} placeholder="Paste your API token" autoFocus required />
              <p style={{ fontSize: 11.5, color: "var(--ink-30)", marginTop: 6, fontFamily: "var(--font-dm-sans)" }}>
                Stored securely and shared across all members.
              </p>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <ActionBtn variant="ghost" onClick={() => setConnectService(null)}>Cancel</ActionBtn>
              <ActionBtn type="submit" disabled={connectLoading}>
                {connectLoading && <Spinner size={12} />} Save
              </ActionBtn>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
