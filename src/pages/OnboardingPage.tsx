import { useEffect, useMemo, useState } from "react";

import { AppLayout } from "@/components/AppLayout";
import {
  getTeacherClassRoster,
  getTeacherStudentProgress,
  onboardUser,
  onboardUsersBulk,
  onboardUsersBulkFile,
  type TeacherClassRoster,
  type TeacherStudentProgress,
} from "@/lib/api";
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
  const [roster, setRoster] = useState<TeacherClassRoster | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [studentProgress, setStudentProgress] = useState<TeacherStudentProgress | null>(null);
  const [studentProgressLoading, setStudentProgressLoading] = useState(false);
  const [studentProgressError, setStudentProgressError] = useState<string | null>(null);

  const availableRoles = useMemo(
    () => (isAdmin ? ["teacher", "student", "parent"] : ["student", "parent"]),
    [isAdmin]
  );
  const selectedRosterStudent = useMemo(
    () => roster?.students.find((item) => item.student_user_id === selectedStudentId) || null,
    [roster, selectedStudentId]
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
      if (data.students.length === 0) {
        setSelectedStudentId(null);
        setStudentProgress(null);
        return;
      }
      const selectedStillVisible = data.students.some((item) => item.student_user_id === selectedStudentId);
      const targetStudentId = selectedStillVisible ? selectedStudentId : data.students[0].student_user_id;
      await loadStudentProgress(targetStudentId);
    } catch (err: any) {
      setRosterError(err?.response?.data?.detail || "Failed to load class roster");
    } finally {
      setRosterLoading(false);
    }
  };

  const loadStudentProgress = async (studentUserId: string | null) => {
    if (!studentUserId) return;
    setSelectedStudentId(studentUserId);
    setStudentProgressLoading(true);
    setStudentProgressError(null);
    try {
      const data = await getTeacherStudentProgress(studentUserId);
      setStudentProgress(data);
    } catch (err: any) {
      setStudentProgress(null);
      setStudentProgressError(err?.response?.data?.detail || "Failed to load student progress");
    } finally {
      setStudentProgressLoading(false);
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

        {/* <form onSubmit={onSubmit} className="rounded-xl border bg-card p-4 space-y-3">
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
        </form> */}

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
          <div className="rounded-xl border bg-card p-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold text-foreground">My Class Students</h2>
              <button
                type="button"
                onClick={loadTeacherRoster}
                className="text-xs px-2 py-1 rounded-md border text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                Refresh
              </button>
            </div>
            {rosterLoading ? (
              <p className="text-sm text-muted-foreground">Loading class roster...</p>
            ) : rosterError ? (
              <p className="text-sm text-destructive">{rosterError}</p>
            ) : !roster || !roster.students || roster.students.length === 0 ? (
              <p className="text-sm text-muted-foreground">No students found for your class yet.</p>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Class {roster.class_grade} | {roster.student_count} student{roster.student_count === 1 ? "" : "s"}
                </p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {roster.students.map((student) => (
                      <button
                        type="button"
                        key={student.student_user_id}
                        onClick={() => loadStudentProgress(student.student_user_id)}
                        className={`w-full text-left rounded-lg border p-3 transition-colors ${
                          selectedStudentId === student.student_user_id
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted"
                        }`}
                      >
                        <p className="text-sm font-semibold text-foreground">{student.full_name || "Student"}</p>
                        <p className="text-xs text-muted-foreground">{student.email}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {student.parents?.length || 0} parent contact{(student.parents?.length || 0) === 1 ? "" : "s"}
                        </p>
                      </button>
                    ))}
                  </div>
                  <div className="rounded-lg border p-4 bg-muted/20">
                    {studentProgressLoading ? (
                      <p className="text-sm text-muted-foreground">Loading student progress...</p>
                    ) : studentProgressError ? (
                      <p className="text-sm text-destructive">{studentProgressError}</p>
                    ) : !studentProgress ? (
                      <p className="text-sm text-muted-foreground">Select a student to view progress.</p>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <p className="text-base font-semibold text-foreground">
                            {studentProgress.full_name || "Student"}
                          </p>
                          <p className="text-xs text-muted-foreground">{studentProgress.email}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="rounded-md border bg-card p-2">
                            <p className="text-xs text-muted-foreground">Learning streak</p>
                            <p className="font-semibold">{studentProgress.learning_streak} days</p>
                          </div>
                          <div className="rounded-md border bg-card p-2">
                            <p className="text-xs text-muted-foreground">Total points</p>
                            <p className="font-semibold">{studentProgress.total_points}</p>
                          </div>
                          <div className="rounded-md border bg-card p-2">
                            <p className="text-xs text-muted-foreground">Completed chapters</p>
                            <p className="font-semibold">{studentProgress.completed_chapters}</p>
                          </div>
                          <div className="rounded-md border bg-card p-2">
                            <p className="text-xs text-muted-foreground">Topics practiced</p>
                            <p className="font-semibold">{studentProgress.topics_practiced}</p>
                          </div>
                        </div>
                        <div className="rounded-md border bg-card p-2">
                          <p className="text-xs text-muted-foreground">Average mastery</p>
                          <p className="font-semibold">
                            {Math.round((studentProgress.avg_mastery || 0) * 100)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Parent contacts</p>
                          {selectedRosterStudent?.parents?.length ? (
                            <div className="space-y-1">
                              {selectedRosterStudent.parents.map((parent) => (
                                <p key={parent.parent_user_id} className="text-xs text-muted-foreground">
                                  {parent.full_name || "Parent"} ({parent.email})
                                </p>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">No parent linked yet.</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </AppLayout>
  );
}
