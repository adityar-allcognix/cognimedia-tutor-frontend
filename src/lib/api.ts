import axios from 'axios';
import { getAccessToken } from './auth';

export const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export type AuthPayload = {
  email: string;
  password: string;
  full_name?: string;
  grade?: number;
  role?: "school_admin" | "teacher" | "student" | "parent";
  school_name?: string;
  school_code?: string;
  identifier?: string;
  admin_verification_code?: string;
};

export type RoleResolvePayload = {
  school_code: string;
  identifier: string;
};

export type RoleResolveResponse = {
  role: "teacher" | "student" | "parent";
  grade?: number | null;
  school_name: string;
  school_code: string;
};

export const signup = async (payload: AuthPayload) => {
  const { data } = await api.post('/auth/signup', payload);
  return data;
};

export const login = async (payload: { email: string; password: string }) => {
  const { data } = await api.post('/auth/login', payload);
  return data;
};

export const resolveRole = async (payload: RoleResolvePayload): Promise<RoleResolveResponse> => {
  const { data } = await api.post('/auth/resolve-role', payload);
  return data;
};

export const getCurrentUser = async () => {
  const { data } = await api.get('/auth/me');
  return data;
};

export const createSchoolSubscriptionRequest = async (payload: { note?: string }) => {
  const { data } = await api.post('/subscription/school/request', payload);
  return data;
};

export const getPendingSchoolSubscriptionRequests = async () => {
  const { data } = await api.get('/subscription/school/requests/pending');
  return data;
};

export const decideSchoolSubscriptionRequest = async (
  requestId: string,
  payload: { decision: "approve" | "reject"; note?: string }
) => {
  const { data } = await api.post(`/subscription/school/requests/${requestId}/decision`, payload);
  return data;
};

export const createStudyMaterial = async (payload: {
  title: string;
  subject: string;
  grade: number;
  description?: string;
  content_url?: string;
  content_text?: string;
}) => {
  const { data } = await api.post('/materials', payload);
  return data;
};

export const uploadStudyMaterial = async (payload: {
  title: string;
  subject: string;
  grade: number;
  description?: string;
  file: File;
}) => {
  const form = new FormData();
  form.append("title", payload.title);
  form.append("subject", payload.subject);
  form.append("grade", String(payload.grade));
  if (payload.description) {
    form.append("description", payload.description);
  }
  form.append("file", payload.file);

  const { data } = await api.post('/materials/upload', form, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return data;
};

export const getStudyMaterials = async () => {
  const { data } = await api.get('/materials');
  return data;
};

export const downloadStudyMaterial = async (materialId: string, fallbackName?: string) => {
  const response = await api.get(`/materials/${materialId}/download`, {
    responseType: "blob",
  });

  const header = response.headers["content-disposition"] as string | undefined;
  const filenameMatch = header?.match(/filename="?([^"]+)"?/i);
  const filename = filenameMatch?.[1] || fallbackName || "material";

  const blobUrl = window.URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
};

export const linkChildToParent = async (payload: { student_email: string }) => {
  const { data } = await api.post('/parent/link-child', payload);
  return data;
};

export const getParentChildrenProgress = async () => {
  const { data } = await api.get('/parent/children-progress');
  return data;
};

export const onboardUser = async (payload: {
  email: string;
  full_name?: string;
  role: "teacher" | "student" | "parent";
  grade?: number;
  student_email?: string;
}) => {
  const { data } = await api.post('/onboarding/users', payload);
  return data;
};

export const onboardUsersBulk = async (payload: {
  users: Array<{
    email: string;
    full_name?: string;
    role: "teacher" | "student" | "parent";
    grade?: number;
    student_email?: string;
  }>;
}) => {
  const { data } = await api.post('/onboarding/users/bulk', payload);
  return data;
};

export const onboardUsersBulkFile = async (file: File) => {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post('/onboarding/users/bulk-file', form, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return data;
};

export type TeacherClassParentContact = {
  parent_user_id: string;
  full_name: string | null;
  email: string;
};

export type TeacherClassStudent = {
  student_user_id: string;
  full_name: string | null;
  email: string;
  grade: number;
  parents: TeacherClassParentContact[];
};

export type TeacherClassRoster = {
  class_grade: number;
  student_count: number;
  students: TeacherClassStudent[];
};

export const getTeacherClassRoster = async (): Promise<TeacherClassRoster> => {
  const { data } = await api.get('/onboarding/teacher/class-roster');
  return data;
};

export type TeacherStudentProgress = {
  student_user_id: string;
  full_name: string | null;
  email: string;
  grade: number;
  learning_streak: number;
  total_points: number;
  completed_chapters: number;
  topics_practiced: number;
  avg_mastery: number;
};

export const getTeacherStudentProgress = async (
  studentUserId: string
): Promise<TeacherStudentProgress> => {
  const { data } = await api.get(`/onboarding/teacher/students/${studentUserId}/progress`);
  return data;
};

export type SchoolOverview = {
  school_id: string;
  total_users: number;
  role_counts: {
    teachers: number;
    students: number;
    parents: number;
  };
  pending_subscription_requests: number;
  approved_subscription_requests: number;
  rejected_subscription_requests: number;
  materials_count: number;
  recent_users: Array<{
    user_id: string;
    email: string;
    full_name: string | null;
    role: string;
    created_at: string;
  }>;
};

export const getSchoolOverview = async (): Promise<SchoolOverview> => {
  const { data } = await api.get('/onboarding/school/overview');
  return data;
};

export const getRecommendations = async (userId: string) => {
  const { data } = await api.get(`/personalization/recommendations/${userId}`);
  return data;
};

export const runTool = async (payload: any) => {
  const { data } = await api.post('/tools/run', payload);
  return data;
};

export const getHistory = async (userId: string, limit = 20) => {
  const { data } = await api.get(`/tools/history/${userId}?limit=${limit}`);
  return data;
};

export const getAnalytics = async (userId: string) => {
  const { data } = await api.get(`/tools/analytics/${userId}`);
  return data;
};
export const getSyllabus = async (grade: number, subject: string) => {
  const { data } = await api.get(`/learning/syllabus/${grade}/${subject}`);
  return data;
};

export const getAvailableSubjects = async (grade: number) => {
  const { data } = await api.get(`/learning/subjects/${grade}`);
  return data;
};

export const learnChapterTopic = async (payload: { user_id: string; grade: number; subject: string; chapter_id: string; chapter_name?: string; topic?: string; num_questions?: number }) => {
  const { data } = await api.post('/learning/chapter/learn', payload);
  return data;
};

export const submitQuizScore = async (payload: { user_id: string; topic: string; total_questions: number; correct_answers: number }) => {
  const { data } = await api.post('/personalization/submit-quiz', payload);
  return data;
};
