import apiClient from "@/lib/api";
import {
    Session,
    NewSessionReqObject,
    UpdateSessionReqObject,
    SessionsAndLevelsResponse
} from "../types/session";

const BASE_URL = '/session';

export const sessionService = {
    createSession: async (data: NewSessionReqObject): Promise<Session> => {
        const response = await apiClient.post(`${BASE_URL}/create`, data);
        return response.data;
    },

    updateSession: async (sessionId: number, data: UpdateSessionReqObject): Promise<Session> => {
        const response = await apiClient.put(`${BASE_URL}/update/${sessionId}`, data);
        return response.data;
    },

    getAllSessions: async (): Promise<Session[]> => {
        const response = await apiClient.get(`${BASE_URL}/all`);
        return response.data;
    },

    getSessionsForProgrammeType: async (programmeTypeId: number): Promise<Session[]> => {
        const response = await apiClient.get(`${BASE_URL}/all-sessions`, {
            params: { programme_type: programmeTypeId }
        });
        return response.data;
    },

    getSessionById: async (id: number): Promise<Session> => {
        const response = await apiClient.get(`${BASE_URL}/${id}`);
        return response.data;
    },

    activateSession: async (id: number): Promise<void> => {
        await apiClient.put(`${BASE_URL}/activate/${id}`);
    },

    deactivateSession: async (id: number): Promise<void> => {
        await apiClient.put(`${BASE_URL}/deactivate/${id}`);
    },

    closeSemester: async (id: number): Promise<void> => {
        await apiClient.put(`${BASE_URL}/close-semester/${id}`);
    },

    getRegisteredSessions: async (userId: string): Promise<Session[]> => {
        const response = await apiClient.get(`${BASE_URL}/get-registered-sessions`, {
            params: { user_id: userId }
        });
        return response.data;
    },

    getFullPaidSessions: async (userId: string): Promise<Session[]> => {
        const response = await apiClient.get(`${BASE_URL}/get-full-paid-sessions`, {
            params: { user_id: userId }
        });
        return response.data;
    },

    getSessionsForPayments: async (userId: string): Promise<Session[]> => {
        const response = await apiClient.get(`${BASE_URL}/get-sessions-for-payments`, {
            params: { user_id: userId }
        });
        return response.data;
    }
};
