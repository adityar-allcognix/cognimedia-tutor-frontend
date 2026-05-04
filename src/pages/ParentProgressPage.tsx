import { useEffect, useState } from "react";

import { AppLayout } from "@/components/AppLayout";
import { getParentChildrenProgress, linkChildToParent } from "@/lib/api";

export default function ParentProgressPage() {
  const [studentEmail, setStudentEmail] = useState("");
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getParentChildrenProgress();
      const items = data.children || [];
      setChildren(items);
      if (!items.length) {
        setSelectedChildId(null);
      } else if (!items.some((child: any) => child.user_id === selectedChildId)) {
        setSelectedChildId(items[0].user_id);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    await linkChildToParent({ student_email: studentEmail });
    setStudentEmail("");
    await loadData();
  };

  const linkedChildren = children.length;
  const totalPoints = children.reduce((sum, child) => sum + (child.total_points || 0), 0);
  const totalCompletedChapters = children.reduce((sum, child) => sum + (child.completed_chapters || 0), 0);
  const avgMasteryAcrossChildren = linkedChildren > 0
    ? Math.round(
      (children.reduce((sum, child) => sum + (child.avg_mastery || 0), 0) / linkedChildren) * 100
    )
    : 0;
  const attentionNeededChildren = children.filter(
    (child) => (child.avg_mastery || 0) < 0.5 || (child.learning_streak || 0) < 2
  );
  const bestConsistencyChild = children.reduce(
    (best, child) => ((child.learning_streak || 0) > (best?.learning_streak || 0) ? child : best),
    children[0] || null
  );
  const bestMasteryChild = children.reduce(
    (best, child) => ((child.avg_mastery || 0) > (best?.avg_mastery || 0) ? child : best),
    children[0] || null
  );
  const selectedChild =
    children.find((child) => child.user_id === selectedChildId) || children[0] || null;

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Children Progress</h1>
          <p className="text-muted-foreground">Track mastery, consistency, and follow-up actions for linked students.</p>
        </div>

        <form onSubmit={handleLink} className="rounded-xl border bg-card p-4 flex flex-col md:flex-row gap-2">
          <input
            className="flex-1 rounded-md border px-3 py-2"
            placeholder="Child email"
            value={studentEmail}
            onChange={(e) => setStudentEmail(e.target.value)}
            required
          />
          <button className="px-4 py-2 rounded-md bg-primary text-primary-foreground" type="submit">Link Child</button>
        </form>

        {loading ? (
          <p className="text-muted-foreground">Loading child progress...</p>
        ) : children.length === 0 ? (
          <p className="text-muted-foreground">No linked children yet.</p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="rounded-xl border bg-card p-4">
                <p className="text-xs text-muted-foreground">Linked Children</p>
                <p className="text-2xl font-bold text-foreground">{linkedChildren}</p>
              </div>
              <div className="rounded-xl border bg-card p-4">
                <p className="text-xs text-muted-foreground">Average Mastery</p>
                <p className="text-2xl font-bold text-foreground">{avgMasteryAcrossChildren}%</p>
              </div>
              <div className="rounded-xl border bg-card p-4">
                <p className="text-xs text-muted-foreground">Completed Chapters</p>
                <p className="text-2xl font-bold text-foreground">{totalCompletedChapters}</p>
              </div>
              <div className="rounded-xl border bg-card p-4">
                <p className="text-xs text-muted-foreground">Total Points</p>
                <p className="text-2xl font-bold text-foreground">{totalPoints}</p>
              </div>
            </div>

            <div className="rounded-xl border bg-card p-4">
              <h2 className="font-semibold text-foreground">Attention Needed</h2>
              <p className="text-xs text-muted-foreground mb-3">Children with low mastery (&lt;50%) or low streak (&lt;2 days).</p>
              {attentionNeededChildren.length === 0 ? (
                <p className="text-sm text-muted-foreground">No urgent follow-ups right now.</p>
              ) : (
                <div className="space-y-2">
                  {attentionNeededChildren.map((child) => (
                    <div key={child.user_id} className="rounded-lg border p-2">
                      <p className="text-sm font-medium text-foreground">{child.full_name || child.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Mastery {Math.round((child.avg_mastery || 0) * 100)}% | Streak {child.learning_streak || 0} day(s)
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-xl border bg-card p-4">
                <p className="text-xs text-muted-foreground">Best Consistency</p>
                <p className="text-sm font-semibold text-foreground mt-1">
                  {bestConsistencyChild ? (bestConsistencyChild.full_name || bestConsistencyChild.email) : "N/A"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {bestConsistencyChild ? `${bestConsistencyChild.learning_streak || 0} day streak` : ""}
                </p>
              </div>
              <div className="rounded-xl border bg-card p-4">
                <p className="text-xs text-muted-foreground">Best Mastery</p>
                <p className="text-sm font-semibold text-foreground mt-1">
                  {bestMasteryChild ? (bestMasteryChild.full_name || bestMasteryChild.email) : "N/A"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {bestMasteryChild ? `${Math.round((bestMasteryChild.avg_mastery || 0) * 100)}% mastery` : ""}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-xl border bg-card p-4 space-y-2 max-h-96 overflow-y-auto pr-1">
                <h2 className="font-semibold text-foreground">Children Overview</h2>
                {children.map((child) => (
                  <button
                    type="button"
                    key={child.user_id}
                    onClick={() => setSelectedChildId(child.user_id)}
                    className={`w-full text-left rounded-lg border p-3 transition-colors ${
                      selectedChildId === child.user_id
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted"
                    }`}
                  >
                    <p className="text-sm font-semibold text-foreground">{child.full_name || child.email}</p>
                    <p className="text-xs text-muted-foreground">Class {child.grade}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Mastery {Math.round((child.avg_mastery || 0) * 100)}% | Chapters {child.completed_chapters}
                    </p>
                  </button>
                ))}
              </div>

              <div className="rounded-xl border bg-card p-4">
                <h2 className="font-semibold text-foreground mb-3">Selected Child Details</h2>
                {!selectedChild ? (
                  <p className="text-sm text-muted-foreground">Select a child to view details.</p>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <p className="text-base font-semibold text-foreground">{selectedChild.full_name || selectedChild.email}</p>
                      <p className="text-xs text-muted-foreground">{selectedChild.email} | Class {selectedChild.grade}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="rounded-md border p-2">
                        <p className="text-xs text-muted-foreground">Learning streak</p>
                        <p className="font-semibold">{selectedChild.learning_streak} days</p>
                      </div>
                      <div className="rounded-md border p-2">
                        <p className="text-xs text-muted-foreground">Total points</p>
                        <p className="font-semibold">{selectedChild.total_points}</p>
                      </div>
                      <div className="rounded-md border p-2">
                        <p className="text-xs text-muted-foreground">Completed chapters</p>
                        <p className="font-semibold">{selectedChild.completed_chapters}</p>
                      </div>
                      <div className="rounded-md border p-2">
                        <p className="text-xs text-muted-foreground">Average mastery</p>
                        <p className="font-semibold">{Math.round((selectedChild.avg_mastery || 0) * 100)}%</p>
                      </div>
                    </div>
                    <div className="rounded-md border p-2">
                      <p className="text-xs text-muted-foreground mb-1">Mastery Progress</p>
                      <div className="w-full h-2 rounded bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${Math.max(0, Math.min(100, Math.round((selectedChild.avg_mastery || 0) * 100)))}%` }}
                        />
                      </div>
                    </div>
                    <div className="rounded-md border p-2">
                      <p className="text-xs text-muted-foreground mb-1">Parent Action Suggestion</p>
                      <p className="text-sm text-foreground">
                        {(selectedChild.avg_mastery || 0) < 0.5
                          ? "Schedule a short daily revision block and ask the child to retake a quiz on weak topics."
                          : (selectedChild.learning_streak || 0) < 2
                            ? "Focus on consistency: encourage one short learning session every day."
                            : "Current progress looks healthy. Encourage continued practice and chapter completion."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
