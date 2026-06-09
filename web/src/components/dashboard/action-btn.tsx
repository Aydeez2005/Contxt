type ActionBtnVariant = "default" | "ghost" | "danger";

type ActionBtnProps = {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  variant?: ActionBtnVariant;
};

const VARIANT_STYLES: Record<ActionBtnVariant, React.CSSProperties> = {
  default: { background: "var(--ink)",                color: "var(--paper)",    borderColor: "var(--ink)"                   },
  ghost:   { background: "transparent",               color: "var(--ink-50)",   borderColor: "var(--rule)"                   },
  danger:  { background: "rgba(239,68,68,0.06)",      color: "rgb(185,28,28)",  borderColor: "rgba(239,68,68,0.18)"          },
};

export function ActionBtn({
  children,
  onClick,
  disabled,
  type = "button",
  variant = "default",
}: ActionBtnProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        height: 34, padding: "0 0.875rem", borderRadius: 8,
        fontSize: 13, fontFamily: "var(--font-dm-sans)", fontWeight: 500,
        cursor: disabled ? "not-allowed" : "pointer",
        border: "1px solid", transition: "opacity 0.18s",
        opacity: disabled ? 0.5 : 1,
        ...VARIANT_STYLES[variant],
      }}
    >
      {children}
    </button>
  );
}
