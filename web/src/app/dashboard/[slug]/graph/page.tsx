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

// ── Palette ───────────────────────────────────────────────────────────────────

const MEMBER_COLORS = [
  "#6366f1","#8b5cf6","#ec4899","#f59e0b",
  "#10b981","#3b82f6","#ef4444","#14b8a6",
  "#f97316","#84cc16","#06b6d4","#a855f7",
];

const TOOL_COLORS: Record<string, string> = {
  jira: "#0052CC", linear: "#5E6AD2", slack: "#611F69",
  notion: "#191919", github: "#1F6FEB", gcal: "#1A73E8",
};

const TOOL_LABELS: Record<string, string> = { gcal: "Calendar" };

// ── Invisible handles (edge routing only) ─────────────────────────────────────

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
  name: string; color: string; taskCount: number;
  hasBlocker: boolean; calStatus: string;
};

function MemberNode({ data }: NodeProps) {
  const d = data as MemberNodeData;
  const parts = d.name.trim().split(/\s+/);
  const initials = parts.slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("");
  const busy = d.calStatus === "busy" || d.calStatus === "in_meeting";

  return (
    <>
      <Handles />
      <div style={{
        background: "#fff",
        border: `2px solid ${d.color}`,
        borderRadius: 24,
        padding: "5px 12px 5px 6px",
        display: "flex", alignItems: "center", gap: 7,
        boxShadow: `0 2px 12px ${d.color}22, 0 0 0 4px ${d.color}0e`,
        userSelect: "none", cursor: "default", position: "relative",
        fontFamily: "var(--font-dm-sans, system-ui, sans-serif)",
        minWidth: 110,
      }}>
        {/* blocker badge */}
        {d.hasBlocker && (
          <div style={{
            position: "absolute", top: -5, right: -5,
            width: 11, height: 11, borderRadius: "50%",
            background: "#ef4444", border: "2px solid #fff",
          }} />
        )}
        {/* avatar */}
        <div style={{
          width: 26, height: 26, borderRadius: "50%",
          background: d.color, color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 9, fontWeight: 800, flexShrink: 0, letterSpacing: "0.03em",
          position: "relative",
        }}>
          {initials}
          {busy && (
            <div style={{
              position: "absolute", bottom: -1, right: -1,
              width: 7, height: 7, borderRadius: "50%",
              background: "#f59e0b", border: "2px solid #fff",
            }} />
          )}
        </div>
        {/* name — full first + last */}
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
          <span style={{ color: "#111", fontWeight: 600, fontSize: 11, whiteSpace: "nowrap" }}>
            {parts[0]}
          </span>
          {parts[1] && (
            <span style={{ color: "#555", fontWeight: 400, fontSize: 9.5, whiteSpace: "nowrap" }}>
              {parts[1]}
            </span>
          )}
        </div>
        {/* task count */}
        {d.taskCount > 0 && (
          <span style={{
            background: d.color, color: "#fff",
            borderRadius: 10, padding: "1px 6px",
            fontSize: 9, fontWeight: 700, marginLeft: 2,
          }}>
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
      <div style={{
        background: d.color,
        borderRadius: 12,
        padding: "6px 14px",
        color: "#fff", fontSize: 11, fontWeight: 700,
        display: "flex", alignItems: "center", gap: 6,
        boxShadow: `0 4px 16px ${d.color}55`,
        userSelect: "none", cursor: "default",
        fontFamily: "var(--font-dm-sans, system-ui, sans-serif)",
        whiteSpace: "nowrap", letterSpacing: "0.01em",
      }}>
        {d.name}
        {d.memberCount > 0 && (
          <span style={{
            background: "rgba(255,255,255,0.25)", borderRadius: 8,
            padding: "0 5px", fontSize: 9, fontWeight: 700, lineHeight: "15px",
          }}>
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
  const done = /done|completed/i.test(d.status);
  return (
    <>
      <Handles />
      <div style={{
        background: `${d.color}12`,
        border: `1px solid ${d.color}40`,
        borderRadius: 6, padding: "2px 8px",
        fontSize: 9, color: done ? "#aaa" : "#444",
        fontFamily: "var(--font-dm-sans, system-ui, sans-serif)",
        maxWidth: 150, overflow: "hidden",
        textOverflow: "ellipsis", whiteSpace: "nowrap",
        userSelect: "none", cursor: "default",
        textDecoration: done ? "line-through" : "none",
        opacity: done ? 0.55 : 1,
      }}>
        {d.label}
      </div>
    </>
  );
}

// ── Stable node type registry ──────────────────────────────────────────────────

const NODE_TYPES: NodeTypes = { member: MemberNode, tool: ToolNode, task: TaskNode };

// ── Layout helpers ────────────────────────────────────────────────────────────

function ring(cx: number, cy: number, r: number, n: number, startAngle = -Math.PI / 2) {
  if (n === 0) return [];
  return Array.from({ length: n }, (_, i) => {
    const a = startAngle + (i / n) * 2 * Math.PI;
    return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
  });
}

// Deterministic jitter (no Math.random → stable across renders)
function dj(seed: number, range: number) {
  const v = Math.sin(seed * 9301 + 49297) * 43758.5453;
  return (v - Math.floor(v) - 0.5) * range * 2;
}

// ── Graph builder ─────────────────────────────────────────────────────────────

const MAX_MEMBERS = 12;

function buildGraph(
  members: Member[],
  snapshots: MemberSnapshot[],
  integrations: Integration[]
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const snapMap = new Map(snapshots.map(s => [s.memberId, s]));

  // Only show active members who have at least one task, cap at MAX_MEMBERS
  const connected = members
    .filter(m => m.isActive && (snapMap.get(m.id)?.activeTasks?.length ?? 0) > 0)
    .slice(0, MAX_MEMBERS);

  // Collect tools referenced by those members
  const toolSet = new Set<string>();
  for (const m of connected) {
    for (const t of snapMap.get(m.id)?.activeTasks ?? []) toolSet.add(t.tool);
  }
  for (const i of integrations) toolSet.add(i.service);
  const tools = [...toolSet];

  const CX = 540, CY = 360;
  const MEMBER_R = 195;
  const TOOL_R = 345;

  // Per-tool member count (badge on tool node)
  const toolMC: Record<string, number> = {};
  for (const m of connected) {
    const seen = new Set<string>();
    for (const t of snapMap.get(m.id)?.activeTasks ?? []) {
      if (!seen.has(t.tool)) { toolMC[t.tool] = (toolMC[t.tool] ?? 0) + 1; seen.add(t.tool); }
    }
  }

  // Tool positions — evenly on outer ring, slight radial jitter
  const toolBaseRing = ring(CX, CY, TOOL_R, tools.length);
  const toolPos = toolBaseRing.map((p, i) => {
    const j = dj(i * 7 + 2, 22);
    const dx = p.x - CX, dy = p.y - CY, dist = Math.sqrt(dx*dx+dy*dy);
    const nd = dist + j;
    return { x: CX + (dx/dist)*nd, y: CY + (dy/dist)*nd };
  });

  // Tool nodes (approx 100×28 → offset -50,-14)
  tools.forEach((tool, i) => {
    const color = TOOL_COLORS[tool] ?? "#888";
    const pos = toolPos[i];
    nodes.push({
      id: `tool-${tool}`, type: "tool",
      position: { x: pos.x - 50, y: pos.y - 14 },
      data: { name: TOOL_LABELS[tool] ?? tool.charAt(0).toUpperCase()+tool.slice(1), color, memberCount: toolMC[tool] ?? 0 },
      draggable: true,
    });
  });

  // Member positions — evenly spaced on inner ring
  const memberRing = ring(CX, CY, MEMBER_R, connected.length);

  connected.forEach((member, mi) => {
    const color = MEMBER_COLORS[mi % MEMBER_COLORS.length];
    const snap = snapMap.get(member.id)!;
    const tasks = snap.activeTasks ?? [];
    const hasBlocker = (snap.blockers?.length ?? 0) > 0;
    const mPos = memberRing[mi];
    const mId = `member-${member.id}`;

    // Member node (approx 150×36 → offset -75,-18)
    nodes.push({
      id: mId, type: "member",
      position: { x: mPos.x - 75, y: mPos.y - 18 },
      data: {
        name: member.displayName ?? member.telegramUsername ?? "?",
        color, taskCount: tasks.length, hasBlocker,
        calStatus: snap.calendarStatus ?? "available",
      },
      draggable: true,
    });

    // Task nodes — orbit close to member, fanned toward their tool
    // Group tasks by tool so we can spread them within each tool's direction
    const byTool = new Map<string, typeof tasks>();
    for (const t of tasks) {
      if (!byTool.has(t.tool)) byTool.set(t.tool, []);
      byTool.get(t.tool)!.push(t);
    }

    let globalTaskIdx = 0;
    byTool.forEach((toolTasks, toolName) => {
      const toolIdx = tools.indexOf(toolName);
      if (toolIdx === -1) return;
      const tPos = toolPos[toolIdx];
      const toolColor = TOOL_COLORS[toolName] ?? "#888";

      // Angle from member toward tool
      const baseAngle = Math.atan2(tPos.y - mPos.y, tPos.x - mPos.x);
      const ORBIT_R = 72; // distance from member center to task node center
      const SPREAD = 0.22; // radians between tasks for the same tool

      toolTasks.forEach((task, ti) => {
        const totalSpread = (toolTasks.length - 1) * SPREAD;
        const angleOffset = -totalSpread / 2 + ti * SPREAD;
        const taskAngle = baseAngle + angleOffset;

        const tx = mPos.x + Math.cos(taskAngle) * ORBIT_R;
        const ty = mPos.y + Math.sin(taskAngle) * ORBIT_R;
        const taskId = `task-${member.id}-${task.id}`;

        // task pill approx 130×16 → offset -65,-8
        nodes.push({
          id: taskId, type: "task",
          position: { x: tx - 65, y: ty - 8 },
          data: { label: task.title, color: toolColor, status: task.status },
          draggable: true,
        });

        // member → task (faint member-colored)
        edges.push({
          id: `em-${mId}-${taskId}`,
          source: mId, target: taskId,
          type: "smoothstep",
          style: { stroke: color, strokeWidth: 1, opacity: 0.25 },
        });

        // task → tool (tool-colored)
        edges.push({
          id: `et-${taskId}-${toolName}`,
          source: taskId, target: `tool-${toolName}`,
          type: "smoothstep",
          style: { stroke: toolColor, strokeWidth: 1, opacity: 0.3 },
        });

        globalTaskIdx++;
      });
    });

    // Blocker edges — member → member
    for (const blocker of snap.blockers ?? []) {
      const desc = blocker.description.toLowerCase();
      connected.forEach(other => {
        if (other.id === member.id) return;
        const firstName = (other.displayName ?? "").toLowerCase().split(" ")[0];
        if (firstName && desc.includes(firstName)) {
          edges.push({
            id: `blocker-${member.id}-${other.id}`,
            source: mId, target: `member-${other.id}`,
            type: "smoothstep",
            markerEnd: { type: MarkerType.ArrowClosed, width: 12, height: 12, color: "#ef4444" },
            style: { stroke: "#ef4444", strokeWidth: 1.5, strokeDasharray: "4 3", opacity: 0.75 },
            label: "blocked by",
            labelStyle: { fontSize: 8, fill: "#ef4444", fontFamily: "var(--font-dm-sans,sans-serif)", fontWeight: 600 },
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
  const [resolvedSnaps, setResolvedSnaps] = useState<MemberSnapshot[]>([]);
  const [resolvedMems, setResolvedMems] = useState<Member[]>([]);

  const loadSnapshots = useCallback(async () => {
    setSnapsLoading(true);
    try { setSnapshots(await api.getSnapshots(slug)); }
    catch { setSnapshots([]); }
    finally { setSnapsLoading(false); }
  }, [slug]);

  useEffect(() => { loadSnapshots(); }, [loadSnapshots]);

  useEffect(() => {
    if (loading || snapsLoading) return;
    const hasData = snapshots.some(s => (s.activeTasks?.length ?? 0) > 0);
    const activeMembers = members.filter(m => m.isActive);
    const resolvedMembers = activeMembers.length > 0 ? activeMembers : MOCK_MEMBERS;
    const resolvedIntegrations = integrations.length > 0 ? integrations : MOCK_INTEGRATIONS;
    const resolvedSnapshots = hasData
      ? snapshots
      : MOCK_SNAPSHOTS.map((s, i) => ({
          ...s,
          memberId: resolvedMembers[i % resolvedMembers.length]?.id ?? s.memberId,
        }));
    setResolvedSnaps(resolvedSnapshots);
    setResolvedMems(resolvedMembers);
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

  const connected = resolvedMems.filter(m => m.isActive && resolvedSnaps.some(s => s.memberId === m.id && (s.activeTasks?.length ?? 0) > 0)).slice(0, MAX_MEMBERS);
  const taskCount = resolvedSnaps.reduce((s, sn) => s + (sn.activeTasks?.length ?? 0), 0);
  const blockerCount = resolvedSnaps.reduce((s, sn) => s + (sn.blockers?.length ?? 0), 0);
  const busyCount = resolvedSnaps.filter(s => /busy|in_meeting/.test(s.calendarStatus ?? "")).length;
  const hiddenCount = Math.max(0, resolvedMems.filter(m => m.isActive).length - connected.length);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div style={{
        display: "flex", gap: 12, fontSize: 11.5,
        color: "var(--ink-30)", fontFamily: "var(--font-dm-sans)",
        alignItems: "center",
      }}>
        <span>{connected.length} members shown</span>
        {hiddenCount > 0 && <span style={{ color: "var(--ink-20)" }}>· {hiddenCount} without active tasks hidden</span>}
        <span>·</span>
        <span>{taskCount} tasks</span>
        <span>·</span>
        <span>{integrations.length} tools</span>
        {blockerCount > 0 && <><span>·</span><span style={{ color: "#ef4444" }}>{blockerCount} blocker{blockerCount > 1 ? "s" : ""}</span></>}
        {busyCount > 0 && <><span>·</span><span style={{ color: "#f59e0b" }}>{busyCount} in meeting</span></>}
        <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center", opacity: 0.5, fontSize: 11 }}>
          <span><span style={{ display:"inline-block", width:8, height:8, borderRadius:"50%", background:"#ef4444", marginRight:3 }} />blocker</span>
          <span><span style={{ display:"inline-block", width:8, height:8, borderRadius:"50%", background:"#f59e0b", marginRight:3 }} />in meeting</span>
        </div>
      </div>

      <div style={{
        height: "calc(100vh - 148px)",
        borderRadius: 16, overflow: "hidden",
        border: "1px solid var(--rule)", background: "#f8f8f6",
      }}>
        <ReactFlow
          nodes={nodes} edges={edges}
          onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
          nodeTypes={NODE_TYPES}
          fitView fitViewOptions={{ padding: 0.13 }}
          proOptions={{ hideAttribution: true }}
          nodesDraggable minZoom={0.25} maxZoom={3}
          defaultEdgeOptions={{ type: "smoothstep" }}
        >
          <Background color="#e2e1dd" gap={28} size={1} />
          <Controls showInteractive={false} style={{ boxShadow: "none", border: "1px solid var(--rule)", borderRadius: 10 }} />
        </ReactFlow>
      </div>
    </div>
  );
}
