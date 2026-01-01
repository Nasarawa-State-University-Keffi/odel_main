import apiClient from "@/lib/api";
import {
    Session,
    NewSessionReqObject,
    UpdateSessionReqObject,
    SessionsAndLevelsResponse,
    Semester
} from "../types/session";

const BASE_URL = '/session';

export const sessionService = {
    // HANDLES CREATING A SESSION
    createSession: async (data: NewSessionReqObject): Promise<Session> => {
        const response = await apiClient.post(`${BASE_URL}/create`, data);
        return response.data;
    },

    // HANDLES UPDATING A SESSION
    updateSession: async (sessionId: number, data: UpdateSessionReqObject): Promise<Session> => {
        const response = await apiClient.put(`${BASE_URL}/update/${sessionId}`, data);
        return response.data;
    },

    // HANDLES GETTING ALL SESSIONS
    getAllSessions: async (): Promise<Session[]> => {
        const response = await apiClient.get(`${BASE_URL}/all`);
        return response.data;
    },

    // HANDLES GETTING SESSIONS FOR PROGRAMME TYPE
    getSessionsForProgrammeType: async (programmeTypeId: number): Promise<Session[]> => {
        const response = await apiClient.get(`${BASE_URL}/all-sessions`, {
            params: { programme_type: programmeTypeId }
        });
        return response.data;
    },

    // HANDLES GETTING SESSION BY ID
    getSessionById: async (id: number): Promise<Session> => {
        const response = await apiClient.get(`${BASE_URL}/${id}`);
        return response.data;
    },

    // HANDLES ACTIVATING A SESSION
    activateSession: async (id: number): Promise<void> => {
        await apiClient.put(`${BASE_URL}/activate/${id}`);
    },

    // HANDLES DEACTIVATING A SESSION
    deactivateSession: async (id: number): Promise<void> => {
        await apiClient.put(`${BASE_URL}/deactivate/${id}`);
    },

    // HANDLES CLOSING A SEMESTER
    closeSemester: async (id: number): Promise<void> => {
        await apiClient.put(`${BASE_URL}/close-semester/${id}`);
    },

    // HANDLES GETTING REGISTERED SESSIONS
    getRegisteredSessions: async (userId: string): Promise<Session[]> => {
        const response = await apiClient.get(`${BASE_URL}/get-registered-sessions`, {
            params: { user_id: userId }
        });
        return response.data;
    },

    // HANDLES GETTING FULL PAID SESSIONS
    getFullPaidSessions: async (userId: string): Promise<Session[]> => {
        const response = await apiClient.get(`${BASE_URL}/get-full-paid-sessions`, {
            params: { user_id: userId }
        });
        return response.data;
    },

    // HANDLES GETTING SESSIONS FOR PAYMENTS
    getSessionsForPayments: async (userId: string): Promise<Session[]> => {
        const response = await apiClient.get(`${BASE_URL}/get-sessions-for-payments`, {
            params: { user_id: userId }
        });
        return response.data;
    },

    // HANDLES GETTING SEMESTERS BY SESSION
    getSemestersBySession: async (id: number): Promise<Semester[]> => {
        const session = await sessionService.getSessionById(id);
        return session.semesters || [];
    }
};
