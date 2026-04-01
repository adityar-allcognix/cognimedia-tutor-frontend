import {
  BookOpen,
  Target,
  Flame,
  AlertTriangle,
  ArrowRight,
  Play,
  Zap,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/AppLayout";
import { Link } from "react-router-dom";

const progressCards = [
  {
    label: "Chapters Completed",
    value: "12",
    total: "/24",
    icon: BookOpen,
    color: "bg-sky/60",
    iconColor: "text-accent-foreground",
  },
  {
    label: "Accuracy",
    value: "78",
    total: "%",
    icon: Target,
    color: "bg-lavender/60",
    iconColor: "text-primary",
  },
  {
    label: "Learning Streak",
    value: "5",
    total: " days",
    icon: Flame,
    color: "bg-warning-soft",
    iconColor: "text-warning",
  },
];

const weakTopics = [
  { topic: "Electromagnetic Induction", subject: "Physics", accuracy: 42 },
  { topic: "Organic Chemistry – Reactions", subject: "Chemistry", accuracy: 38 },
  { topic: "Probability", subject: "Mathematics", accuracy: 51 },
];

const recommendations = [
  {
    type: "Revise",
    title: "Light – Reflection & Refraction",
    subject: "Physics",
    icon: BookOpen,
  },
  {
    type: "Quiz",
    title: "Electricity – Practice Test",
    subject: "Physics",
    icon: Zap,
  },
  {
    type: "Learn",
    title: "Chemical Reactions & Equations",
    subject: "Chemistry",
    icon: Play,
  },
];

const recentActivity = [
  { action: "Completed quiz", topic: "Newton's Laws of Motion", time: "2 hours ago", score: "8/10" },
  { action: "Studied chapter", topic: "Acids, Bases & Salts", time: "5 hours ago", score: null },
  { action: "Completed quiz", topic: "Linear Equations", time: "Yesterday", score: "7/10" },
];

export default function Dashboard() {
  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12">
        {/* Welcome */}
        <div className="mb-10 animate-fade-in">
          <p className="text-sm font-medium text-muted-foreground mb-1">Good morning, Arjun</p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Let's continue mastering <span className="text-primary">Physics</span>.
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
              <h2 className="text-lg font-semibold text-foreground">Weak Topics</h2>
            </div>
            {weakTopics.map((topic) => (
              <div
                key={topic.topic}
                className="glass-card p-4 border-l-4 border-l-warning/60 hover:shadow-lg transition-shadow duration-300"
              >
                <p className="font-semibold text-sm text-foreground">{topic.topic}</p>
                <p className="text-xs text-muted-foreground mb-3">{topic.subject} · {topic.accuracy}% accuracy</p>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full bg-warning rounded-full transition-all duration-500"
                    style={{ width: `${topic.accuracy}%` }}
                  />
                </div>
                <Button variant="soft" size="sm" className="w-full text-xs">
                  Focus Now <ArrowRight className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>

          {/* Recommended Path */}
          <div className="lg:col-span-1 space-y-3 animate-fade-in" style={{ animationDelay: "300ms" }}>
            <h2 className="text-lg font-semibold text-foreground mb-1">Recommended Path</h2>
            {recommendations.map((rec, i) => (
              <Link key={i} to="/learn">
                <div className="glass-card p-4 hover:shadow-lg transition-all duration-300 group cursor-pointer mb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-lavender/60 flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200">
                      <rec.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-primary">{rec.type}</span>
                      <p className="font-semibold text-sm text-foreground">{rec.title}</p>
                      <p className="text-xs text-muted-foreground">{rec.subject}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-200 mt-2" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-1 animate-fade-in" style={{ animationDelay: "400ms" }}>
            <h2 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h2>
            <div className="glass-card p-5">
              <div className="space-y-4">
                {recentActivity.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{item.action}</p>
                      <p className="text-xs text-muted-foreground">{item.topic}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{item.time}</span>
                        {item.score && (
                          <span className="text-xs font-semibold text-primary ml-auto">{item.score}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
