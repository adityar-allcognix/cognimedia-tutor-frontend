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
};

export const signup = async (payload: AuthPayload) => {
  const { data } = await api.post('/auth/signup', payload);
  return data;
};

export const login = async (payload: { email: string; password: string }) => {
  const { data } = await api.post('/auth/login', payload);
  return data;
};

export const getCurrentUser = async () => {
  const { data } = await api.get('/auth/me');
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

export const learnChapterTopic = async (payload: { user_id: string; grade: number; subject: string; chapter_id: string; chapter_name?: string; topic?: string }) => {
  const { data } = await api.post('/learning/chapter/learn', payload);
  return data;
};

export const submitQuizScore = async (payload: { user_id: string; topic: string; total_questions: number; correct_answers: number }) => {
  const { data } = await api.post('/personalization/submit-quiz', payload);
  return data;
};
