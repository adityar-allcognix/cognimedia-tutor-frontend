import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Sparkles,
  BarChart3,
  History,
  Brain,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Learn", url: "/learn", icon: BookOpen },
  { title: "AI Tools", url: "/ai-tools", icon: Sparkles },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "History", url: "/history", icon: History },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen border-r border-border/50 bg-card/50 backdrop-blur-sm p-6">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-3 mb-10">
        <div className="w-10 h-10 rounded-2xl gradient-primary flex items-center justify-center shadow-md">
          <Brain className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold tracking-tight text-foreground">
          CogniMentor
        </span>
      </Link>

      {/* Navigation */}
      <nav className="flex flex-col gap-1.5 flex-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.url || 
            (item.url !== "/" && location.pathname.startsWith(item.url));
          return (
            <Link
              key={item.title}
              to={item.url}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="w-[18px] h-[18px]" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom card */}
      <div className="mt-auto p-4 rounded-2xl bg-lavender/60 border border-lavender-deep/30">
        <p className="text-xs font-semibold text-foreground mb-1">Pro Tip</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Complete daily quizzes to build your learning streak!
        </p>
      </div>
    </aside>
  );
}
