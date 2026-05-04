import { useEffect, useState } from "react";

import { AppLayout } from "@/components/AppLayout";
import {
  decideSchoolSubscriptionRequest,
  getPendingSchoolSubscriptionRequests,
} from "@/lib/api";

export default function SchoolAdminPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPendingSchoolSubscriptionRequests();
      setItems(data.items || []);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to load approval queue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onDecision = async (requestId: string, decision: "approve" | "reject") => {
    try {
      await decideSchoolSubscriptionRequest(requestId, { decision });
      await loadData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Could not update request");
    }
  };

  const studentRequests = items.filter((item) => item.target_role === "student").length;
  const teacherRequests = items.filter((item) => item.target_role === "teacher").length;

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12 space-y-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">School Subscription Approvals</h1>
        <p className="text-muted-foreground mb-8">Approve student and teacher requests covered in school annual fees.</p>

        {loading ? (
          <p className="text-muted-foreground">Loading requests...</p>
        ) : error ? (
          <p className="text-destructive">{error}</p>
        ) : items.length === 0 ? (
          <p className="text-muted-foreground">No pending requests.</p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-xl border bg-card p-4">
                <p className="text-xs text-muted-foreground">Pending Requests</p>
                <p className="text-2xl font-bold text-foreground">{items.length}</p>
              </div>
              <div className="rounded-xl border bg-card p-4">
                <p className="text-xs text-muted-foreground">Student Requests</p>
                <p className="text-2xl font-bold text-foreground">{studentRequests}</p>
              </div>
              <div className="rounded-xl border bg-card p-4">
                <p className="text-xs text-muted-foreground">Teacher Requests</p>
                <p className="text-2xl font-bold text-foreground">{teacherRequests}</p>
              </div>
            </div>

            {items.map((item) => (
              <div key={item.id} className="rounded-xl border bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{item.target_user_email}</p>
                    <p className="text-xs text-muted-foreground">Requested by: {item.requested_by_email}</p>
                    <p className="text-sm text-muted-foreground">Role: {item.target_role.replace("_", " ")}</p>
                    <p className="text-xs text-muted-foreground">
                      Requested on: {new Date(item.created_at).toLocaleDateString()}
                    </p>
                    {item.note ? <p className="text-sm mt-1 text-muted-foreground">Note: {item.note}</p> : null}
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-2 text-sm rounded-md bg-primary text-primary-foreground" onClick={() => onDecision(item.id, "approve")}>Approve</button>
                    <button className="px-3 py-2 text-sm rounded-md border" onClick={() => onDecision(item.id, "reject")}>Reject</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
