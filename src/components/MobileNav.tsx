import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Sparkles,
  BarChart3,
  History,
  FolderOpen,
  School,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getAuthSession } from "@/lib/auth";

const navItemsByRole = {
  school_admin: [
    { title: "Home", url: "/", icon: LayoutDashboard },
    { title: "Approvals", url: "/school-admin", icon: School },
    { title: "Materials", url: "/materials", icon: FolderOpen },
  ],
  teacher: [
    { title: "Home", url: "/", icon: LayoutDashboard },
    { title: "AI", url: "/ai-tools", icon: Sparkles },
    { title: "History", url: "/history", icon: History },
    { title: "Materials", url: "/materials", icon: FolderOpen },
  ],
  student: [
    { title: "Home", url: "/", icon: LayoutDashboard },
    { title: "Learn", url: "/learn", icon: BookOpen },
    { title: "AI", url: "/ai-tools", icon: Sparkles },
    { title: "Stats", url: "/analytics", icon: BarChart3 },
    { title: "History", url: "/history", icon: History },
  ],
  parent: [
    { title: "Home", url: "/", icon: LayoutDashboard },
    { title: "Children", url: "/parent-progress", icon: Users },
    { title: "Materials", url: "/materials", icon: FolderOpen },
  ],
} as const;

export function MobileNav() {
  const location = useLocation();
  const role = getAuthSession()?.user.role ?? "student";
  const navItems = navItemsByRole[role as keyof typeof navItemsByRole] ?? navItemsByRole.student;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card/80 backdrop-blur-xl border-t border-border/50 px-2 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.url ||
            (item.url !== "/" && location.pathname.startsWith(item.url));
          return (
            <Link
              key={item.title}
              to={item.url}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-xs transition-all duration-200",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive && "drop-shadow-sm")} />
              <span className="font-medium">{item.title}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
