import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Sparkles,
  BarChart3,
  History,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getAuthSession, clearAuthSession } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Learn", url: "/learn", icon: BookOpen },
  { title: "AI Tools", url: "/ai-tools", icon: Sparkles },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "History", url: "/history", icon: History },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const session = getAuthSession();
  const user = session?.user;

  const handleLogout = () => {
    clearAuthSession();
    navigate("/auth");
  };

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 border-r border-border/50 bg-card/50 backdrop-blur-sm p-6 overflow-hidden">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-3 mb-10">
        <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center bg-white shadow-md">
          <img src="/logo.png" alt="CogniMentor" className="w-8 h-8 object-contain" />
        </div>
        <span className="text-xl font-bold tracking-tight text-foreground">
          CogniMentor
        </span>
      </Link>

      {/* Navigation */}
      <nav className="flex flex-col gap-1.5 flex-1 overflow-y-auto">
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
      <div className="mt-6 p-4 rounded-2xl bg-lavender/60 border border-lavender-deep/30">
        <p className="text-xs font-semibold text-foreground mb-1">Pro Tip</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Complete daily quizzes to build your learning streak!
        </p>
      </div>
      

      {/* User profile & Logout */}
      <div className="mt-8 pt-6 border-t border-border/50">
        <div className="flex items-center gap-3 px-2 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
            {user?.full_name?.charAt(0) || user?.email?.charAt(0) || "U"}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-semibold truncate text-foreground">
              {user?.full_name || "Student"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-xl"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          <span>Logout</span>
        </Button>
      </div>

      
    </aside>
  );
}
