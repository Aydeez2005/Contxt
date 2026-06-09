"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Spinner } from "@/components/kibo-ui/spinner";
import { api } from "@/lib/api";
import { ArrowRight } from "lucide-react";
import { AuthPanel } from "@/components/auth-panel";

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

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ slug: "", token: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setLoading(true);
    try {
      await api.login(form.slug, form.token);
      router.push(`/dashboard/${form.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid workspace ID or token.");
    } finally { setLoading(false); }
  }

  const canSubmit = !loading && !!form.slug.trim() && !!form.token.trim();

  return (
    <div style={{
      minHeight: "100vh", background: "var(--paper)",
      padding: "1.5rem", display: "flex", gap: "2.5rem",
    }}>
      {/* ── Left: dark visual panel ── */}
      <AuthPanel variant="login" />

      {/* ── Right: form ── */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        minHeight: "calc(100vh - 3rem)", padding: "0.75rem 1.5rem",
      }}>
        {/* Top: back link */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "3rem" }}>
          <Link href="/register" style={{
            fontSize: 13, color: "var(--ink-50)", textDecoration: "none",
            fontFamily: "var(--font-dm-sans)", transition: "color 0.18s",
          }}>
            Don't have an account?{" "}
            <span style={{ color: "var(--ink)", textDecoration: "underline", textUnderlineOffset: 3, fontWeight: 500 }}>
              Register
            </span>
          </Link>
        </div>

        {/* Center: form */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: "100%", maxWidth: 400 }}>

            <h1 style={{
              fontFamily: "var(--font-dm-sans)", fontWeight: 800,
              fontSize: "2rem", letterSpacing: "-0.025em",
              color: "var(--ink)", marginBottom: "0.5rem", lineHeight: 1.1,
            }}>
              Sign in
            </h1>
            <p style={{
              fontSize: 14, color: "var(--ink-50)",
              fontFamily: "var(--font-dm-sans)", marginBottom: "2.25rem", lineHeight: 1.65,
            }}>
              Enter your workspace ID and admin token to access the dashboard.
            </p>

            {error && (
              <div style={{
                marginBottom: "1.25rem", borderRadius: 10,
                border: "1px solid rgba(220,38,38,0.2)", background: "rgba(220,38,38,0.05)",
                padding: "0.75rem 0.875rem", fontSize: 13,
                color: "rgb(185,28,28)", fontFamily: "var(--font-dm-sans)", lineHeight: 1.5,
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div>
                <label style={{
                  display: "block", fontSize: 13, fontFamily: "var(--font-dm-sans)",
                  fontWeight: 500, color: "var(--ink-70)", marginBottom: "0.4375rem",
                }}>
                  Workspace ID
                </label>
                <LightInput
                  mono
                  placeholder="acme-corp"
                  value={form.slug}
                  onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s/g, "-") }))}
                  autoFocus
                  required
                />
              </div>

              <div>
                <label style={{
                  display: "block", fontSize: 13, fontFamily: "var(--font-dm-sans)",
                  fontWeight: 500, color: "var(--ink-70)", marginBottom: "0.4375rem",
                }}>
                  Admin token
                </label>
                <LightInput
                  mono
                  type="password"
                  placeholder="act_••••••••••••••••"
                  value={form.token}
                  onChange={e => setForm(f => ({ ...f, token: e.target.value }))}
                  required
                />
                <p style={{
                  fontSize: 12, color: "var(--ink-30)", marginTop: "0.375rem",
                  fontFamily: "var(--font-dm-sans)",
                }}>
                  Shown once at registration.
                </p>
              </div>

              <button
                type="submit"
                disabled={!canSubmit}
                className="cta-primary"
                style={{
                  width: "100%", justifyContent: "center",
                  marginTop: "0.375rem",
                  opacity: canSubmit ? 1 : 0.42,
                  cursor: canSubmit ? "pointer" : "not-allowed",
                  fontSize: "0.9375rem", padding: "0.8125rem 1.5rem",
                }}
              >
                {loading
                  ? <><Spinner size={14} /><span>Signing in…</span></>
                  : <><span>Sign in</span><ArrowRight style={{ width: 15, height: 15 }} /></>
                }
              </button>
            </form>

            <p style={{
              textAlign: "center", fontSize: 12.5,
              color: "var(--ink-30)", marginTop: "1.625rem",
              fontFamily: "var(--font-dm-sans)",
            }}>
              Don&apos;t have an account?{" "}
              <Link href="/register" style={{
                color: "var(--ink-70)", textDecoration: "underline",
                textUnderlineOffset: 3, fontWeight: 500,
              }}>
                Register your company
              </Link>
            </p>
          </div>
        </div>

        {/* Bottom: home link */}
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
