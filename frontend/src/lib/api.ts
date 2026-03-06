import axios from "axios";
import Cookies from "js-cookie";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { "Content-Type": "application/json" },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
    const token = Cookies.get("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle auth errors globally
api.interceptors.response.use(
    (res) => res,
    (error) => {
        if (error.response?.status === 401) {
            Cookies.remove("token");
            if (typeof window !== "undefined") {
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);

// ---- Auth ----
export const authAPI = {
    register: (data: { name: string; email: string; password: string }) =>
        api.post("/api/v1/auth/register", data),
    login: (data: { email: string; password: string }) =>
        api.post("/api/v1/auth/login", data),
    getMe: () => api.get("/api/v1/auth/me"),
    forgotPassword: (email: string) =>
        api.post("/api/v1/auth/forgot-password", { email }),
    resetPassword: (token: string, password: string) =>
        api.put(`/api/v1/auth/reset-password/${token}`, { password }),
};

// ---- AI Chat ----
export const chatAPI = {
    newChat: (data: { message: string; context?: string; level?: string }) =>
        api.post("/api/ai/chat/new", data),
    sendMessage: (data: { message: string; chatId: string; context?: string }) =>
        api.post("/api/ai/chat", data),
    getChats: () => api.get("/api/v1/chat"),
    getChat: (id: string) => api.get(`/api/v1/chat/${id}`),
    deleteChat: (id: string) => api.delete(`/api/v1/chat/${id}`),
    getRecommendations: () => api.get("/api/ai/recommendations"),
};

// ---- Skill Diagnosis ----
export const skillAPI = {
    startDiagnosis: (category: string) =>
        api.post("/api/v1/skills/diagnose/start", { category }),
    getCurrentQuestion: (id: string) =>
        api.get(`/api/v1/skills/diagnose/${id}/current`),
    submitAnswer: (id: string, answer: string) =>
        api.post(`/api/v1/skills/diagnose/${id}/answer`, { answer }),
    getDiagnoses: () => api.get("/api/v1/skills"),
    getDiagnosis: (id: string) => api.get(`/api/v1/skills/${id}`),
};

// ---- Roadmap ----
export const roadmapAPI = {
    generate: (data: {
        goal: string;
        currentLevel: string;
        timeline: string;
        dailyLearningTime: string;
        category: string;
    }) => api.post("/api/v1/roadmaps/generate", data),
    getRoadmaps: () => api.get("/api/v1/roadmaps"),
    getRoadmap: (id: string) => api.get(`/api/v1/roadmaps/${id}`),
    refine: (id: string, feedback: string) =>
        api.put(`/api/v1/roadmaps/${id}/refine`, { feedback }),
    completeMilestone: (roadmapId: string, milestoneId: string) =>
        api.put(`/api/v1/roadmaps/${roadmapId}/milestones/${milestoneId}/complete`),
    completeTask: (roadmapId: string, milestoneId: string, taskId: string) =>
        api.put(`/api/v1/roadmaps/${roadmapId}/milestones/${milestoneId}/tasks/${taskId}/complete`),
    completeProject: (roadmapId: string, milestoneId: string, projectId: string) =>
        api.put(`/api/v1/roadmaps/${roadmapId}/milestones/${milestoneId}/projects/${projectId}/complete`),
    deleteRoadmap: (id: string) => api.delete(`/api/v1/roadmaps/${id}`),
};

// ---- Progress ----
export const progressAPI = {
    getProgress: () => api.get("/api/v1/progress"),
    getActivities: () => api.get("/api/v1/progress/activities"),
    updateStreak: () => api.put("/api/v1/progress/streak"),
};

export default api;
