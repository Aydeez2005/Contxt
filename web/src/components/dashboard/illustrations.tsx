export function HeroDecoration() {
  const nodes: [number, number][] = [
    [300, 30], [380, 80], [250, 100], [340, 150],
    [420, 45], [460, 120], [280, 170], [400, 190],
  ];
  const edges: [number, number][] = [
    [0, 1], [0, 2], [0, 4], [1, 4], [1, 3], [2, 3],
    [2, 6], [3, 5], [4, 5], [5, 7], [6, 7],
  ];
  return (
    <svg width="500" height="220" viewBox="0 0 500 220" fill="none" style={{ display: "block" }}>
      {edges.map(([a, b], i) => (
        <line key={i}
          x1={nodes[a][0]} y1={nodes[a][1]}
          x2={nodes[b][0]} y2={nodes[b][1]}
          stroke="var(--ink)" strokeWidth="1"
        />
      ))}
      {nodes.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={3.5} fill="var(--ink)" />
      ))}
    </svg>
  );
}

export function MembersIllustration() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <circle cx="17" cy="19" r="7" fill="var(--ink)" opacity="0.07"/>
      <circle cx="31" cy="19" r="7" fill="var(--ink)" opacity="0.07"/>
      <circle cx="17" cy="19" r="5" fill="var(--ink)" opacity="0.14"/>
      <circle cx="31" cy="19" r="5" fill="var(--ink)" opacity="0.14"/>
      <circle cx="24" cy="16" r="6.5" fill="var(--ink)" opacity="0.42"/>
      <path d="M9 40c0-7 6-11 15-11s15 4 15 11" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" opacity="0.28"/>
    </svg>
  );
}

export function ToolsIllustration() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect x="7" y="7" width="13" height="13" rx="3.5" fill="var(--ink)" opacity="0.09"/>
      <rect x="28" y="7" width="13" height="13" rx="3.5" fill="var(--ink)" opacity="0.09"/>
      <rect x="7" y="28" width="13" height="13" rx="3.5" fill="var(--ink)" opacity="0.09"/>
      <rect x="28" y="28" width="13" height="13" rx="3.5" fill="var(--ink)" opacity="0.3"/>
      <circle cx="34.5" cy="34.5" r="5" fill="var(--ink)" opacity="0.48"/>
      <line x1="13.5" y1="20" x2="13.5" y2="28" stroke="var(--ink)" strokeWidth="1.5" strokeLinecap="round" opacity="0.16"/>
      <line x1="34.5" y1="20" x2="34.5" y2="28" stroke="var(--ink)" strokeWidth="1.5" strokeLinecap="round" opacity="0.16"/>
      <line x1="20" y1="13.5" x2="28" y2="13.5" stroke="var(--ink)" strokeWidth="1.5" strokeLinecap="round" opacity="0.16"/>
    </svg>
  );
}

export function BotIllustration() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect x="11" y="15" width="26" height="20" rx="6" fill="var(--ink)" opacity="0.07"/>
      <rect x="13" y="17" width="22" height="16" rx="5" fill="var(--ink)" opacity="0.11"/>
      <circle cx="19" cy="24" r="2.75" fill="var(--ink)" opacity="0.42"/>
      <circle cx="29" cy="24" r="2.75" fill="var(--ink)" opacity="0.42"/>
      <path d="M19 30h10" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" opacity="0.3"/>
      <line x1="24" y1="11" x2="24" y2="15" stroke="var(--ink)" strokeWidth="2.5" strokeLinecap="round" opacity="0.22"/>
      <circle cx="24" cy="9.5" r="2.5" fill="var(--ink)" opacity="0.22"/>
      <line x1="11" y1="25" x2="7" y2="25" stroke="var(--ink)" strokeWidth="1.5" strokeLinecap="round" opacity="0.14"/>
      <line x1="37" y1="25" x2="41" y2="25" stroke="var(--ink)" strokeWidth="1.5" strokeLinecap="round" opacity="0.14"/>
    </svg>
  );
}

export function TrendIllustration() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <path d="M7 36 L16 26 L23 31 L33 19 L41 14" stroke="var(--ink)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.3"/>
      <circle cx="16" cy="26" r="2.5" fill="var(--ink)" opacity="0.3"/>
      <circle cx="23" cy="31" r="2.5" fill="var(--ink)" opacity="0.3"/>
      <circle cx="33" cy="19" r="2.5" fill="var(--ink)" opacity="0.3"/>
      <circle cx="41" cy="14" r="3.5" fill="var(--ink)" opacity="0.55"/>
      <path d="M5 40H43" stroke="var(--ink)" strokeWidth="1" strokeLinecap="round" opacity="0.09"/>
    </svg>
  );
}
