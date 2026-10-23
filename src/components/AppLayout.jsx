import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Heart,
  LayoutDashboard,
  Users,
  ClipboardCheck,
  ShieldAlert,
  CalendarDays,
  BookOpen,
  Settings,
  CreditCard,
  MessagesSquare,
  LogOut,
  Menu,
  X,
  Bell,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

const roleNav = {
  seeker: [
    { to: "/app", label: "Get Support", icon: MessagesSquare },
    { to: "/app/sessions", label: "My Sessions", icon: CalendarDays },
    { to: "/app/billing", label: "Subscription", icon: CreditCard },
    { to: "/app/resources", label: "Resources", icon: BookOpen },
    { to: "/app/settings", label: "Settings", icon: Settings },
  ],
  listener: [
    { to: "/app", label: "Queue", icon: LayoutDashboard },
    { to: "/app/sessions", label: "Sessions", icon: CalendarDays },
    { to: "/app/settings", label: "Profile & Schedule", icon: Settings },
  ],
  therapist: [
    { to: "/app", label: "Queue", icon: LayoutDashboard },
    { to: "/app/sessions", label: "Sessions", icon: CalendarDays },
    { to: "/app/settings", label: "Profile & Schedule", icon: Settings },
  ],
  admin: [
    { to: "/app", label: "Overview", icon: LayoutDashboard },
    { to: "/app/applications", label: "Applications", icon: ClipboardCheck },
    { to: "/app/users", label: "Users", icon: Users },
    { to: "/app/plans", label: "Plans & Pricing", icon: CreditCard },
    { to: "/app/incidents", label: "Safety Incidents", icon: ShieldAlert },
    { to: "/app/settings", label: "Settings", icon: Settings },
  ],
};

// Bottom tab bar tabs (mobile). Always the four core surfaces.
const bottomTabs = [
  { to: "/app", label: "Get Support", icon: MessagesSquare },
  { to: "/app/sessions", label: "My Sessions", icon: CalendarDays },
  { to: "/app/resources", label: "Resources", icon: BookOpen },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

const roleLabel = {
  seeker: "Support Seeker",
  listener: "Listener",
  therapist: "Therapist",
  admin: "Admin",
};

export default function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const role = user?.role || "seeker";
  const nav = roleNav[role] || roleNav.seeker;
  // Nested child screens (e.g. /app/session/:id) get a back button instead of the menu
  const nested =
    location.pathname.replace("/app", "").split("/").filter(Boolean).length > 1;

  // Active-tab path memoization: remember the last path visited under each
  // bottom tab so toggling back to a tab restores that child path instead of
  // resetting to the tab root. The active tab is the longest matching prefix.
  const lastPathByTab = useRef({});
  const activeTabKey = useMemo(() => {
    let best = null;
    for (const t of bottomTabs) {
      if (
        location.pathname === t.to ||
        location.pathname.startsWith(t.to + "/")
      ) {
        if (!best || t.to.length > best.to.length) best = t.to;
      }
    }
    return best;
  }, [location.pathname]);

  useEffect(() => {
    if (activeTabKey) lastPathByTab.current[activeTabKey] = location.pathname;
  }, [location.pathname, activeTabKey]);

  const goTab = (tab) => {
    const memo = lastPathByTab.current[tab.to];
    if (memo && memo !== location.pathname) {
      navigate(memo);
    } else {
      navigate(tab.to);
    }
  };

  const handleLogout = async () => {
    await logout(false);
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar (desktop) */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-sidebar transition-transform md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
          <Link to="/app" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full brand-gradient text-primary-foreground">
              <Heart className="h-4 w-4" />
            </span>
            <span className="font-semibold font-heading">SafeEars</span>
          </Link>
          <button className="md:hidden" onClick={() => setOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="p-3 space-y-1">
          {nav.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 w-64 p-3 border-t border-sidebar-border">
          <div className="rounded-xl bg-sidebar-accent/60 p-3">
            <p className="text-xs font-medium">
              {user?.full_name || user?.nickname || "You"}
            </p>
            <p className="text-xs text-muted-foreground">{roleLabel[role]}</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 w-full justify-start px-2"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" /> Sign out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 md:ml-64">
        <header className="app-header sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/85 backdrop-blur-md px-4">
          {nested ? (
            <button
              onClick={() => navigate(-1)}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-2 text-sm font-medium hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5" /> Back
            </button>
          ) : (
            <button
              className="md:hidden inline-flex min-h-[44px] items-center"
              onClick={() => setOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          <div className="hidden md:block text-sm text-muted-foreground">
            Welcome back{user?.nickname ? ", " + user.nickname : ""} 👋
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button className="relative p-2 rounded-full hover:bg-muted">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
            </button>
          </div>
        </header>
        <main className="p-4 md:p-6 max-w-6xl mx-auto pb-24 md:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Bottom tab bar (mobile) */}
      <nav className="app-bottombar fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-border bg-background/95 backdrop-blur-md md:hidden">
        {bottomTabs.map((tab) => {
          const active = location.pathname === tab.to;
          return (
            <Link
              key={tab.to}
              to={tab.to}
              onClick={(e) => {
                e.preventDefault();
                goTab(tab);
              }}
              className={cn(
                "flex flex-1 min-h-[44px] flex-col items-center justify-center gap-1 py-2 text-[11px] transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <tab.icon className="h-5 w-5" />
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
