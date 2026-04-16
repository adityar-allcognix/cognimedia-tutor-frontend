import { useEffect, useState } from "react";
import {
  History,
  ClipboardList,
  FileText,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Clock,
  Loader2,
  Sparkles,
  Zap,
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { cn } from "@/lib/utils";
import { getHistory } from "@/lib/api";
import { getCurrentUserId } from "@/lib/user";

const getToolIcon = (toolName: string) => {
  switch (toolName.toLowerCase()) {
    case 'quiz generator': return ClipboardList;
    case 'notes generator': return FileText;
    case 'lesson planner': return BookOpen;
    case 'flashcard generator': return Zap;
    default: return Sparkles;
  }
};

export default function HistoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const userId = getCurrentUserId();

  useEffect(() => {
    const fetchHistory = async () => {
      if (!userId) return;
      try {
        setLoading(true);
        const res = await getHistory(userId);
        if (res.status === "success") {
          setItems(res.items);
        }
      } catch (error) {
        console.error("Failed to fetch history:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [userId]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-screen">
          <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Retrieving your learning history...</p>
        </div>
      </AppLayout>
    );
  }

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
          {items.map((item, i) => {
            const Icon = getToolIcon(item.tool_name);
            const isExpanded = expanded === item.id;
            return (
              <div
                key={item.id}
                className="glass-card overflow-hidden animate-fade-in"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <button
                  onClick={() => setExpanded(isExpanded ? null : item.id)}
                  className="w-full flex items-center gap-4 p-5 text-left hover:bg-muted/20 transition-colors duration-200"
                >
                  <div className="w-10 h-10 rounded-xl bg-lavender/60 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{item.topic}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-primary font-medium">{item.tool_name}</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : "Recently"}
                      </span>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  )}
                </button>
                {isExpanded && (
                  <div className="px-5 pb-5 animate-fade-in">
                    <div className="p-4 bg-muted/30 rounded-xl max-h-96 overflow-y-auto">
                      <pre className="text-xs text-foreground/80 whitespace-pre-wrap font-sans">
                        {JSON.stringify(item.generated_content, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {items.length === 0 && (
            <div className="text-center py-20 bg-card/30 rounded-2xl border border-dashed border-border">
              <History className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
              <p className="text-muted-foreground">No history items found. Start exploring AI tools!</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
