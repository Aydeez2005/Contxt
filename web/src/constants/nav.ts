import { LayoutDashboard, Zap, Users, Bot, Send } from "lucide-react";
import type { ElementType } from "react";

export type NavItem = {
  id: string;
  label: string;
  /** Relative path segment after /dashboard/[slug]. Empty string = overview. */
  path: string;
  Icon: ElementType;
};

export const NAV_ITEMS: NavItem[] = [
  { id: "overview",     label: "Overview",     path: "",             Icon: LayoutDashboard },
  { id: "integrations", label: "Integrations", path: "integrations", Icon: Zap             },
  { id: "members",      label: "Members",      path: "members",      Icon: Users           },
  { id: "bot",          label: "Bot Setup",    path: "bot",          Icon: Bot             },
  { id: "test",         label: "Test Agent",   path: "test",         Icon: Send            },
];

export function navHref(slug: string, path: string): string {
  return path ? `/dashboard/${slug}/${path}` : `/dashboard/${slug}`;
}

export function navLabelFromPathname(slug: string, pathname: string): string {
  const item = NAV_ITEMS.find(n => navHref(slug, n.path) === pathname);
  return item?.label ?? "Dashboard";
}
