"use client";

import { use, useEffect, useState, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  MarkerType,
  type Node,
  type Edge,
  type NodeTypes,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useDashboard } from "@/lib/dashboard-context";
import { api, type MemberSnapshot, type Member, type Integration } from "@/lib/api";
import { Spinner } from "@/components/kibo-ui/spinner";
import { MOCK_SNAPSHOTS, MOCK_MEMBERS, MOCK_INTEGRATIONS } from "@/data/mock";

// ── Colours ───────────────────────────────────────────────────────────────────

const MEMBER_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f59e0b",
  "#10b981", "#3b82f6", "#ef4444", "#14b8a6",
  "#f97316", "#84cc16", "#06b6d4", "#a855f7",
];

const TOOL_COLORS: Record<string, string> = {
  jira: "#0052CC", linear: "#5E6AD2", slack: "#611F69",
  notion: "#191919", github: "#1F6FEB", gcal: "#1A73E8",
};

const TOOL_LABELS: Record<string, string> = {
  gcal: "Calendar",
};

// ── Invisible handle style (for edge routing only) ────────────────────────────

const HH: React.CSSProperties = {
  width: 1, height: 1, minWidth: 1, minHeight: 1,
  border: "none", background: "transparent", opacity: 0, pointerEvents: "none",
};

function Handles() {
  return (
    <>
      <Handle type="source" position={Position.Top}    id="st" style={HH} />
      <Handle type="source" position={Position.Bottom} id="sb" style={HH} />
      <Handle type="source" position={Position.Left}   id="sl" style={HH} />
      <Handle type="source" position={Position.Right}  id="sr" style={HH} />
      <Handle type="target" position={Position.Top}    id="tt" style={HH} />
      <Handle type="target" position={Position.Bottom} id="tb" style={HH} />
      <Handle type="target" position={Position.Left}   id="tl" style={HH} />
      <Handle type="target" position={Position.Right}  id="tr" style={HH} />
    </>
  );
}

// ── Member node ───────────────────────────────────────────────────────────────

type MemberNodeData = {
  name: string;
  color: string;
  taskCount: number;
  hasBlocker: boolean;
  calStatus: string;
};

function MemberNode({ data }: NodeProps) {
  const d = data as MemberNodeData;
  const initials = d.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w: string) => w[0]?.toUpperCase() ?? "")
    .join("");
  const first = d.name.split(" ")[0] ?? d.name;
  const busy = d.calStatus === "busy" || d.calStatus === "in_meeting";

  return (
    <>
      <Handles />
      <div
        style={{
          background: "#ffffff",
          border: `1.5px solid ${d.color}`,
          borderRadius: 20,
          padding: "4px 10px 4px 5px",
          display: "flex",
          alignItems: "center",
          gap: 6,
          boxShadow: `0 1px 8px ${d.color}1a, 0 0 0 3px ${d.color}0d`,
          userSelect: "none",
          cursor: "default",
          position: "relative",
          fontFamily: "var(--font-dm-sans, system-ui, sans-serif)",
        }}
      >
        {/* blocker indicator */}
        {d.hasBlocker && (
          <div
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              width: 9,
              height: 9,
              borderRadius: "50%",
              background: "#ef4444",
              border: "2px solid #fff",
            }}
          />
        )}
        {/* avatar */}
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: d.color,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 7.5,
            fontWeight: 700,
            flexShrink: 0,
            letterSpacing: "0.03em",
            position: "relative",
          }}
        >
          {initials}
          {/* busy dot */}
          {busy && (
            <div
              style={{
                position: "absolute",
                bottom: -1,
                right: -1,
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#f59e0b",
                border: "1.5px solid #fff",
              }}
            />
          )}
        </div>
        {/* name */}
        <span style={{ color: "#1a1a1a", fontWeight: 500, fontSize: 10.5, whiteSpace: "nowrap" }}>
          {first}
        </span>
        {/* task count badge */}
        {d.taskCount > 0 && (
          <span
            style={{
              background: d.color,
              color: "#fff",
              borderRadius: 10,
              padding: "0 5px",
              fontSize: 8.5,
              fontWeight: 700,
              lineHeight: "15px",
            }}
          >
            {d.taskCount}
          </span>
        )}
      </div>
    </>
  );
}

// ── Tool node ─────────────────────────────────────────────────────────────────

type ToolNodeData = { name: string; color: string; memberCount: number };

function ToolNode({ data }: NodeProps) {
  const d = data as ToolNodeData;
  return (
    <>
      <Handles />
      <div
        style={{
          background: d.color,
          borderRadius: 11,
          padding: "5px 13px",
          color: "#fff",
          fontSize: 10.5,
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: 6,
          boxShadow: `0 4px 14px ${d.color}55, 0 1px 3px ${d.color}33`,
          userSelect: "none",
          cursor: "default",
          fontFamily: "var(--font-dm-sans, system-ui, sans-serif)",
          whiteSpace: "nowrap",
          letterSpacing: "0.01em",
        }}
      >
        <span>{d.name}</span>
        {d.memberCount > 0 && (
          <span
            style={{
              background: "rgba(255,255,255,0.22)",
              borderRadius: 8,
              padding: "0 5px",
              fontSize: 8.5,
              fontWeight: 700,
              lineHeight: "15px",
            }}
          >
            {d.memberCount}
          </span>
        )}
      </div>
    </>
  );
}

// ── Task node ─────────────────────────────────────────────────────────────────

type TaskNodeData = { label: string; color: string; status: string };

function TaskNode({ data }: NodeProps) {
  const d = data as TaskNodeData;
  const done = d.status === "done" || d.status === "Done" || d.status === "completed";
  return (
    <>
      <Handles />
      <div
        style={{
          background: `${d.color}0d`,
          border: `1px solid ${d.color}30`,
          borderRadius: 6,
          padding: "2px 8px",
          fontSize: 9,
          color: done ? "#aaa" : "#555",
          fontFamily: "var(--font-dm-sans, system-ui, sans-serif)",
          maxWidth: 140,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          userSelect: "none",
          cursor: "default",
          textDecoration: done ? "line-through" : "none",
          opacity: done ? 0.6 : 1,
        }}
      >
        {d.label}
      </div>
    </>
  );
}

// ── Node type registry — must be stable (module-level) ───────────────────────

const NODE_TYPES: NodeTypes = {
  member: MemberNode,
  tool: ToolNode,
  task: TaskNode,
};

// ── Layout helpers ────────────────────────────────────────────────────────────

function ringPositions(cx: number, cy: number, r: number, n: number, offset = -Math.PI / 2) {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * 2 * Math.PI + offset;
    return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
  });
}

// Deterministic jitter — no Math.random so layout is stable across renders
function djitter(seed: number, range: number) {
  const v = Math.sin(seed * 9301 + 49297) * 43758.5453;
  return (v - Math.floor(v) - 0.5) * range * 2;
}

// ── Graph builder ─────────────────────────────────────────────────────────────

function buildGraph(
  members: Member[],
  snapshots: MemberSnapshot[],
  integrations: Integration[]
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const active = members.filter((m) => m.isActive);
  const snapMap = new Map(snapshots.map((s) => [s.memberId, s]));

  // Collect tools in use
  const toolSet = new Set<string>();
  for (const s of snapshots) for (const t of s.activeTasks ?? []) toolSet.add(t.tool);
  for (const i of integrations) toolSet.add(i.service);
  const tools = [...toolSet];

  const CX = 560, CY = 360;
  const TOOL_R = 285;

  // Per-tool member count (for badge)
  const toolMemberCount: Record<string, number> = {};
  for (const s of snapshots) {
    const seen = new Set<string>();
    for (const t of s.activeTasks ?? []) {
      if (!seen.has(t.tool)) {
        toolMemberCount[t.tool] = (toolMemberCount[t.tool] ?? 0) + 1;
        seen.add(t.tool);
      }
    }
  }

  // Tool positions: outer ring with slight radial jitter so it's not a perfect circle
  const toolBaseRing = ringPositions(CX, CY, TOOL_R, tools.length);
  const toolPos = toolBaseRing.map((p, i) => {
    const jitter = djitter(i * 7 + 3, 28);
    const dx = p.x - CX, dy = p.y - CY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const nd = dist + jitter;
    return { x: CX + (dx / dist) * nd, y: CY + (dy / dist) * nd };
  });

  // ── Tool nodes (tool badge: ~96×27px → offset -48, -13)
  tools.forEach((tool, i) => {
    const color = TOOL_COLORS[tool] ?? "#888";
    const pos = toolPos[i];
    const label = TOOL_LABELS[tool] ?? (tool.charAt(0).toUpperCase() + tool.slice(1));
    nodes.push({
      id: `tool-${tool}`,
      type: "tool",
      position: { x: pos.x - 48, y: pos.y - 13 },
      data: { name: label, color, memberCount: toolMemberCount[tool] ?? 0 },
      draggable: true,
    });
  });

  // ── Member nodes
  // Members with tasks: pull toward weighted centroid of their tools
  // Members without tasks: small inner ring
  const idleMembers = active.filter(
    (m) => (snapMap.get(m.id)?.activeTasks?.length ?? 0) === 0
  );
  const idleRing = ringPositions(CX, CY, 65, Math.max(idleMembers.length, 1));
  let idleIdx = 0;

  active.forEach((member, mi) => {
    const color = MEMBER_COLORS[mi % MEMBER_COLORS.length];
    const snap = snapMap.get(member.id);
    const tasks = snap?.activeTasks ?? [];
    const hasBlocker = (snap?.blockers?.length ?? 0) > 0;
    const calStatus = snap?.calendarStatus ?? "available";
    const mId = `member-${member.id}`;

    let mPos: { x: number; y: number };

    const usedTools = [...new Set(tasks.map((t) => t.tool).filter((t) => tools.includes(t)))];

    if (usedTools.length > 0) {
      // Centroid of used tool positions
      const pts = usedTools.map((t) => toolPos[tools.indexOf(t)]);
      const cx2 = pts.reduce((s, p) => s + p.x, 0) / pts.length;
      const cy2 = pts.reduce((s, p) => s + p.y, 0) / pts.length;

      // Pull toward center at ~35-40% of the way from center to tool centroid
      const dx = cx2 - CX, dy = cy2 - CY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      // Add angular jitter per member to avoid stacking
      const angleJitter = djitter(mi * 19 + 11, 0.28);
      const targetDist = 110 + djitter(mi * 7 + 5, 32);

      mPos = {
        x: CX + Math.cos(angle + angleJitter) * Math.max(55, targetDist),
        y: CY + Math.sin(angle + angleJitter) * Math.max(55, targetDist),
      };
    } else {
      mPos = idleRing[idleIdx++ % idleRing.length];
    }

    // member card: ~130×28px → offset -65, -14
    nodes.push({
      id: mId,
      type: "member",
      position: { x: mPos.x - 65, y: mPos.y - 14 },
      data: { name: member.displayName ?? member.telegramUsername ?? "?", color, taskCount: tasks.length, hasBlocker, calStatus },
      draggable: true,
    });

    if (!snap) return;

    // ── Task nodes: scattered between member and tool
    tasks.forEach((task, ti) => {
      const toolIdx = tools.indexOf(task.tool);
      if (toolIdx === -1) return;
      const tPos = toolPos[toolIdx];
      const toolColor = TOOL_COLORS[task.tool] ?? "#888";

      const t = 0.36 + (ti % 3) * 0.11;
      const perp = Math.atan2(tPos.y - mPos.y, tPos.x - mPos.x) + Math.PI / 2;
      const jitter = djitter(mi * 100 + ti * 17 + 3, 20);
      const tx = mPos.x + (tPos.x - mPos.x) * t + Math.cos(perp) * jitter;
      const ty = mPos.y + (tPos.y - mPos.y) * t + Math.sin(perp) * jitter;

      const taskNodeId = `task-${member.id}-${task.id}`;
      // task pill: ~120×16px → offset -60, -8
      nodes.push({
        id: taskNodeId,
        type: "task",
        position: { x: tx - 60, y: ty - 8 },
        data: { label: task.title, color: toolColor, status: task.status },
        draggable: true,
      });

      edges.push({
        id: `em-${mId}-${taskNodeId}`,
        source: mId,
        target: taskNodeId,
        type: "smoothstep",
        style: { stroke: color, strokeWidth: 1.2, opacity: 0.3 },
      });
      edges.push({
        id: `et-${taskNodeId}-${task.tool}`,
        source: taskNodeId,
        target: `tool-${task.tool}`,
        type: "smoothstep",
        style: { stroke: toolColor, strokeWidth: 1.2, opacity: 0.28 },
      });
    });

    // ── Blocker edges: member → member (red dashed with label)
    for (const blocker of snap.blockers ?? []) {
      const desc = blocker.description.toLowerCase();
      active.forEach((other) => {
        if (other.id === member.id) return;
        const firstName = (other.displayName ?? "").toLowerCase().split(" ")[0];
        if (firstName && desc.includes(firstName)) {
          edges.push({
            id: `blocker-${member.id}-${other.id}`,
            source: mId,
            target: `member-${other.id}`,
            type: "smoothstep",
            markerEnd: { type: MarkerType.ArrowClosed, width: 12, height: 12, color: "#ef4444" },
            style: { stroke: "#ef4444", strokeWidth: 1.5, strokeDasharray: "4 3", opacity: 0.7 },
            label: "blocked by",
            labelStyle: {
              fontSize: 8,
              fill: "#ef4444",
              fontFamily: "var(--font-dm-sans, system-ui, sans-serif)",
              fontWeight: 500,
            },
            labelBgStyle: { fill: "#fff", opacity: 0.85 },
            labelBgPadding: [3, 5] as [number, number],
            labelBgBorderRadius: 4,
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
    const hasData = snapshots.some((s) => (s.activeTasks?.length ?? 0) > 0);
    const activeMembers = members.filter((m) => m.isActive);
    const resolvedMembers = activeMembers.length > 0 ? activeMembers : MOCK_MEMBERS;
    const resolvedIntegrations = integrations.length > 0 ? integrations : MOCK_INTEGRATIONS;
    const resolvedSnapshots = hasData
      ? snapshots
      : MOCK_SNAPSHOTS.map((s, i) => ({
          ...s,
          memberId: resolvedMembers[i % resolvedMembers.length]?.id ?? s.memberId,
        }));
    const { nodes: n, edges: e } = buildGraph(resolvedMembers, resolvedSnapshots, resolvedIntegrations);
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
  const busyCount = snapshots.filter((s) => s.calendarStatus === "busy" || s.calendarStatus === "in_meeting").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {/* stats bar */}
      <div
        style={{
          display: "flex",
          gap: 12,
          fontSize: 11.5,
          color: "var(--ink-30)",
          fontFamily: "var(--font-dm-sans)",
          alignItems: "center",
        }}
      >
        <span>{members.filter((m) => m.isActive).length} members</span>
        <span>·</span>
        <span>{taskCount} tasks</span>
        <span>·</span>
        <span>{integrations.length} tools</span>
        {blockerCount > 0 && (
          <>
            <span>·</span>
            <span style={{ color: "#ef4444" }}>{blockerCount} blocker{blockerCount > 1 ? "s" : ""}</span>
          </>
        )}
        {busyCount > 0 && (
          <>
            <span>·</span>
            <span style={{ color: "#f59e0b" }}>{busyCount} in meeting</span>
          </>
        )}
        {/* legend */}
        <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center", opacity: 0.6 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />
            blocker
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#f59e0b", display: "inline-block" }} />
            in meeting
          </span>
        </div>
      </div>

      {/* graph canvas */}
      <div
        style={{
          height: "calc(100vh - 148px)",
          borderRadius: 16,
          overflow: "hidden",
          border: "1px solid var(--rule)",
          background: "#f8f8f6",
        }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={NODE_TYPES}
          fitView
          fitViewOptions={{ padding: 0.12 }}
          proOptions={{ hideAttribution: true }}
          nodesDraggable
          minZoom={0.25}
          maxZoom={3}
          defaultEdgeOptions={{ type: "smoothstep" }}
        >
          <Background color="#e2e1dd" gap={28} size={1} />
          <Controls
            showInteractive={false}
            style={{
              boxShadow: "none",
              border: "1px solid var(--rule)",
              borderRadius: 10,
            }}
          />
        </ReactFlow>
      </div>
    </div>
  );
}
