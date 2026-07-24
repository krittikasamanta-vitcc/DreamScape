import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Target,
  Image as ImageIcon,
  Repeat,
  BookOpen,
  Smile,
  BarChart3,
  Calendar,
  Bell,
  Trophy,
  User,
  Settings,
  Shield,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/goals", label: "Goals", icon: Target },
  { to: "/vision-board", label: "Vision Board", icon: ImageIcon },
  { to: "/habits", label: "Habits", icon: Repeat },
  { to: "/journal", label: "Journal", icon: BookOpen },
  { to: "/mood", label: "Mood", icon: Smile },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/calendar", label: "Calendar", icon: Calendar },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/achievements", label: "Achievements", icon: Trophy },
] as const;

export const ACCOUNT_ITEMS = [
  { to: "/profile", label: "Profile", icon: User },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function SidebarNav({
  isAdmin,
  onNavigate,
}: {
  isAdmin: boolean;
  onNavigate?: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const item = (to: string, label: string, Icon: typeof Target) => (
    <Link
      key={to}
      to={to}
      onClick={onNavigate}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-smooth",
        pathname === to
          ? "gradient-brand text-primary-foreground shadow-float"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      )}
    >
      <Icon className="size-[18px] shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );

  return (
    <div className="flex h-full flex-col gap-1 overflow-y-auto p-4">
      <Link
        to="/"
        onClick={onNavigate}
        className="mb-4 flex items-center gap-2.5 px-1 py-1"
      >
        <span className="grid size-9 place-items-center rounded-xl gradient-brand shadow-glow">
          <Sparkles className="size-5 text-primary-foreground" />
        </span>
        <span className="font-display text-lg font-bold tracking-tight">DreamScape</span>
      </Link>

      <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Workspace
      </p>
      {NAV_ITEMS.map((n) => item(n.to, n.label, n.icon))}

      <p className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Account
      </p>
      {ACCOUNT_ITEMS.map((n) => item(n.to, n.label, n.icon))}
      {isAdmin && item("/admin", "Admin", Shield)}
    </div>
  );
}
