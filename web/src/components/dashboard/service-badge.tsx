import { getIntegrationConfig } from "@/constants/integrations";

type ServiceBadgeProps = {
  service: string;
  size?: number;
};

export function ServiceBadge({ service, size = 38 }: ServiceBadgeProps) {
  const cfg = getIntegrationConfig(service);
  if (!cfg) return null;

  const { Icon, bg } = cfg;
  const radius = Math.round(size * 0.26);
  const iconSize = Math.round(size * 0.62);

  return (
    <div style={{
      height: size, width: size, borderRadius: radius, flexShrink: 0,
      background: bg, display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <Icon width={iconSize} height={iconSize} />
    </div>
  );
}
