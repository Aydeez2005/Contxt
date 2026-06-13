"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MessageSquare, ExternalLink, LogOut } from "lucide-react";
import { useDashboard } from "@/lib/dashboard-context";
import { NAV_ITEMS, navHref } from "@/constants/nav";
import { api } from "@/lib/api";

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
      width: 220, flexShrink: 0,
      borderRight: "1px solid #1e1e1e",
      display: "flex", flexDirection: "column",
      height: "100vh", position: "sticky", top: 0,
      background: "#111111",
    }}>

      {/* Wordmark */}
      <div style={{ height: 56, display: "flex", alignItems: "center", padding: "0 1.25rem", borderBottom: "1px solid #1e1e1e" }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <span style={{ fontFamily: "var(--font-syne)", fontWeight: 800, letterSpacing: "-0.025em", fontSize: "1rem", color: "#ffffff" }}>
            contxt
          </span>
        </Link>
      </div>

      {/* Org card */}
      <div style={{ padding: "0.75rem", borderBottom: "1px solid #1e1e1e" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          borderRadius: 10, border: "1px solid #222222",
          background: "#1a1a1a", padding: "0.5rem 0.75rem",
        }}>
          <div style={{
            height: 28, width: 28, borderRadius: 7, flexShrink: 0,
            background: "#ffffff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, fontWeight: 800, color: "#111111",
            fontFamily: "var(--font-syne)",
          }}>
            {initials}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 12.5, fontFamily: "var(--font-dm-sans)", fontWeight: 600, color: "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {org?.name ?? slug}
            </p>
            <p style={{ fontSize: 10, fontFamily: "monospace", color: "#555555", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1 }}>
              {slug}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "0.75rem 0.5rem", display: "flex", flexDirection: "column", gap: 1 }}>
        <p style={{ fontSize: 9, fontFamily: "var(--font-dm-sans)", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "#333333", padding: "0 10px", marginBottom: 6 }}>
          Workspace
        </p>
        {NAV_ITEMS.map(({ id, label, path, Icon }) => {
          const href = navHref(slug, path);
          const active = pathname === href;
          const showAlert =
            (id === "bot" && !org?.telegramBotUsername) ||
            (id === "integrations" && integrations.length === 0);

          return (
            <Link
              key={id}
              href={href}
              style={{
                display: "flex", alignItems: "center", gap: 9,
                padding: "0.45rem 0.625rem", borderRadius: 8,
                fontSize: 13, fontFamily: "var(--font-dm-sans)", fontWeight: 500,
                textDecoration: "none",
                background: active ? "#ffffff" : "transparent",
                color: active ? "#111111" : "#888888",
                transition: "background 0.12s, color 0.12s",
              }}
              onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = "#1a1a1a"; (e.currentTarget as HTMLElement).style.color = "#ffffff"; } }}
              onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#888888"; } }}
            >
              <Icon style={{ width: 14, height: 14, flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{label}</span>
              {showAlert && (
                <span style={{ height: 5, width: 5, borderRadius: "50%", background: active ? "#555" : "#444", flexShrink: 0 }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ padding: "0.5rem 0.5rem 0.875rem", borderTop: "1px solid #1e1e1e", display: "flex", flexDirection: "column", gap: 1 }}>
        {org?.telegramBotUsername && (
          <a
            href={`https://t.me/${org.telegramBotUsername}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "0.45rem 0.625rem", borderRadius: 8, fontSize: 12, color: "#555555", textDecoration: "none", transition: "all 0.12s", fontFamily: "var(--font-dm-sans)" }}
            onMouseEnter={e => { e.currentTarget.style.color = "#ffffff"; e.currentTarget.style.background = "#1a1a1a"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "#555555"; e.currentTarget.style.background = "transparent"; }}
          >
            <MessageSquare style={{ width: 13, height: 13 }} />
            @{org.telegramBotUsername}
            <ExternalLink style={{ width: 11, height: 11, marginLeft: "auto" }} />
          </a>
        )}
        <button
          onClick={handleLogout}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "0.45rem 0.625rem", borderRadius: 8, fontSize: 12, color: "#555555", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-dm-sans)", transition: "all 0.12s", textAlign: "left" }}
          onMouseEnter={e => { e.currentTarget.style.color = "#ffffff"; e.currentTarget.style.background = "#1a1a1a"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "#555555"; e.currentTarget.style.background = "transparent"; }}
        >
          <LogOut style={{ width: 13, height: 13 }} /> Sign out
        </button>
      </div>
    </aside>
  );
}
