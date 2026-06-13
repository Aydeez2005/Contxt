"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Spinner } from "@/components/kibo-ui/spinner";
import { api } from "@/lib/api";
import { ArrowRight, ArrowLeft, Check, Copy } from "lucide-react";
import { AuthPanel } from "@/components/auth-panel";

type Step = "org" | "admin" | "done";

function slugify(v: string) {
  return v.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 32);
}

function LightInput({
  mono = false,
  style: extraStyle,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { mono?: boolean }) {
  return (
    <input
      style={{
        width: "100%", height: 44, borderRadius: 10,
        border: "1px solid var(--rule)", background: "var(--surface)",
        padding: "0 0.875rem", fontSize: 14,
        fontFamily: mono ? "monospace" : "var(--font-dm-sans)",
        color: "var(--ink)", outline: "none",
        boxSizing: "border-box",
        transition: "border-color 0.18s, background 0.18s",
        ...extraStyle,
      }}
      onFocus={e => {
        e.currentTarget.style.borderColor = "var(--ink-30)";
        e.currentTarget.style.background = "var(--paper)";
      }}
      onBlur={e => {
        e.currentTarget.style.borderColor = "var(--rule)";
        e.currentTarget.style.background = "var(--surface)";
      }}
      {...props}
    />
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{
      display: "block", fontSize: 13, fontFamily: "var(--font-dm-sans)",
      fontWeight: 500, color: "var(--ink-70)", marginBottom: "0.4375rem",
    }}>
      {children}
    </label>
  );
}

function SubmitPill({
  children, disabled, onClick, type = "button",
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className="cta-primary"
      style={{
        width: "100%", justifyContent: "center",
        fontSize: "0.9375rem", padding: "0.8125rem 1.5rem",
        opacity: disabled ? 0.42 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        marginTop: "0.375rem",
      }}
    >
      {children}
    </button>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("org");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [orgSlug, setOrgSlug] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", adminTelegramId: "", adminDisplayName: "" });

  function set(k: keyof typeof form, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit() {
    const telegramId = parseInt(form.adminTelegramId, 10);
    if (isNaN(telegramId)) { setError("Telegram ID must be a number."); return; }
    setError(null); setLoading(true);
    try {
      const res = await api.register({ name: form.name, slug: form.slug, adminTelegramId: telegramId, adminDisplayName: form.adminDisplayName || undefined });
      api.saveToken(res.slug, res.adminToken);
      setAdminToken(res.adminToken); setOrgSlug(res.slug); setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally { setLoading(false); }
  }

  function handleCopy(token: string) {
    navigator.clipboard.writeText(token); setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const stepIndex = step === "org" ? 0 : step === "admin" ? 1 : 2;
  const stepLabels = ["Organisation", "Admin", "Done"];

  return (
    <div style={{
      minHeight: "100vh", background: "var(--paper)",
      padding: "1.5rem", display: "flex", gap: "2.5rem",
    }}>
      {/* ── Left: dark visual panel ── */}
      <AuthPanel variant="register" />

      {/* ── Right: form ── */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        minHeight: "calc(100vh - 3rem)", padding: "0.75rem 1.5rem",
      }}>
        {/* Top nav */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "2.5rem" }}>
          <Link href="/login" style={{
            fontSize: 13, color: "var(--ink-50)", textDecoration: "none",
            fontFamily: "var(--font-dm-sans)",
          }}>
            Have an account?{" "}
            <span style={{ color: "var(--ink)", textDecoration: "underline", textUnderlineOffset: 3, fontWeight: 500 }}>
              Sign in
            </span>
          </Link>
        </div>

        {/* Center: form */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: "100%", maxWidth: 440 }}>

            {/* Step indicator — DM Sans, clean */}
            {step !== "done" && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "2.25rem" }}>
                {stepLabels.slice(0, 2).map((label, i) => {
                  const done = i < stepIndex;
                  const active = i === stepIndex;
                  return (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{
                        height: 24, width: 24, borderRadius: "50%", flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 11, fontFamily: "var(--font-dm-sans)", fontWeight: 600,
                        background: done || active ? "var(--ink)" : "transparent",
                        color: done || active ? "#F8F7F2" : "var(--ink-30)",
                        border: done || active ? "none" : "1px solid var(--rule)",
                        transition: "all 0.25s",
                      }}>
                        {done ? <Check style={{ width: 11, height: 11 }} /> : i + 1}
                      </div>
                      <span style={{
                        fontSize: 13, fontFamily: "var(--font-dm-sans)", fontWeight: active ? 500 : 400,
                        color: active ? "var(--ink)" : "var(--ink-30)", transition: "color 0.2s",
                      }}>
                        {label}
                      </span>
                      {i < 1 && (
                        <div style={{ width: 28, height: 1, background: "var(--rule)", margin: "0 4px" }} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Step 1: Org ── */}
            {step === "org" && (
              <div>
                <h1 style={{
                  fontFamily: "var(--font-dm-sans)", fontWeight: 800,
                  fontSize: "2rem", letterSpacing: "-0.025em",
                  color: "var(--ink)", marginBottom: "0.5rem", lineHeight: 1.1,
                }}>
                  Name your organisation
                </h1>
                <p style={{
                  fontSize: 14, color: "var(--ink-50)", fontFamily: "var(--font-dm-sans)",
                  marginBottom: "2rem", lineHeight: 1.65,
                }}>
                  Choose a display name and a URL slug for your workspace.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div>
                    <FieldLabel>Company name</FieldLabel>
                    <LightInput
                      placeholder="Acme Corp"
                      value={form.name}
                      onChange={e => { set("name", e.target.value); set("slug", slugify(e.target.value)); }}
                      autoFocus
                    />
                  </div>

                  <div>
                    <FieldLabel>Workspace slug</FieldLabel>
                    <div style={{ position: "relative" }}>
                      <span style={{
                        position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                        fontSize: 13, color: "var(--ink-30)", pointerEvents: "none",
                        fontFamily: "var(--font-dm-sans)", userSelect: "none",
                      }}>
                        contxt.app/
                      </span>
                      <LightInput
                        mono
                        placeholder="acme-corp"
                        value={form.slug}
                        onChange={e => set("slug", slugify(e.target.value))}
                        style={{ paddingLeft: 92 }}
                      />
                    </div>
                    <p style={{
                      fontSize: 12, color: "var(--ink-30)", marginTop: "0.375rem",
                      fontFamily: "var(--font-dm-sans)",
                    }}>
                      Lowercase, numbers and hyphens only.
                    </p>
                  </div>
                </div>

                <SubmitPill
                  disabled={!form.name.trim() || !form.slug.trim()}
                  onClick={() => setStep("admin")}
                >
                  Continue <ArrowRight style={{ width: 15, height: 15 }} />
                </SubmitPill>
              </div>
            )}

            {/* ── Step 2: Admin ── */}
            {step === "admin" && (
              <div>
                <button
                  onClick={() => setStep("org")}
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    fontSize: 13, color: "var(--ink-30)", background: "none",
                    border: "none", cursor: "pointer", padding: 0,
                    fontFamily: "var(--font-dm-sans)", marginBottom: "1.75rem",
                    transition: "color 0.18s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = "var(--ink)"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = "var(--ink-30)"; }}
                >
                  <ArrowLeft style={{ width: 13, height: 13 }} /> Back
                </button>

                <h1 style={{
                  fontFamily: "var(--font-dm-sans)", fontWeight: 800,
                  fontSize: "2rem", letterSpacing: "-0.025em",
                  color: "var(--ink)", marginBottom: "0.5rem", lineHeight: 1.1,
                }}>
                  Admin access
                </h1>
                <p style={{
                  fontSize: 14, color: "var(--ink-50)", fontFamily: "var(--font-dm-sans)",
                  marginBottom: "2rem", lineHeight: 1.65,
                }}>
                  Your Telegram user ID makes you the org admin. Message{" "}
                  <span style={{ fontFamily: "monospace", color: "var(--ink-70)" }}>@Contxtbot</span> on Telegram; It will reply with your ID.
                </p>

                {error && (
                  <div style={{
                    marginBottom: "1.25rem", borderRadius: 10,
                    border: "1px solid rgba(220,38,38,0.2)", background: "rgba(220,38,38,0.05)",
                    padding: "0.75rem 0.875rem", fontSize: 13,
                    color: "rgb(185,28,28)", fontFamily: "var(--font-dm-sans)",
                  }}>
                    {error}
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div>
                    <FieldLabel>Telegram user ID</FieldLabel>
                    <LightInput
                      mono
                      placeholder="123456789"
                      value={form.adminTelegramId}
                      onChange={e => set("adminTelegramId", e.target.value.replace(/\D/g, ""))}
                      autoFocus
                    />
                    <p style={{ fontSize: 12, color: "var(--ink-30)", marginTop: "0.375rem", fontFamily: "var(--font-dm-sans)" }}>
                      Numeric ID — not your @username.
                    </p>
                  </div>
                  <div>
                    <FieldLabel>
                      Display name{" "}
                      <span style={{ fontWeight: 400, color: "var(--ink-30)" }}>(optional)</span>
                    </FieldLabel>
                    <LightInput
                      placeholder="Alex Chen"
                      value={form.adminDisplayName}
                      onChange={e => set("adminDisplayName", e.target.value)}
                    />
                  </div>
                </div>

                {/* Summary card */}
                <div style={{
                  marginTop: "1.375rem", borderRadius: 12,
                  border: "1px solid var(--rule)", background: "var(--surface)",
                  padding: "0.875rem 1rem",
                }}>
                  <p style={{
                    fontSize: 11, fontFamily: "var(--font-dm-sans)", fontWeight: 500,
                    color: "var(--ink-30)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em",
                  }}>
                    Creating
                  </p>
                  <p style={{ fontSize: 13.5, fontFamily: "var(--font-dm-sans)", fontWeight: 500, color: "var(--ink)" }}>{form.name}</p>
                  <p style={{
                    fontSize: 12, color: "var(--ink-30)", marginTop: 3,
                    fontFamily: "monospace",
                  }}>
                    contxt.app/<span style={{ color: "var(--ink-50)" }}>{form.slug}</span>
                  </p>
                </div>

                <SubmitPill disabled={!form.adminTelegramId.trim() || loading} onClick={handleSubmit}>
                  {loading
                    ? <><Spinner size={14} /><span>Creating…</span></>
                    : <><span>Create organisation</span><ArrowRight style={{ width: 15, height: 15 }} /></>
                  }
                </SubmitPill>
              </div>
            )}

            {/* ── Step 3: Done ── */}
            {step === "done" && adminToken && (
              <div>
                {/* Success mark */}
                <div style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  height: 52, width: 52, borderRadius: 14,
                  background: "var(--ink)", marginBottom: "1.5rem",
                }}>
                  <Check style={{ width: 20, height: 20, color: "#F8F7F2" }} />
                </div>

                <h1 style={{
                  fontFamily: "var(--font-dm-sans)", fontWeight: 800,
                  fontSize: "2rem", letterSpacing: "-0.025em",
                  color: "var(--ink)", marginBottom: "0.5rem", lineHeight: 1.1,
                }}>
                  {form.name} is live
                </h1>
                <p style={{
                  fontSize: 14, color: "var(--ink-50)", fontFamily: "var(--font-dm-sans)",
                  marginBottom: "2rem", lineHeight: 1.65,
                }}>
                  Save your admin token — you&apos;ll need it to sign in to the dashboard.
                </p>

                {/* Token */}
                <div style={{
                  borderRadius: 12, border: "1px solid var(--rule)",
                  background: "var(--surface)", padding: "1rem 1.125rem", marginBottom: "0.75rem",
                }}>
                  <p style={{
                    fontSize: 11, fontFamily: "var(--font-dm-sans)", fontWeight: 500,
                    color: "var(--ink-30)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em",
                  }}>
                    Admin token
                  </p>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <code style={{
                      flex: 1, fontSize: 12.5, fontFamily: "monospace",
                      color: "var(--ink-70)", lineHeight: 1.65, wordBreak: "break-all",
                    }}>
                      {adminToken}
                    </code>
                    <button
                      onClick={() => handleCopy(adminToken)}
                      style={{
                        flexShrink: 0, height: 28, width: 28, borderRadius: 8,
                        border: "1px solid var(--rule)", background: "var(--paper)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", transition: "background 0.15s",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = "var(--surface)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "var(--paper)"; }}
                    >
                      {copied
                        ? <Check style={{ width: 12, height: 12, color: "#16a34a" }} />
                        : <Copy style={{ width: 12, height: 12, color: "var(--ink-30)" }} />
                      }
                    </button>
                  </div>
                </div>

                {/* Warning */}
                <div style={{
                  borderRadius: 10, border: "1px solid rgba(202,138,4,0.25)",
                  background: "rgba(202,138,4,0.05)", padding: "0.75rem 0.875rem",
                  fontSize: 13, color: "rgb(161,98,7)", marginBottom: "1.5rem",
                  fontFamily: "var(--font-dm-sans)", lineHeight: 1.55,
                }}>
                  Store this somewhere safe. You will not see it again.
                </div>

                <SubmitPill onClick={() => router.push(`/dashboard/${orgSlug}`)}>
                  Open dashboard <ArrowRight style={{ width: 15, height: 15 }} />
                </SubmitPill>
              </div>
            )}

          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: "2.5rem" }}>
          <Link href="/" style={{
            fontSize: 12, color: "var(--ink-15)", textDecoration: "none",
            fontFamily: "var(--font-dm-sans)", transition: "color 0.18s",
          }}>
            ← Back to contxt.app
          </Link>
        </div>
      </div>
    </div>
  );
}
