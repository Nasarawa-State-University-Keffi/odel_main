import apiClient from "@/lib/api";
import {
    RequestCourseRegistrationDto,
    ApproveRejectRegistrationsDto,
    ApproveRejectRegistrationPerCourseDto,
    RegistrationDetails,
    ApprovedRegisteredCourseDto,
    RegistrationHistoryDto,
    Page
} from "../types/courseRegistration";

const BASE_URL = '/registered-courses';

export const courseRegistrationService = {
    registerCourse: async (data: RequestCourseRegistrationDto): Promise<void> => {
        await apiClient.post(`${BASE_URL}/register`, data);
    },

    unregisterCourse: async (data: RequestCourseRegistrationDto): Promise<void> => {
        await apiClient.post(`${BASE_URL}/unregister`, data);
    },

    approveRegistrations: async (data: ApproveRejectRegistrationsDto): Promise<void> => {
        await apiClient.post(`${BASE_URL}/approve`, data);
    },

    rejectRegistrations: async (data: ApproveRejectRegistrationsDto): Promise<void> => {
        await apiClient.post(`${BASE_URL}/reject`, data);
    },

    approveByCourse: async (data: ApproveRejectRegistrationPerCourseDto): Promise<void> => {
        await apiClient.post(`${BASE_URL}/approve-by-course`, data);
    },

    rejectByCourse: async (data: ApproveRejectRegistrationPerCourseDto): Promise<void> => {
        await apiClient.post(`${BASE_URL}/reject-by-course`, data);
    },

    findAllForApproval: async (params: {
        semester: number;
        stage: number;
        course?: number;
        level?: number;
        student?: string;
        status?: string;
        page?: number;
        size?: number;
    }): Promise<Page<RegistrationDetails>> => {
        const response = await apiClient.get<Page<RegistrationDetails>>(`${BASE_URL}/find-all-for-approval`, { params });
        return response.data;
    },

    getRegistrationHistory: async (params: {
        semester: number;
        course?: number;
        student?: string;
        page?: number;
        size?: number;
    }): Promise<Page<RegistrationHistoryDto>> => {
        const response = await apiClient.get<Page<RegistrationHistoryDto>>(`${BASE_URL}/history`, { params });
        return response.data;
    },

    getApprovedCourses: async (params: {
        semester: number;
        course?: number;
        student?: string;
        programme?: number;
        page?: number;
        size?: number;
    }): Promise<Page<ApprovedRegisteredCourseDto>> => {
        const response = await apiClient.get<Page<ApprovedRegisteredCourseDto>>(`${BASE_URL}/approved`, { params });
        return response.data;
    },

    downloadRegistrationReport: async (params: {
        semester: number;
        level: number;
        course?: number;
    }): Promise<Blob> => {
        const response = await apiClient.get(`${BASE_URL}/download-registration-report`, {
            params,
            responseType: 'blob'
        });
        return response.data;
    },

    deregisterCourse: async (id: number): Promise<void> => {
        await apiClient.delete(`${BASE_URL}/${id}`);
    }
};
