"use client";

import { use } from "react";
import { DashboardProvider } from "@/lib/dashboard-context";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";

export default function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  return (
    <DashboardProvider slug={slug}>
      <div style={{ minHeight: "100vh", display: "flex", background: "var(--paper)", color: "var(--ink)" }}>
        <Sidebar slug={slug} />
        <main style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh", overflow: "auto" }}>
          <Topbar slug={slug} />
          <div style={{ flex: 1, padding: "2rem 2.5rem" }}>
            {children}
          </div>
        </main>
      </div>
    </DashboardProvider>
  );
}
