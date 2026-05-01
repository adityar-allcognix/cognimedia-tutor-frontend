import { useEffect, useState } from "react";

import { AppLayout } from "@/components/AppLayout";
import { getParentChildrenProgress, linkChildToParent } from "@/lib/api";

export default function ParentProgressPage() {
  const [studentEmail, setStudentEmail] = useState("");
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getParentChildrenProgress();
      setChildren(data.children || []);
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

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Children Progress</h1>
          <p className="text-muted-foreground">Track mastery and consistency for linked students.</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {children.map((child) => (
              <div key={child.user_id} className="rounded-xl border bg-card p-4">
                <h3 className="font-semibold text-foreground">{child.full_name || child.email}</h3>
                <p className="text-sm text-muted-foreground mb-3">Class {child.grade}</p>
                <div className="space-y-1 text-sm">
                  <p>Learning streak: <strong>{child.learning_streak} days</strong></p>
                  <p>Total points: <strong>{child.total_points}</strong></p>
                  <p>Completed chapters: <strong>{child.completed_chapters}</strong></p>
                  <p>Average mastery: <strong>{Math.round((child.avg_mastery || 0) * 100)}%</strong></p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
