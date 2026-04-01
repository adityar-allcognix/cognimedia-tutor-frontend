import { BarChart3, TrendingUp, TrendingDown } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { cn } from "@/lib/utils";

const topicData = [
  { topic: "Newton's Laws", accuracy: 92, trend: "up", category: "strong" },
  { topic: "Optics – Reflection", accuracy: 85, trend: "up", category: "strong" },
  { topic: "Electricity", accuracy: 74, trend: "up", category: "moderate" },
  { topic: "Chemical Bonding", accuracy: 68, trend: "down", category: "moderate" },
  { topic: "Organic Chemistry", accuracy: 52, trend: "down", category: "weak" },
  { topic: "Probability", accuracy: 48, trend: "up", category: "weak" },
  { topic: "Electromagnetic Induction", accuracy: 42, trend: "down", category: "weak" },
];

const overallStats = [
  { label: "Average Accuracy", value: "67%", change: "+4% this week" },
  { label: "Topics Mastered", value: "8/24", change: "+2 this month" },
  { label: "Quizzes Taken", value: "34", change: "12 this week" },
  { label: "Study Hours", value: "28h", change: "+6h vs last week" },
];

export default function AnalyticsPage() {
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
          {overallStats.map((stat, i) => (
            <div key={i} className="glass-card p-5 animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-xs text-success font-medium mt-1">{stat.change}</p>
            </div>
          ))}
        </div>

        {/* Topic Accuracy */}
        <div className="glass-card p-6 md:p-8 animate-fade-in" style={{ animationDelay: "200ms" }}>
          <h2 className="text-lg font-semibold text-foreground mb-6">Topic-wise Accuracy</h2>
          <div className="space-y-4">
            {topicData.map((item, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-48 flex-shrink-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.topic}</p>
                </div>
                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-700",
                      item.category === "strong" ? "bg-success" :
                      item.category === "moderate" ? "bg-warning" : "bg-destructive/70"
                    )}
                    style={{ width: `${item.accuracy}%` }}
                  />
                </div>
                <div className="flex items-center gap-2 w-20 justify-end">
                  <span className="text-sm font-semibold text-foreground">{item.accuracy}%</span>
                  {item.trend === "up" ? (
                    <TrendingUp className="w-3.5 h-3.5 text-success" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5 text-destructive" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Strength areas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: "300ms" }}>
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success" /> Strong Areas
            </h3>
            <div className="space-y-2">
              {topicData.filter(t => t.category === "strong").map((t, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-success-soft/50 rounded-xl">
                  <span className="text-sm font-medium text-foreground">{t.topic}</span>
                  <span className="text-sm font-bold text-success">{t.accuracy}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: "400ms" }}>
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-destructive" /> Needs Improvement
            </h3>
            <div className="space-y-2">
              {topicData.filter(t => t.category === "weak").map((t, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-danger-soft/50 rounded-xl">
                  <span className="text-sm font-medium text-foreground">{t.topic}</span>
                  <span className="text-sm font-bold text-destructive">{t.accuracy}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
