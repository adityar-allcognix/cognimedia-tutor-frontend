import { useEffect, useMemo, useState } from "react";

import { AppLayout } from "@/components/AppLayout";
import { getTeacherClassRoster, onboardUser, onboardUsersBulk, onboardUsersBulkFile } from "@/lib/api";
import { getUser } from "@/lib/user";

type OnboardRole = "teacher" | "student" | "parent";

export default function OnboardingPage() {
  const user = getUser();
  const isAdmin = user?.role === "school_admin";

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<OnboardRole>("student");
  const [grade, setGrade] = useState(10);
  const [studentEmail, setStudentEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<any | null>(null);
  const [bulkCsv, setBulkCsv] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkResult, setBulkResult] = useState<any | null>(null);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterError, setRosterError] = useState<string | null>(null);
  const [roster, setRoster] = useState<any | null>(null);

  const availableRoles = useMemo(
    () => (isAdmin ? ["teacher", "student", "parent"] : ["student", "parent"]),
    [isAdmin]
  );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setCreated(null);
    try {
      const payload: any = {
        email: email.trim().toLowerCase(),
        full_name: fullName.trim() || undefined,
        role,
      };
      if (role === "student") {
        payload.grade = grade;
      }
      if (role === "parent") {
        payload.student_email = studentEmail.trim().toLowerCase();
      }
      const result = await onboardUser(payload);
      setCreated(result);
      setEmail("");
      setFullName("");
      setStudentEmail("");
      setGrade(10);
      setRole("student");
      await loadTeacherRoster();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Onboarding failed");
    } finally {
      setLoading(false);
    }
  };

  const parseBulkCsv = () => {
    const rows = bulkCsv
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const users = rows.map((row) => {
      const [rawEmail, rawName, rawRole, rawGrade, rawStudentEmail] = row.split(",").map((x) => (x || "").trim());
      const roleValue = (rawRole || "student").toLowerCase() as OnboardRole;
      const userPayload: any = {
        email: rawEmail.toLowerCase(),
        full_name: rawName || undefined,
        role: roleValue,
      };
      if (roleValue === "student" && rawGrade) {
        userPayload.grade = Number(rawGrade);
      }
      if (roleValue === "parent" && rawStudentEmail) {
        userPayload.student_email = rawStudentEmail.toLowerCase();
      }
      return userPayload;
    });
    return users;
  };

  const onBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBulkLoading(true);
    setBulkError(null);
    setBulkResult(null);
    try {
      const users = parseBulkCsv();
      if (users.length === 0) {
        setBulkError("Add at least one CSV line");
        return;
      }
      const result = await onboardUsersBulk({ users });
      setBulkResult(result);
      await loadTeacherRoster();
    } catch (err: any) {
      setBulkError(err?.response?.data?.detail || "Bulk onboarding failed");
    } finally {
      setBulkLoading(false);
    }
  };

  const onBulkFileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBulkLoading(true);
    setBulkError(null);
    setBulkResult(null);
    try {
      if (!bulkFile) {
        setBulkError("Choose a CSV or XLSX file");
        return;
      }
      const result = await onboardUsersBulkFile(bulkFile);
      setBulkResult(result);
      await loadTeacherRoster();
    } catch (err: any) {
      setBulkError(err?.response?.data?.detail || "Bulk file onboarding failed");
    } finally {
      setBulkLoading(false);
    }
  };

  const loadTeacherRoster = async () => {
    if (user?.role !== "teacher") return;
    setRosterLoading(true);
    setRosterError(null);
    try {
      const data = await getTeacherClassRoster();
      setRoster(data);
    } catch (err: any) {
      setRosterError(err?.response?.data?.detail || "Failed to load class roster");
    } finally {
      setRosterLoading(false);
    }
  };

  useEffect(() => {
    loadTeacherRoster();
  }, [user?.role]);

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-12 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Onboarding</h1>
          <p className="text-muted-foreground">
            Create school users directly. Students and parents can be onboarded by admin or teacher. Teachers can be onboarded only by admin.
          </p>
        </div>

        <form onSubmit={onSubmit} className="rounded-xl border bg-card p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              className="w-full rounded-md border px-3 py-2"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <input
              className="w-full rounded-md border px-3 py-2"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <select
              className="w-full rounded-md border px-3 py-2"
              value={role}
              onChange={(e) => setRole(e.target.value as OnboardRole)}
            >
              {availableRoles.map((item) => (
                <option key={item} value={item}>
                  {item.charAt(0).toUpperCase() + item.slice(1)}
                </option>
              ))}
            </select>

            {role === "student" ? (
              <select
                className="w-full rounded-md border px-3 py-2"
                value={grade}
                onChange={(e) => setGrade(parseInt(e.target.value))}
              >
                {[6, 7, 8, 9, 10, 11, 12].map((g) => (
                  <option key={g} value={g}>Class {g}</option>
                ))}
              </select>
            ) : (
              <div className="text-sm text-muted-foreground flex items-center px-3">
                {role === "parent" ? "Parent is auto-linked to a student." : "Teacher account will be created in your school."}
              </div>
            )}
          </div>

          {role === "parent" ? (
            <input
              className="w-full rounded-md border px-3 py-2"
              type="email"
              placeholder="Student Email (for auto-link)"
              value={studentEmail}
              onChange={(e) => setStudentEmail(e.target.value)}
              required
            />
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <button
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground disabled:opacity-60"
            type="submit"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create User"}
          </button>
        </form>

        {created ? (
          <div className="rounded-xl border bg-card p-4 space-y-2">
            <p className="font-semibold text-foreground">User Created</p>
            <p className="text-sm text-muted-foreground">
              {created.user.email} ({created.user.role})
            </p>
            <p className="text-sm text-foreground">
              Temporary password: <span className="font-mono font-semibold">{created.temporary_password}</span>
            </p>
            {created.linked_student_email ? (
              <p className="text-sm text-muted-foreground">
                Linked student: {created.linked_student_email}
              </p>
            ) : null}
          </div>
        ) : null}

        <form onSubmit={onBulkSubmit} className="rounded-xl border bg-card p-4 space-y-3">
          <div>
            <h2 className="font-semibold text-foreground">Bulk Onboarding (CSV)</h2>
            <p className="text-xs text-muted-foreground">
              Format per line: email,full_name,role,grade,student_email
            </p>
            <p className="text-xs text-muted-foreground">
              For teacher: grade/student_email can be blank. For student: add grade. For parent: add student_email.
            </p>
          </div>
          <textarea
            className="w-full rounded-md border px-3 py-2 font-mono text-sm"
            rows={8}
            placeholder="student1@avm.edu,Student One,student,10,\nparent1@avm.edu,Parent One,parent,,student1@avm.edu"
            value={bulkCsv}
            onChange={(e) => setBulkCsv(e.target.value)}
          />
          {bulkError ? <p className="text-sm text-destructive">{bulkError}</p> : null}
          <button
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground disabled:opacity-60"
            type="submit"
            disabled={bulkLoading}
          >
            {bulkLoading ? "Creating..." : "Create Bulk Users"}
          </button>
        </form>

        <form onSubmit={onBulkFileSubmit} className="rounded-xl border bg-card p-4 space-y-3">
          <div>
            <h2 className="font-semibold text-foreground">Bulk Onboarding (CSV/XLSX File)</h2>
            <p className="text-xs text-muted-foreground">
              Header columns: email, full_name, role, grade, student_email
            </p>
          </div>
          <label
            htmlFor="bulk-file-upload"
            className="block rounded-lg border border-dashed border-border bg-muted/30 p-4 cursor-pointer hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">Choose CSV or XLSX file</p>
                <p className="text-xs text-muted-foreground">Click to browse from your device</p>
              </div>
              <span className="text-xs px-2 py-1 rounded-md border bg-background text-muted-foreground">
                .csv / .xlsx
              </span>
            </div>
            {bulkFile ? (
              <p className="mt-2 text-xs text-foreground">
                Selected: <span className="font-medium">{bulkFile.name}</span>
              </p>
            ) : null}
          </label>
          <input
            id="bulk-file-upload"
            className="hidden"
            type="file"
            accept=".csv,.xlsx"
            onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
          />
          <button
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground disabled:opacity-60"
            type="submit"
            disabled={bulkLoading}
          >
            {bulkLoading ? "Uploading..." : "Upload And Onboard"}
          </button>
        </form>

        {bulkResult ? (
          <div className="rounded-xl border bg-card p-4 space-y-2">
            <p className="font-semibold text-foreground">
              Bulk Result: {bulkResult.created}/{bulkResult.total} created, {bulkResult.failed} failed
            </p>
            <div className="space-y-1">
              {bulkResult.results.map((item: any, idx: number) => (
                <p key={`${item.email}-${idx}`} className="text-xs text-muted-foreground">
                  {item.email} ({item.role}) - {item.status}
                  {item.temporary_password ? ` | temp password: ${item.temporary_password}` : ""}
                  {item.error ? ` | error: ${item.error}` : ""}
                </p>
              ))}
            </div>
          </div>
        ) : null}

        {user?.role === "teacher" ? (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <h2 className="font-semibold text-foreground">My Class Students & Parent Contacts</h2>
            {rosterLoading ? (
              <p className="text-sm text-muted-foreground">Loading class roster...</p>
            ) : rosterError ? (
              <p className="text-sm text-destructive">{rosterError}</p>
            ) : !roster || !roster.students || roster.students.length === 0 ? (
              <p className="text-sm text-muted-foreground">No students found for your class yet.</p>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">Class {roster.class_grade}</p>
                {roster.students.map((student: any) => (
                  <div key={student.student_user_id} className="rounded-lg border p-3">
                    <p className="text-sm font-semibold text-foreground">
                      {student.full_name || "Student"} ({student.email})
                    </p>
                    <p className="text-xs text-muted-foreground">Class {student.grade}</p>
                    {student.parents?.length ? (
                      <div className="mt-2 space-y-1">
                        {student.parents.map((parent: any) => (
                          <p key={parent.parent_user_id} className="text-xs text-muted-foreground">
                            Parent: {parent.full_name || "Parent"} ({parent.email})
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-2">No parent linked yet.</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </AppLayout>
  );
}
