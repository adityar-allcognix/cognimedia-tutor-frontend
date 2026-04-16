import { useEffect, useState } from "react";
import { BarChart3, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { cn } from "@/lib/utils";
import { getAnalytics } from "@/lib/api";
import { getCurrentUserId } from "@/lib/user";

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const userId = getCurrentUserId();

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!userId) return;
      try {
        setLoading(true);
        const res = await getAnalytics(userId);
        if (res.status === "success") {
          setData(res.data);
        }
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [userId]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-screen">
          <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Calculating your learning metrics...</p>
        </div>
      </AppLayout>
    );
  }

  const stats = [
    { label: "Learning Streak", value: `${data?.learning_streak || 0} days`, change: "Keep it up!" },
    { label: "Total Points", value: data?.total_points || 0, change: "Earning fast" },
    { label: "AI Generations", value: data?.total_runs || 0, change: "Active learning" },
    { label: "Avg. Mastery", value: `${Math.round((data?.avg_mastery || 0) * 100)}%`, change: "Across all topics" },
  ];

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Analytics</h1>
          </div>
          <p className="text-muted-foreground">Track your learning progress and identify areas to improve.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {stats.map((stat, i) => (
            <div key={i} className="glass-card p-5 animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-xs text-success font-medium mt-1">{stat.change}</p>
            </div>
          ))}
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tool Usage */}
          <div className="glass-card p-6 md:p-8 animate-fade-in" style={{ animationDelay: "200ms" }}>
            <h2 className="text-lg font-semibold text-foreground mb-6">Learning Tools Usage</h2>
            <div className="space-y-4">
              {data?.tool_usage?.map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-32 flex-shrink-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.tool_name}</p>
                  </div>
                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-700"
                      style={{ width: `${(item.count / (data.total_runs || 1)) * 100}%` }}
                    />
                  </div>
                  <div className="w-10 text-right">
                    <span className="text-xs font-semibold text-foreground">{item.count}</span>
                  </div>
                </div>
              ))}
              {(!data?.tool_usage || data.tool_usage.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-8">No data available yet. Start using AI tools to see stats!</p>
              )}
            </div>
          </div>

          {/* Mastery Distribution */}
          <div className="glass-card p-6 md:p-8 animate-fade-in" style={{ animationDelay: "300ms" }}>
            <h2 className="text-lg font-semibold text-foreground mb-6">Mastery Level</h2>
            <div className="space-y-6 flex flex-col justify-center h-[calc(100%-4rem)]">
              {Object.entries(data?.mastery_distribution || {}).map(([level, count]: [string, any], i) => (
                <div key={level} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-3 h-3 rounded-full",
                      level === "high" ? "bg-success" : level === "medium" ? "bg-warning" : "bg-destructive"
                    )} />
                    <span className="text-sm font-medium capitalize">{level} Mastery</span>
                  </div>
                  <span className="text-sm font-bold">{count} topics</span>
                </div>
              ))}
              {Object.keys(data?.mastery_distribution || {}).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">Take more quizzes to calculate your mastery.</p>
              )}
            </div>
          </div>
        </div>

        {/* Strength/Weakness */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: "400ms" }}>
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-success" /> Strongest Topic
            </h3>
            {data?.strongest_topic ? (
              <div className="p-4 bg-success-soft/50 rounded-xl">
                <p className="text-sm font-bold text-foreground">{data.strongest_topic.topic}</p>
                <p className="text-xs text-success mt-1">Accuracy: {Math.round(data.strongest_topic.mastery_level * 100)}%</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Insufficient data</p>
            )}
          </div>
          <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: "500ms" }}>
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-destructive" /> Needs Focus
            </h3>
            {data?.weakest_topic ? (
              <div className="p-4 bg-danger-soft/50 rounded-xl">
                <p className="text-sm font-bold text-foreground">{data.weakest_topic.topic}</p>
                <p className="text-xs text-destructive mt-1">Accuracy: {Math.round(data.weakest_topic.mastery_level * 100)}%</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Insufficient data</p>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
