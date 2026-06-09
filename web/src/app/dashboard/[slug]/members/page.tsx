"use client";

import { useState, use } from "react";
import { Trash2, Plus, Users } from "lucide-react";
import { useDashboard } from "@/lib/dashboard-context";
import { ActionBtn } from "@/components/dashboard/action-btn";
import { DashInput, FieldLabel } from "@/components/dashboard/dash-input";
import { Spinner } from "@/components/kibo-ui/spinner";
import { RelativeTime } from "@/components/kibo-ui/relative-time";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { FACE_COLORS } from "@/utils/dashboard";

export default function MembersPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { members, loading, reload } = useDashboard();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ telegramId: "", displayName: "" });
  const [inviteLoading, setInviteLoading] = useState(false);

  const activeMembers = members.filter(m => m.isActive);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteLoading(true);
    try {
      await api.inviteMember(slug, {
        telegramId: parseInt(inviteForm.telegramId, 10),
        displayName: inviteForm.displayName || undefined,
      });
      setInviteOpen(false);
      setInviteForm({ telegramId: "", displayName: "" });
      reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed.");
    } finally {
      setInviteLoading(false);
    }
  }

  async function handleRemove(memberId: string) {
    if (!confirm("Deactivate this member?")) return;
    await api.removeMember(slug, memberId).catch(() => null);
    reload();
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ fontSize: 13.5, color: "var(--ink-50)", fontFamily: "var(--font-dm-sans)" }}>
          {activeMembers.length} active {activeMembers.length === 1 ? "member" : "members"}
        </p>
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <ActionBtn><Plus style={{ width: 13, height: 13 }} /> Invite member</ActionBtn>
          </DialogTrigger>
          <DialogContent className="bg-[var(--paper)] border-[var(--rule)] shadow-lg">
            <DialogHeader>
              <DialogTitle style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 700, color: "var(--ink)" }}>
                Invite a team member
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleInvite} style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: 4 }}>
              <div>
                <FieldLabel>Telegram user ID</FieldLabel>
                <DashInput mono placeholder="123456789" value={inviteForm.telegramId} onChange={e => setInviteForm(f => ({ ...f, telegramId: e.target.value.replace(/\D/g, "") }))} autoFocus required />
                <p style={{ fontSize: 11.5, color: "var(--ink-30)", marginTop: 6, fontFamily: "var(--font-dm-sans)" }}>
                  Ask them to message @userinfobot on Telegram.
                </p>
              </div>
              <div>
                <FieldLabel>
                  Display name <span style={{ fontWeight: 400, color: "var(--ink-15)" }}>(optional)</span>
                </FieldLabel>
                <DashInput placeholder="Jane Smith" value={inviteForm.displayName} onChange={e => setInviteForm(f => ({ ...f, displayName: e.target.value }))} />
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <ActionBtn variant="ghost" onClick={() => setInviteOpen(false)}>Cancel</ActionBtn>
                <ActionBtn type="submit" disabled={inviteLoading}>
                  {inviteLoading && <Spinner size={12} />} Invite
                </ActionBtn>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div style={{ borderRadius: 16, border: "1px solid var(--rule)", background: "white", overflow: "hidden" }}>
        {members.length === 0 ? (
          <div style={{ padding: "4rem 1.5rem", textAlign: "center" }}>
            <div style={{ height: 48, width: 48, borderRadius: 14, border: "1px solid var(--rule)", background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 0.75rem" }}>
              <Users style={{ width: 20, height: 20, color: "var(--ink-15)" }} />
            </div>
            <p style={{ fontSize: 13.5, color: "var(--ink-50)", fontFamily: "var(--font-dm-sans)" }}>No members yet.</p>
            <p style={{ fontSize: 12, color: "var(--ink-15)", marginTop: 4, fontFamily: "var(--font-dm-sans)" }}>Invite your team to get started.</p>
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 90px 90px 40px", gap: 16, padding: "0.625rem 1.25rem", borderBottom: "1px solid var(--rule)" }}>
              {["Member", "Role", "Status", "Joined", ""].map(h => (
                <span key={h} style={{ fontSize: 9.5, fontFamily: "var(--font-dm-sans)", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-15)" }}>{h}</span>
              ))}
            </div>
            <div>
              {members.map((member, i) => {
                const color = FACE_COLORS[i % FACE_COLORS.length];
                const initial = (member.displayName ?? member.telegramUsername ?? "?")[0].toUpperCase();
                return (
                  <div
                    key={member.id}
                    style={{ display: "grid", gridTemplateColumns: "1fr 80px 90px 90px 40px", gap: 16, alignItems: "center", padding: "0.875rem 1.25rem", borderBottom: i < members.length - 1 ? "1px solid var(--rule)" : "none", transition: "background 0.15s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "var(--surface)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                      <div style={{ height: 28, width: 28, borderRadius: "50%", background: `${color}14`, border: `1.5px solid ${color}28`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color, flexShrink: 0, fontFamily: "var(--font-dm-sans)" }}>
                        {initial}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 13.5, fontFamily: "var(--font-dm-sans)", fontWeight: 500, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {member.displayName ?? member.telegramUsername ?? `#${member.id.slice(0, 6)}`}
                        </p>
                        {member.telegramUsername && (
                          <p style={{ fontSize: 10.5, color: "var(--ink-30)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "var(--font-dm-sans)" }}>
                            @{member.telegramUsername}
                          </p>
                        )}
                      </div>
                    </div>
                    <span style={{ fontSize: 10.5, padding: "2px 8px", borderRadius: 999, width: "fit-content", fontFamily: "var(--font-dm-sans)", fontWeight: 500, textTransform: "capitalize", background: member.role === "admin" ? "var(--ink)" : "var(--surface)", border: "1px solid var(--rule)", color: member.role === "admin" ? "var(--paper)" : "var(--ink-50)" }}>
                      {member.role}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <div style={{ height: 6, width: 6, borderRadius: "50%", background: member.isActive ? "#4ade80" : "var(--rule)" }} />
                      <span style={{ fontSize: 11.5, color: member.isActive ? "#16a34a" : "var(--ink-30)", fontFamily: "var(--font-dm-sans)" }}>
                        {member.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <span style={{ fontSize: 11, color: "var(--ink-15)", fontFamily: "var(--font-dm-sans)" }}>
                      <RelativeTime date={member.joinedAt} />
                    </span>
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      {member.role !== "admin" && (
                        <button
                          onClick={() => handleRemove(member.id)}
                          style={{ height: 26, width: 26, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: "var(--ink-15)", transition: "all 0.15s" }}
                          onMouseEnter={e => { e.currentTarget.style.color = "rgb(185,28,28)"; e.currentTarget.style.background = "rgba(239,68,68,0.08)"; }}
                          onMouseLeave={e => { e.currentTarget.style.color = "var(--ink-15)"; e.currentTarget.style.background = "none"; }}
                        >
                          <Trash2 style={{ width: 12, height: 12 }} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
