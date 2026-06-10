"use client";

import { use, useEffect, useState, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useDashboard } from "@/lib/dashboard-context";
import { api, type MemberSnapshot } from "@/lib/api";
import { Spinner } from "@/components/kibo-ui/spinner";
import { FACE_COLORS } from "@/utils/dashboard";

const TOOL_COLORS: Record<string, string> = {
  jira: "#0052CC",
  linear: "#5E6AD2",
  slack: "#611F69",
  notion: "#191919",
  github: "#1F6FEB",
  gcal: "#1A73E8",
};

function buildGraph(
  members: { id: string; displayName: string | null; telegramUsername: string | null }[],
  snapshots: MemberSnapshot[],
  integrations: { service: string }[]
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const snapshotMap = new Map(snapshots.map((s) => [s.memberId, s]));
  const connectedTools = integrations.map((i) => i.service);

  // Tool nodes (one per connected integration)
  connectedTools.forEach((tool, i) => {
    const angle = (i / connectedTools.length) * 2 * Math.PI;
    const radius = 280;
    nodes.push({
      id: `tool-${tool}`,
      type: "default",
      position: {
        x: 480 + Math.cos(angle) * radius,
        y: 300 + Math.sin(angle) * radius,
      },
      data: { label: tool.charAt(0).toUpperCase() + tool.slice(1) },
      style: {
        background: TOOL_COLORS[tool] ?? "#666",
        color: "white",
        border: "none",
        borderRadius: 12,
        fontSize: 12,
        fontWeight: 600,
        padding: "6px 14px",
        fontFamily: "var(--font-dm-sans)",
      },
    });
  });

  // Member nodes arranged in a column
  members.forEach((member, i) => {
    const color = FACE_COLORS[i % FACE_COLORS.length];
    const snapshot = snapshotMap.get(member.id);
    const name = member.displayName ?? member.telegramUsername ?? `#${member.id.slice(0, 6)}`;

    const taskCount = snapshot?.activeTasks?.length ?? 0;
    const blockerCount = snapshot?.blockers?.length ?? 0;
    const calStatus = snapshot?.calendarStatus ?? null;

    const labelLines = [
      name,
      taskCount > 0 ? `${taskCount} task${taskCount > 1 ? "s" : ""}` : null,
      blockerCount > 0 ? `⚠ ${blockerCount} blocker${blockerCount > 1 ? "s" : ""}` : null,
      calStatus === "in_meeting" ? "📅 In meeting" : null,
    ]
      .filter(Boolean)
      .join("\n");

    nodes.push({
      id: `member-${member.id}`,
      type: "default",
      position: { x: 100, y: 60 + i * 120 },
      data: { label: labelLines },
      style: {
        background: `${color}14`,
        border: `2px solid ${color}40`,
        borderRadius: 14,
        fontSize: 12,
        color: "var(--ink)",
        fontFamily: "var(--font-dm-sans)",
        padding: "8px 14px",
        whiteSpace: "pre",
        lineHeight: 1.6,
      },
    });

    // Edge: member → tool (for each tool they have an active task in)
    const usedTools = new Set(
      (snapshot?.activeTasks ?? []).map((t) => t.tool).filter((t) => connectedTools.includes(t))
    );

    for (const tool of usedTools) {
      edges.push({
        id: `${member.id}-${tool}`,
        source: `member-${member.id}`,
        target: `tool-${tool}`,
        markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14 },
        style: { stroke: TOOL_COLORS[tool] ?? "#aaa", strokeWidth: 1.5, opacity: 0.7 },
      });
    }

    // Edge: member → member (blockers referencing another member by name)
    for (const blocker of snapshot?.blockers ?? []) {
      const desc = blocker.description.toLowerCase();
      members.forEach((other) => {
        if (other.id === member.id) return;
        const otherName = (other.displayName ?? other.telegramUsername ?? "").toLowerCase();
        if (otherName && desc.includes(otherName)) {
          edges.push({
            id: `blocker-${member.id}-${other.id}`,
            source: `member-${member.id}`,
            target: `member-${other.id}`,
            label: "blocked by",
            markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14 },
            style: { stroke: "#ef4444", strokeWidth: 1.5, strokeDasharray: "5,4" },
            labelStyle: { fontSize: 10, fill: "#ef4444" },
          });
        }
      });
    }
  });

  return { nodes, edges };
}

export default function GraphPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { members, integrations, loading } = useDashboard();
  const [snapshots, setSnapshots] = useState<MemberSnapshot[]>([]);
  const [snapsLoading, setSnapsLoading] = useState(true);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const loadSnapshots = useCallback(async () => {
    setSnapsLoading(true);
    try {
      const data = await api.getSnapshots(slug);
      setSnapshots(data);
    } catch {
      setSnapshots([]);
    } finally {
      setSnapsLoading(false);
    }
  }, [slug]);

  useEffect(() => { loadSnapshots(); }, [loadSnapshots]);

  useEffect(() => {
    if (loading || snapsLoading) return;
    const activeMembers = members.filter((m) => m.isActive);
    const { nodes: n, edges: e } = buildGraph(activeMembers, snapshots, integrations);
    setNodes(n);
    setEdges(e);
  }, [loading, snapsLoading, members, snapshots, integrations, setNodes, setEdges]);

  if (loading || snapsLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <Spinner size={22} />
      </div>
    );
  }

  return (
    <div style={{ height: "calc(100vh - 120px)", borderRadius: 16, overflow: "hidden", border: "1px solid var(--rule)" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="var(--rule)" gap={20} />
        <Controls showInteractive={false} />
        <MiniMap nodeColor={() => "#e2e2e2"} maskColor="rgba(255,255,255,0.6)" />
      </ReactFlow>
    </div>
  );
}
