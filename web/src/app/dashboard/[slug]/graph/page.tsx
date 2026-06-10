"use client";

import { use, useEffect, useState, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  MarkerType,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useDashboard } from "@/lib/dashboard-context";
import { api, type MemberSnapshot, type Member, type Integration } from "@/lib/api";
import { Spinner } from "@/components/kibo-ui/spinner";

// ── Colours ───────────────────────────────────────────────────────────────────

const MEMBER_COLORS = ["#6366f1","#8b5cf6","#ec4899","#f59e0b","#10b981","#3b82f6","#ef4444","#14b8a6"];
const TOOL_COLORS: Record<string, string> = {
  jira: "#0052CC", linear: "#5E6AD2", slack: "#611F69",
  notion: "#191919", github: "#1F6FEB", gcal: "#1A73E8",
};

// ── Node styles ───────────────────────────────────────────────────────────────

function memberStyle(color: string): React.CSSProperties {
  return {
    width: 14, height: 14, borderRadius: "50%",
    background: color, border: `2px solid ${color}`,
    boxShadow: `0 0 0 3px ${color}22`,
  };
}

function toolStyle(color: string): React.CSSProperties {
  return {
    width: 20, height: 20, borderRadius: "50%",
    background: color, border: `2.5px solid ${color}`,
    boxShadow: `0 0 0 4px ${color}33`,
  };
}

function taskStyle(color: string): React.CSSProperties {
  return {
    width: 9, height: 9, borderRadius: "50%",
    background: `${color}99`, border: `1.5px solid ${color}`,
  };
}

// ── Label node ────────────────────────────────────────────────────────────────

function labelStyle(fontSize: number, color: string): React.CSSProperties {
  return {
    fontSize, color, fontFamily: "var(--font-dm-sans)",
    background: "transparent", border: "none", padding: 0,
    pointerEvents: "none", whiteSpace: "nowrap",
  };
}

// ── Layout helpers ────────────────────────────────────────────────────────────

function ring(cx: number, cy: number, r: number, n: number, offset = 0) {
  return Array.from({ length: n }, (_, i) => {
    const angle = (i / n) * 2 * Math.PI + offset;
    return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
  });
}

// ── Graph builder ─────────────────────────────────────────────────────────────

function buildGraph(
  members: Member[],
  snapshots: MemberSnapshot[],
  integrations: Integration[]
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const active = members.filter(m => m.isActive);
  const snapMap = new Map(snapshots.map(s => [s.memberId, s]));

  // Collect which tools actually appear in snapshot data
  const toolsInUse = new Set<string>();
  for (const s of snapshots) {
    for (const t of s.activeTasks ?? []) toolsInUse.add(t.tool);
  }
  // Also include connected integrations
  for (const i of integrations) toolsInUse.add(i.service);
  const tools = [...toolsInUse];

  const CX = 560, CY = 380;
  const TOOL_R = 300;
  const MEMBER_R = 140;

  // Tool positions (outer ring)
  const toolPos = ring(CX, CY, TOOL_R, tools.length, -Math.PI / 2);

  // Member positions (inner ring)
  const memberPos = ring(CX, CY, MEMBER_R, active.length, -Math.PI / 2);

  // ── Tool nodes
  tools.forEach((tool, i) => {
    const color = TOOL_COLORS[tool] ?? "#888";
    const pos = toolPos[i];
    nodes.push({
      id: `tool-${tool}`,
      position: { x: pos.x - 10, y: pos.y - 10 },
      data: { label: "" },
      style: toolStyle(color),
      draggable: true,
    });
    // Label node for tool
    nodes.push({
      id: `tool-${tool}-label`,
      position: { x: pos.x - 30, y: pos.y + 16 },
      data: { label: tool.charAt(0).toUpperCase() + tool.slice(1) },
      style: labelStyle(10, color),
      draggable: false,
      selectable: false,
    });
  });

  // ── Member nodes + task nodes + edges
  active.forEach((member, mi) => {
    const color = MEMBER_COLORS[mi % MEMBER_COLORS.length];
    const mPos = memberPos[mi];
    const mId = `member-${member.id}`;

    nodes.push({
      id: mId,
      position: { x: mPos.x - 7, y: mPos.y - 7 },
      data: { label: "" },
      style: memberStyle(color),
      draggable: true,
    });
    nodes.push({
      id: `${mId}-label`,
      position: { x: mPos.x - 30, y: mPos.y + 12 },
      data: { label: member.displayName ?? member.telegramUsername ?? "?" },
      style: labelStyle(10, "#333"),
      draggable: false,
      selectable: false,
    });

    const snap = snapMap.get(member.id);
    if (!snap) return;

    // Task nodes — scatter them between member and their tool
    const tasks = snap.activeTasks ?? [];
    tasks.forEach((task, ti) => {
      const toolIdx = tools.indexOf(task.tool);
      if (toolIdx === -1) return;
      const tPos = toolPos[toolIdx];

      // Interpolate between member and tool, with a small perpendicular jitter
      const t = 0.35 + (ti % 3) * 0.12;
      const jitter = ((ti % 5) - 2) * 22;
      const angle = Math.atan2(tPos.y - mPos.y, tPos.x - mPos.x) + Math.PI / 2;
      const tx = mPos.x + (tPos.x - mPos.x) * t + Math.cos(angle) * jitter;
      const ty = mPos.y + (tPos.y - mPos.y) * t + Math.sin(angle) * jitter;

      const taskNodeId = `task-${member.id}-${task.id}`;
      const toolColor = TOOL_COLORS[task.tool] ?? "#888";

      nodes.push({
        id: taskNodeId,
        position: { x: tx - 4, y: ty - 4 },
        data: { label: task.title },
        style: taskStyle(toolColor),
        draggable: true,
      });

      // Member → task
      edges.push({
        id: `e-m-${mId}-${taskNodeId}`,
        source: mId,
        target: taskNodeId,
        style: { stroke: color, strokeWidth: 1, opacity: 0.4 },
      });
      // Task → tool
      edges.push({
        id: `e-t-${taskNodeId}-tool-${task.tool}`,
        source: taskNodeId,
        target: `tool-${task.tool}`,
        style: { stroke: toolColor, strokeWidth: 1, opacity: 0.35 },
      });
    });

    // Blocker edges: member → member (red dashed)
    for (const blocker of snap.blockers ?? []) {
      const desc = blocker.description.toLowerCase();
      active.forEach(other => {
        if (other.id === member.id) return;
        const otherName = (other.displayName ?? "").toLowerCase();
        if (otherName && desc.includes(otherName)) {
          edges.push({
            id: `blocker-${member.id}-${other.id}`,
            source: mId,
            target: `member-${other.id}`,
            markerEnd: { type: MarkerType.ArrowClosed, width: 10, height: 10, color: "#ef4444" },
            style: { stroke: "#ef4444", strokeWidth: 1.5, strokeDasharray: "4,3", opacity: 0.7 },
          });
        }
      });
    }
  });

  return { nodes, edges };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function GraphPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { members, integrations, loading } = useDashboard();
  const [snapshots, setSnapshots] = useState<MemberSnapshot[]>([]);
  const [snapsLoading, setSnapsLoading] = useState(true);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const loadSnapshots = useCallback(async () => {
    setSnapsLoading(true);
    try { setSnapshots(await api.getSnapshots(slug)); }
    catch { setSnapshots([]); }
    finally { setSnapsLoading(false); }
  }, [slug]);

  useEffect(() => { loadSnapshots(); }, [loadSnapshots]);

  useEffect(() => {
    if (loading || snapsLoading) return;
    const { nodes: n, edges: e } = buildGraph(members, snapshots, integrations);
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

  const taskCount = snapshots.reduce((s, sn) => s + (sn.activeTasks?.length ?? 0), 0);
  const blockerCount = snapshots.reduce((s, sn) => s + (sn.blockers?.length ?? 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div style={{ display: "flex", gap: 12, fontSize: 11.5, color: "var(--ink-30)", fontFamily: "var(--font-dm-sans)" }}>
        <span>{members.filter(m => m.isActive).length} members</span>
        <span>·</span>
        <span>{taskCount} tasks</span>
        <span>·</span>
        <span>{integrations.length} tools</span>
        {blockerCount > 0 && <><span>·</span><span style={{ color: "#ef4444" }}>{blockerCount} blockers</span></>}
      </div>
      <div style={{ height: "calc(100vh - 148px)", borderRadius: 16, overflow: "hidden", border: "1px solid var(--rule)", background: "#fafaf9" }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          proOptions={{ hideAttribution: true }}
          nodesDraggable
          minZoom={0.3}
          maxZoom={3}
        >
          <Background color="#e5e4e0" gap={24} size={1} />
          <Controls showInteractive={false} style={{ boxShadow: "none", border: "1px solid var(--rule)", borderRadius: 10 }} />
        </ReactFlow>
      </div>
    </div>
  );
}
