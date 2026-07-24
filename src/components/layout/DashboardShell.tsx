import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, LogOut, Menu, Moon, Search, Sun, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { SidebarNav } from "./SidebarNav";
import { GlobalSearch } from "./GlobalSearch";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/lib/theme";
import { db, signedUrl, type Profile } from "@/lib/dreamscape";

export function DashboardShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { theme, resolved, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const { data: profile } = useQuery<Profile | null>({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await db.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return data ?? null;
    },
  });

  const { data: avatar } = useQuery({
    queryKey: ["avatar", profile?.avatar_url],
    enabled: !!profile?.avatar_url,
    queryFn: () => signedUrl(profile!.avatar_url),
  });

  const { data: isAdmin } = useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await db
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .eq("role", "admin")
        .maybeSingle();
      return !!data;
    },
  });

  const { data: unread = 0 } = useQuery({
    queryKey: ["unread-count", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count } = await db
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("read", false);
      return count ?? 0;
    },
  });

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOut();
    navigate({ to: "/auth", replace: true });
  };

  const initials =
    (profile?.full_name || user?.email || "D").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 aurora opacity-[0.45]" />
      <div className="relative flex">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-sidebar-border bg-sidebar/70 backdrop-blur-xl lg:block">
          <SidebarNav isAdmin={!!isAdmin} />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 glass border-b">
            <div className="flex h-16 items-center gap-2 px-4 sm:px-6">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="size-5" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 bg-sidebar p-0">
                  <SheetTitle className="sr-only">Navigation</SheetTitle>
                  <SidebarNav isAdmin={!!isAdmin} onNavigate={() => setMobileOpen(false)} />
                </SheetContent>
              </Sheet>

              <button
                onClick={() => setSearchOpen(true)}
                className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-card/60 px-3 py-2 text-sm text-muted-foreground transition-smooth hover:bg-accent/60 sm:max-w-sm"
              >
                <Search className="size-4" />
                <span>Search everything…</span>
              </button>

              <div className="ml-auto flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Toggle theme"
                  onClick={() => setTheme(resolved === "dark" ? "light" : "dark")}
                >
                  {resolved === "dark" ? (
                    <Sun className="size-[18px]" />
                  ) : (
                    <Moon className="size-[18px]" />
                  )}
                </Button>

                <Button variant="ghost" size="icon" asChild aria-label="Notifications">
                  <Link to="/notifications" className="relative">
                    <Bell className="size-[18px]" />
                    {unread > 0 && (
                      <Badge className="absolute -right-0.5 -top-0.5 size-4 justify-center rounded-full p-0 text-[10px]">
                        {unread > 9 ? "9+" : unread}
                      </Badge>
                    )}
                  </Link>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="ml-1 rounded-full ring-offset-background transition-smooth hover:opacity-80">
                      <Avatar className="size-9 border border-border">
                        {avatar && <AvatarImage src={avatar} alt="" />}
                        <AvatarFallback className="gradient-brand text-xs font-semibold text-primary-foreground">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="truncate">
                      {profile?.full_name || user?.email}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile">
                        <UserIcon className="mr-2 size-4" /> Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    >
                      <Moon className="mr-2 size-4" /> Toggle theme
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 size-4" /> Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}

