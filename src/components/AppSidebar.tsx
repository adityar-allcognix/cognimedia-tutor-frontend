import { useState, useEffect } from "react";
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
  UserPlus,
  LogOut,
  Zap,
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getAuthSession, clearAuthSession } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { UpgradeModal } from "./UpgradeModal";
import { getSubscriptionStatus, type UsageStatus } from "@/lib/subscription";
import { createSchoolSubscriptionRequest } from "@/lib/api";

const navItemsByRole = {
  school_admin: [
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
    { title: "Approvals", url: "/school-admin", icon: School },
    { title: "Onboarding", url: "/onboarding", icon: UserPlus },
    { title: "Materials", url: "/materials", icon: FolderOpen },
  ],
  teacher: [
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
    { title: "Onboarding", url: "/onboarding", icon: UserPlus },
    { title: "AI Tools", url: "/ai-tools", icon: Sparkles },
    { title: "Materials", url: "/materials", icon: FolderOpen },
    { title: "History", url: "/history", icon: History },
  ],
  student: [
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
    { title: "Learn", url: "/learn", icon: BookOpen },
    { title: "AI Tools", url: "/ai-tools", icon: Sparkles },
    { title: "Analytics", url: "/analytics", icon: BarChart3 },
    { title: "History", url: "/history", icon: History },
    { title: "Materials", url: "/materials", icon: FolderOpen },
  ],
  parent: [
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
    { title: "Children", url: "/parent-progress", icon: Users },
    { title: "Materials", url: "/materials", icon: FolderOpen },
  ],
} as const;

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const session = getAuthSession();
  const user = session?.user;
  const role = user?.role ?? "student";
  const navItems = navItemsByRole[role as keyof typeof navItemsByRole] ?? navItemsByRole.student;

  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [status, setStatus] = useState<UsageStatus | null>(null);

  useEffect(() => {
    getSubscriptionStatus()
      .then(setStatus)
      .catch(() => {}); // non-critical
  }, []);

  const handleLogout = () => {
    clearAuthSession();
    navigate("/auth");
  };

  const handleUpgradeSuccess = () => {
    getSubscriptionStatus().then(setStatus).catch(() => {});
  };

  const handleSchoolPlanRequest = async () => {
    try {
      await createSchoolSubscriptionRequest({});
      getSubscriptionStatus().then(setStatus).catch(() => {});
      alert("Request sent to your school admin for approval.");
    } catch (error: any) {
      alert(error?.response?.data?.detail || "Failed to send request.");
    }
  };

  const toolPct = status && !status.is_pro && status.tool_uses.limit
    ? ((status.tool_uses.used ?? 0) / status.tool_uses.limit) * 100
    : 0;
  const learnPct = status && !status.is_pro && status.learn_uses.limit
    ? ((status.learn_uses.used ?? 0) / status.learn_uses.limit) * 100
    : 0;

  return (
    <>
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
            const isActive =
              location.pathname === item.url ||
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

        {/* Usage / Upgrade card */}
        {status && role === "student" && (
          status.is_pro ? (
            <div className="mt-6 p-4 rounded-2xl bg-primary/10 border border-primary/20 flex items-center gap-3">
              <Crown className="w-4 h-4 text-primary flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-primary">Pro Member</p>
                <p className="text-xs text-muted-foreground">Unlimited access</p>
              </div>
            </div>
          ) : (
            <div className="mt-6 p-4 rounded-2xl bg-muted/60 border border-border/50 space-y-3">
              <p className="text-xs font-semibold text-foreground">Free Plan</p>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Topics learned</span>
                  <span>{status.learn_uses.used ?? 0}/{status.learn_uses.limit}</span>
                </div>
                <Progress value={learnPct} className="h-1.5" />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>AI tools used</span>
                  <span>{status.tool_uses.used ?? 0}/{status.tool_uses.limit}</span>
                </div>
                <Progress value={toolPct} className="h-1.5" />
              </div>

              <Button
                size="sm"
                className="w-full text-xs"
                onClick={() => setUpgradeOpen(true)}
              >
                <Zap className="w-3 h-3 mr-1.5" />
                Upgrade — ₹200/mo
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs"
                onClick={handleSchoolPlanRequest}
              >
                Request via School
              </Button>
            </div>
          )
        )}

        {/* User profile & Logout */}
        <div className="mt-6 pt-6 border-t border-border/50">
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              {user?.full_name?.charAt(0) || user?.email?.charAt(0) || "U"}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold truncate text-foreground">
                {user?.full_name || "Student"}
              </p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground/70">{role.replace("_", " ")}</p>
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

      <UpgradeModal
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        onSuccess={handleUpgradeSuccess}
      />
    </>
  );
}
