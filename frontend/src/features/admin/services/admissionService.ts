
import apiClient from "@/lib/api";
import { Admission, AdmissionStats, ApplicationType, CreateAdmissionRequest, UpdateAdmissionRequest, CreateApplicationTypeRequest, BulkAdmissionParams } from "../types/admission";

const BASE_URL = "/admission";




export const admissionService = {
    // HANDLES GET ADMISSION VIA PROGRAMME TYPE
    getAdmissions: async (programmeTypeId: number): Promise<Admission[]> => {
        const response = await apiClient.get<Admission[]>(`${BASE_URL}/get-admissions`, {
            params: { prog_type: programmeTypeId }
        });
        return response.data;
    },


    // HANDLES GET ACTIVE ADMISSIONS
    getActiveAdmissions: async (): Promise<Admission[]> => {
        const response = await apiClient.get<Admission[]>(`${BASE_URL}/get-active-admissions`);

        console.log('ACTIVE ADMISSIONS', response.data);
        return response.data;
    },

    //HANDLES GET ADMISSION BY SESSION
    getAdmissionsBySession: async (sessionId: number): Promise<Admission[]> => {
        const response = await apiClient.get<Admission[]>(`${BASE_URL}/get-admissions-by-session`, {
            params: { sessionId }
        });

        console.log('ADMISSIONS BY SESSION', response.data);
        return response.data;
    },

    // HANDLES ADMISSION ACTIVATIONS
    enableAdmission: async (sessionId: number): Promise<{ condition: boolean }> => {
        try {
            const response = await apiClient.put<{ condition: boolean }>(`${BASE_URL}/enable/${sessionId}`);
            return response.data;
        } catch (error: any) {
            throw error;
        }
    },

    // HANDLES ADMISSION CREATION
    createAdmission: async (data: CreateAdmissionRequest): Promise<Admission> => {
        try {
            const response = await apiClient.post<Admission>(`${BASE_URL}/create`, data);
            return response.data;
        } catch (error: any) {
            throw error;
        }
    },


    //HANDLES UPDATING ADMISSIONS
    updateAdmission: async (id: number, data: UpdateAdmissionRequest): Promise<Admission> => {
        try {
            const response = await apiClient.post<Admission>(`${BASE_URL}/update/${id}`, data);
            return response.data;
        } catch (error: any) {
            throw error;
        }
    },

    //HANDLE APPLICATION TYPES
    getApplicationTypes: async (): Promise<ApplicationType[]> => {
        const response = await apiClient.get<ApplicationType[]>(`${BASE_URL}/get-application-types`);
        return response.data;
    },

    //HANDLE APPLICATION TYPE CREATION
    createApplicationType: async (data: CreateApplicationTypeRequest): Promise<ApplicationType> => {
        try {
            const response = await apiClient.post<ApplicationType>(`${BASE_URL}/application-types/create`, data);
            return response.data;
        } catch (error: any) {
            throw error;
        }
    },

    //HANDLE APPLICATION TYPE UPDATION  
    updateApplicationType: async (id: number, data: CreateApplicationTypeRequest): Promise<ApplicationType> => {
        try {
            const response = await apiClient.post<ApplicationType>(`${BASE_URL}/application-types/update/${id}`, data);
            return response.data;
        } catch (error: any) {
            throw error;
        }
    },

    //HANDLE APPLICATION TYPE BY PROGRAMME TYPE
    getApplicationTypesForProgramme: async (programmeTypeId: number): Promise<ApplicationType[]> => {
        const response = await apiClient.get<ApplicationType[]>(`${BASE_URL}/get-application-types-for`, {
            params: { programme_type: programmeTypeId }
        });
        return response.data;
    },

    // HANDLES ADMISSION STATISTICS
    getAdmissionStats: async (facultyId: number, sessionId: number, semesterId?: number): Promise<AdmissionStats> => {
        const params: Record<string, any> = {
            faculty: facultyId,
            session: sessionId
        };
        if (semesterId) {
            params.semester = semesterId;
        }

        const response = await apiClient.get<AdmissionStats>(`${BASE_URL}/stats`, { params });
        return response.data;
    },

    // HANDLE ADMISSION DOCUMENTS
    getAdmissionLetter: async (applicantId: string): Promise<Blob> => {
        const response = await apiClient.get(`${BASE_URL}/letter`, {
            params: { q: applicantId },
            responseType: "blob",
        });
        return response.data;
    },

    // HANDLE ADMISSION DOCUMENTS
    getNotificationOfAdmission: async (applicantId: string): Promise<Blob> => {
        const response = await apiClient.get(`${BASE_URL}/notification-of-admission`, {
            params: { q: applicantId },
            responseType: "blob",
        });
        return response.data;
    },

    // HANDLE ADMISSION DOCUMENTS
    getSingleAdmissionDocument: async (applicantId: string): Promise<Blob> => {
        const response = await apiClient.get(`${BASE_URL}/admission-single`, {
            params: { applicantId },
            responseType: "blob",
        });
        return response.data;
    },

    // HANDLE ADMISSION DOCUMENTS
    getBulkAdmissionDocuments: async (params: BulkAdmissionParams): Promise<Blob> => {
        const response = await apiClient.get(`${BASE_URL}/admission-bulk`, {
            params,
            responseType: "blob",
        });
        return response.data;
    },
};
