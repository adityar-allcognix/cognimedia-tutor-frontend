import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Sparkles,
  BarChart3,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Learn", url: "/learn", icon: BookOpen },
  { title: "AI Tools", url: "/ai-tools", icon: Sparkles },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "History", url: "/history", icon: History },
];

export function MobileNav() {
  const location = useLocation();

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
