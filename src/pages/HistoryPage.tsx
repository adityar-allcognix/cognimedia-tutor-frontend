import { useState } from "react";
import {
  History,
  ClipboardList,
  FileText,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Clock,
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { cn } from "@/lib/utils";

const historyItems = [
  {
    id: 1,
    topic: "Electricity – Ohm's Law",
    tool: "Quiz Generator",
    icon: ClipboardList,
    timestamp: "Today, 2:30 PM",
    detail: "Generated 5 MCQ questions on Ohm's Law for Class 10 at Medium difficulty. Score: 4/5.",
  },
  {
    id: 2,
    topic: "Chemical Reactions & Equations",
    tool: "Notes Generator",
    icon: FileText,
    timestamp: "Today, 11:15 AM",
    detail: "Generated concise revision notes covering types of chemical reactions, balancing equations, and key examples.",
  },
  {
    id: 3,
    topic: "Light – Reflection & Refraction",
    tool: "Lesson Planner",
    icon: BookOpen,
    timestamp: "Yesterday, 4:45 PM",
    detail: "Created a 45-minute lesson plan with introduction, core concepts, demo, and practice segments.",
  },
  {
    id: 4,
    topic: "Linear Equations in Two Variables",
    tool: "Quiz Generator",
    icon: ClipboardList,
    timestamp: "Yesterday, 10:00 AM",
    detail: "Generated 8 practice questions covering graphical and algebraic methods. Score: 6/8.",
  },
  {
    id: 5,
    topic: "Heredity and Evolution",
    tool: "Notes Generator",
    icon: FileText,
    timestamp: "2 days ago",
    detail: "Generated study notes on Mendel's laws, dominant/recessive traits, and evolution theories.",
  },
];

export default function HistoryPage() {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <History className="w-5 h-5 text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">History</h1>
          </div>
          <p className="text-muted-foreground">Review your past learning sessions and generated content.</p>
        </div>

        <div className="space-y-3">
          {historyItems.map((item, i) => (
            <div
              key={item.id}
              className="glass-card overflow-hidden animate-fade-in"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <button
                onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                className="w-full flex items-center gap-4 p-5 text-left hover:bg-muted/20 transition-colors duration-200"
              >
                <div className="w-10 h-10 rounded-xl bg-lavender/60 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">{item.topic}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-primary font-medium">{item.tool}</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{item.timestamp}</span>
                  </div>
                </div>
                {expanded === item.id ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                )}
              </button>
              {expanded === item.id && (
                <div className="px-5 pb-5 animate-fade-in">
                  <div className="p-4 bg-muted/30 rounded-xl">
                    <p className="text-sm text-foreground/80 leading-relaxed">{item.detail}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
