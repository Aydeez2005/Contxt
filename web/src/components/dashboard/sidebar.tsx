"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MessageSquare, ExternalLink, LogOut } from "lucide-react";
import { useDashboard } from "@/lib/dashboard-context";
import { NAV_ITEMS, navHref } from "@/constants/nav";
import { api } from "@/lib/api";

const SB = "rgba(213,211,202,0.45)";

type SidebarProps = {
  slug: string;
};

export function Sidebar({ slug }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { org, integrations } = useDashboard();

  function handleLogout() {
    api.saveToken(slug, "");
    if (typeof window !== "undefined") {
      localStorage.removeItem(`contxt_token_${slug}`);
    }
    router.push("/login");
  }

  const initials = (org?.name ?? slug)
    .split(" ")
    .map(w => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside style={{
      width: 224, flexShrink: 0,
      borderRight: `1px solid ${SB}`,
      display: "flex", flexDirection: "column",
      height: "100vh", position: "sticky", top: 0,
      background: "white",
    }}>

      {/* Wordmark */}
      <div style={{ height: 56, display: "flex", alignItems: "center", padding: "0 1.25rem", borderBottom: `1px solid ${SB}` }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <span style={{ fontFamily: "var(--font-syne)", fontWeight: 800, letterSpacing: "-0.025em", fontSize: "1rem", color: "var(--ink)" }}>
            contxt
          </span>
        </Link>
      </div>

      {/* Org card */}
      <div style={{ padding: "0.75rem", borderBottom: `1px solid ${SB}` }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          borderRadius: 11, border: `1px solid ${SB}`,
          background: "var(--surface)", padding: "0.5rem 0.75rem",
        }}>
          <div style={{
            height: 30, width: 30, borderRadius: 8, flexShrink: 0,
            background: "var(--ink)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10.5, fontWeight: 800, color: "var(--paper)",
            fontFamily: "var(--font-syne)",
          }}>
            {initials}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 12.5, fontFamily: "var(--font-dm-sans)", fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {org?.name ?? slug}
            </p>
            <p style={{ fontSize: 10, fontFamily: "monospace", color: "var(--ink-15)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1 }}>
              {slug}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "0.75rem 0.5rem", display: "flex", flexDirection: "column", gap: 1 }}>
        <p style={{ fontSize: 9, fontFamily: "var(--font-dm-sans)", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-15)", padding: "0 10px", marginBottom: 6 }}>
          Workspace
        </p>
        {NAV_ITEMS.map(({ id, label, path, Icon }) => {
          const href = navHref(slug, path);
          const active = pathname === href;
          const showAlert =
            (id === "bot" && !org?.telegramBotToken) ||
            (id === "integrations" && integrations.length === 0);

          return (
            <Link
              key={id}
              href={href}
              style={{
                display: "flex", alignItems: "center", gap: 9,
                padding: "0.5rem 0.625rem", borderRadius: 9,
                fontSize: 13.5, fontFamily: "var(--font-dm-sans)", fontWeight: 500,
                textDecoration: "none",
                background: active ? "var(--ink)" : "transparent",
                color: active ? "var(--paper)" : "var(--ink-50)",
                transition: "background 0.15s, color 0.15s",
              }}
              onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = "var(--surface)"; (e.currentTarget as HTMLElement).style.color = "var(--ink)"; } }}
              onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--ink-50)"; } }}
            >
              <Icon style={{ width: 15, height: 15, flexShrink: 0, opacity: active ? 0.85 : 0.5 }} />
              <span style={{ flex: 1 }}>{label}</span>
              {showAlert && (
                <span style={{ height: 6, width: 6, borderRadius: "50%", background: active ? "rgba(248,247,242,0.45)" : "var(--ink-15)", flexShrink: 0 }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ padding: "0.5rem 0.5rem 0.875rem", borderTop: `1px solid ${SB}`, display: "flex", flexDirection: "column", gap: 1 }}>
        {org?.telegramBotUsername && (
          <a
            href={`https://t.me/${org.telegramBotUsername}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "0.5rem 0.625rem", borderRadius: 9, fontSize: 12, color: "var(--ink-30)", textDecoration: "none", transition: "all 0.15s", fontFamily: "var(--font-dm-sans)" }}
            onMouseEnter={e => { e.currentTarget.style.color = "var(--ink)"; e.currentTarget.style.background = "var(--surface)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "var(--ink-30)"; e.currentTarget.style.background = "transparent"; }}
          >
            <MessageSquare style={{ width: 13, height: 13 }} />
            @{org.telegramBotUsername}
            <ExternalLink style={{ width: 11, height: 11, marginLeft: "auto" }} />
          </a>
        )}
        <button
          onClick={handleLogout}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "0.5rem 0.625rem", borderRadius: 9, fontSize: 12, color: "var(--ink-30)", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-dm-sans)", transition: "all 0.15s", textAlign: "left" }}
          onMouseEnter={e => { e.currentTarget.style.color = "var(--ink)"; e.currentTarget.style.background = "var(--surface)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "var(--ink-30)"; e.currentTarget.style.background = "transparent"; }}
        >
          <LogOut style={{ width: 13, height: 13 }} /> Sign out
        </button>
      </div>
    </aside>
  );
}
