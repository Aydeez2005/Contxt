import type { Member } from "@/lib/api";
import { FACE_COLORS } from "@/utils/dashboard";

type MemberFacesProps = {
  members: Member[];
  max?: number;
};

export function MemberFaces({ members, max = 4 }: MemberFacesProps) {
  const visible = members.slice(0, max);
  const overflow = members.length - max;

  return (
    <div style={{ display: "flex", alignItems: "center", marginTop: 16 }}>
      {visible.map((m, i) => {
        const color = FACE_COLORS[i % FACE_COLORS.length];
        const initial = (m.displayName ?? m.telegramUsername ?? "?")[0].toUpperCase();
        return (
          <div
            key={m.id}
            title={m.displayName ?? m.telegramUsername ?? "Member"}
            style={{
              height: 26, width: 26, borderRadius: "50%",
              background: `${color}18`, border: "2.5px solid white",
              marginLeft: i > 0 ? -9 : 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 8.5, fontWeight: 700, color,
              fontFamily: "var(--font-dm-sans)",
              position: "relative", zIndex: max - i,
            }}
          >
            {initial}
          </div>
        );
      })}
      {overflow > 0 && (
        <div style={{
          height: 26, width: 26, borderRadius: "50%",
          background: "var(--surface)", border: "2.5px solid white",
          marginLeft: -9,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 8, fontWeight: 600, color: "var(--ink-30)",
          fontFamily: "var(--font-dm-sans)",
          position: "relative", zIndex: 0,
        }}>
          +{overflow}
        </div>
      )}
    </div>
  );
}
