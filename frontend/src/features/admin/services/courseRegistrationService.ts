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

    // HANDLE COURSE REGISTRATION
    registerCourse: async (data: RequestCourseRegistrationDto): Promise<void> => {
        await apiClient.post(`${BASE_URL}/register`, data);
    },

    // HANDLES UNREGISTRATION
    unregisterCourse: async (data: RequestCourseRegistrationDto): Promise<void> => {
        await apiClient.post(`${BASE_URL}/unregister`, data);
    },

    // HANDLES APPROVE REGISTRATIONS
    approveRegistrations: async (data: ApproveRejectRegistrationsDto): Promise<void> => {
        await apiClient.post(`${BASE_URL}/approve`, data);
    },


    //HANDLES REGISTRATIONS REJECTION
    rejectRegistrations: async (data: ApproveRejectRegistrationsDto): Promise<void> => {
        await apiClient.post(`${BASE_URL}/reject`, data);
    },

    // HANDLES APPROVE BY COURSE
    approveByCourse: async (data: ApproveRejectRegistrationPerCourseDto): Promise<void> => {
        await apiClient.post(`${BASE_URL}/approve-by-course`, data);
    },

    // HANDLES REJECT COURSE
    rejectByCourse: async (data: ApproveRejectRegistrationPerCourseDto): Promise<void> => {
        await apiClient.post(`${BASE_URL}/reject-by-course`, data);
    },

    // HANDLES FINDING ALL COURSES FOR APPROVAL
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


    // HANDLES GET REGISTRATION HISTORY
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


    //HANDLES GET APPROVED COURSES
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


    //HANDLES DOWNLOADING OF REGISTRATION REPORT
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

    // HANDLES DEREGISTRATION OF COURSE
    deregisterCourse: async (id: number): Promise<void> => {
        await apiClient.delete(`${BASE_URL}/${id}`);
    }
};
