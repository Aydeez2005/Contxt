type DashInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  mono?: boolean;
};

export function DashInput({ mono = false, style: extra, ...props }: DashInputProps) {
  return (
    <input
      style={{
        width: "100%", height: 40, borderRadius: 9,
        border: "1px solid var(--rule)", background: "var(--surface)",
        padding: "0 0.875rem", fontSize: 13.5,
        fontFamily: mono ? "monospace" : "var(--font-dm-sans)",
        color: "var(--ink)", outline: "none", boxSizing: "border-box",
        transition: "border-color 0.18s, background 0.18s",
        ...extra,
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

type FieldLabelProps = {
  children: React.ReactNode;
};

export function FieldLabel({ children }: FieldLabelProps) {
  return (
    <label style={{
      display: "block", fontSize: 12, fontFamily: "var(--font-dm-sans)",
      fontWeight: 500, color: "var(--ink-50)", marginBottom: 6,
    }}>
      {children}
    </label>
  );
}
