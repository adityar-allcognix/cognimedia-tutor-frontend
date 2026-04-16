import { useEffect, useState } from "react";
import {
  BookOpen,
  Target,
  Flame,
  AlertTriangle,
  ArrowRight,
  Play,
  Zap,
  Clock,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/AppLayout";
import { Link } from "react-router-dom";
import { getAnalytics, getHistory, getRecommendations } from "@/lib/api";
import { getUser, getCurrentUserId } from "@/lib/user";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  const user = getUser();
  const userId = getCurrentUserId();

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!userId) return;
      try {
        setLoading(true);
        const [analyticsRes, recRes, historyRes] = await Promise.all([
          getAnalytics(userId),
          getRecommendations(userId),
          getHistory(userId, 5)
        ]);

        if (analyticsRes.status === "success") setAnalytics(analyticsRes.data);
        setRecommendations(recRes);
        if (historyRes.status === "success") setHistory(historyRes.items);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [userId]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-screen">
          <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Personalizing your dashboard...</p>
        </div>
      </AppLayout>
    );
  }

  const progressCards = [
    {
      label: "Chapters Completed",
      value: analytics?.completed_chapters || "0",
      total: `/${analytics?.total_chapters || '24'}`,
      icon: BookOpen,
      color: "bg-sky/60",
      iconColor: "text-accent-foreground",
    },
    {
      label: "Accuracy",
      value: Math.round((analytics?.avg_mastery || 0) * 100),
      total: "%",
      icon: Target,
      color: "bg-lavender/60",
      iconColor: "text-primary",
    },
    {
      label: "Learning Streak",
      value: analytics?.learning_streak || "0",
      total: " days",
      icon: Flame,
      color: "bg-warning-soft",
      iconColor: "text-warning",
    },
  ];

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12">
        {/* Welcome */}
        <div className="mb-10 animate-fade-in">
          <p className="text-sm font-medium text-muted-foreground mb-1">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.full_name?.split(' ')[0] || 'Student'}
          </p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            {analytics?.total_runs > 0
              ? <>Let's continue mastering <span className="text-primary">{analytics?.strongest_topic?.topic || 'Physics'}</span>.</>
              : <>Welcome to <span className="text-primary">CogniMentor</span>. Let's start learning!</>
            }
          </h1>
        </div>

        {/* Progress Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {progressCards.map((card, i) => (
            <div
              key={card.label}
              className="glass-card p-6 flex items-center gap-4 animate-fade-in"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className={`w-12 h-12 rounded-2xl ${card.color} flex items-center justify-center`}>
                <card.icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {card.value}
                  <span className="text-base font-medium text-muted-foreground">{card.total}</span>
                </p>
                <p className="text-sm text-muted-foreground">{card.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Weak Topics */}
          <div className="lg:col-span-1 space-y-3 animate-fade-in" style={{ animationDelay: "200ms" }}>
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <h2 className="text-lg font-semibold text-foreground">Focus Areas</h2>
            </div>
            {analytics?.weakest_topic ? (
              <div
                className="glass-card p-4 border-l-4 border-l-warning/60 hover:shadow-lg transition-shadow duration-300"
              >
                <p className="font-semibold text-sm text-foreground">{analytics.weakest_topic.topic}</p>
                <p className="text-xs text-muted-foreground mb-3">Topic Mastery: {Math.round(analytics.weakest_topic.mastery * 100)}%</p>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full bg-warning rounded-full transition-all duration-500"
                    style={{ width: `${analytics.weakest_topic.mastery * 100}%` }}
                  />
                </div>
                <Link to="/learn">
                  <Button variant="soft" size="sm" className="w-full text-xs">
                    Improve Now <ArrowRight className="w-3 h-3 ml-2" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="glass-card p-6 text-center">
                <Target className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No weak topics identified yet. Start learning to see insights!</p>
              </div>
            )}
          </div>

          {/* Recommended Path */}
          <div className="lg:col-span-1 space-y-3 animate-fade-in" style={{ animationDelay: "300ms" }}>
            <h2 className="text-lg font-semibold text-foreground mb-1">Personalized Path</h2>
            {recommendations ? (
              <Link to={recommendations.recommended_tool === 'chapter_learn' ? '/learn' : '/ai-tools'}>
                <div className="glass-card p-4 hover:shadow-lg transition-all duration-300 group cursor-pointer mb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-lavender/60 flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200">
                      {recommendations.recommended_tool === 'quiz' ? <Zap className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                    </div>
                    <div className="flex-1">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-primary">Recommendation</span>
                      <p className="font-semibold text-sm text-foreground">{recommendations.recommended_topic}</p>
                      <p className="text-xs text-muted-foreground">{recommendations.reasoning}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-200 mt-2" />
                  </div>
                </div>
              </Link>
            ) : (
              <div className="glass-card p-4 border border-dashed text-center py-10">
                <Sparkles className="w-8 h-8 text-primary/20 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Calculating your next best step...</p>
              </div>
            )}
            <Link to="/learn" className="block text-center pt-2">
              <span className="text-xs font-semibold text-primary hover:underline">Explore Syllabus →</span>
            </Link>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-1 animate-fade-in" style={{ animationDelay: "400ms" }}>
            <h2 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h2>
            <div className="glass-card p-5">
              <div className="space-y-4">
                {history.length > 0 ? history.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{item.tool_name}</p>
                      <p className="text-xs text-muted-foreground">{item.topic}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8">
                    <Clock className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">No recent activity. Let's build something!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
