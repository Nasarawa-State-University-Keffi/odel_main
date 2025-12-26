import apiClient from "@/lib/api";
import {
    Session,
    Semester,
    ApplicationType,
    CreateAdmissionRequest,
    UpdateApplicationTypeRequest
} from "../types/admission";

// In-memory cache for metadata
let sessionsCache: Session[] | null = null;
let semestersCache: Semester[] | null = null;
// Removed applicationTypesCache to ensure fresh data fetch

export const admissionService = {
    // Metadata Fetchers
    getAllSessions: async (): Promise<Session[]> => {
        if (sessionsCache) return sessionsCache;
        const response = await apiClient.get<Session[]>('/session/all');
        sessionsCache = response.data;
        return response.data;
    },

    // HANDLES SEMESTERS TYPES
    getSemestersBySession: async (sessionId: number): Promise<Semester[]> => {

        // ALWAYS FETCHING THIS TO ENSURE DATA ACCURACY
        const response = await apiClient.get<Semester[]>(`/semester/fetch/${sessionId}`);
        return response.data;
    },


    // HANDLES APPLICATION TYPES
    getApplicationTypes: async (): Promise<ApplicationType[]> => {
        const response = await apiClient.get<ApplicationType[]>('/admission/get-application-types', {
            params: { t: new Date().getTime() }
        });
        return response.data;
    },

    getApplicationTypesFor: async (programmeType: number): Promise<ApplicationType[]> => {
        const response = await apiClient.get<ApplicationType[]>(`/admission/get-application-types-for`, {
            params: { programme_type: programmeType, t: new Date().getTime() }
        });
        return response.data;
    },

    // HANDLES CREATE ADMISSION
    createAdmission: async (data: CreateAdmissionRequest): Promise<any> => {
        const response = await apiClient.post('/admission/create', data);
        return response.data;
    },

    // HANDLES ADMISSION STATS
    getAdmissionStats: async (params: { faculty: number; session: number; semester?: number }): Promise<any> => {
        const response = await apiClient.get('/admission/stats', { params });
        return response.data;
    },

    // HANDLES FETCHING ADMISSIONS BY SESSION
    getAdmissionsBySession: async (sessionId: number): Promise<any[]> => {
        const response = await apiClient.get(`/admission/get-admissions-by-session`, {
            params: { sessionId }
        });
        const data = response.data;
        if (data && typeof data === 'object' && 'data' in data) {
            return Array.isArray(data.data) ? data.data : [];
        }
        return Array.isArray(data) ? data : [];
    },

    // HANDLES ACTIVE ADMISSION (Singular - Legacy)
    getActiveAdmission: async (): Promise<any | null> => {
        try {
            const response = await apiClient.get('/admission/get-active-admissions');
            const data = response.data;

            if (Array.isArray(data)) {
                return data.length > 0 ? data[0] : null;
            }

            if (data && typeof data === 'object' && 'data' in data) {
                return Array.isArray(data.data) && data.data.length > 0 ? data.data[0] : null;
            }

            return data || null;
        } catch (error) {
            console.error("Failed to fetch active admission", error);
            return null;
        }
    },

    // HANDLES ACTIVE ADMISSIONS (Plural - For Lists/Filtering)
    getActiveAdmissions: async (): Promise<any[]> => {
        try {
            const response = await apiClient.get('/admission/get-active-admissions');
            const data = response.data;

            if (Array.isArray(data)) {
                return data;
            }

            if (data && typeof data === 'object' && 'data' in data) {
                return Array.isArray(data.data) ? data.data : [];
            }

            return [];
        } catch (error) {
            console.error("Failed to fetch active admissions list", error);
            return [];
        }
    },

    // HANDLES ACTIVE PROGRAMMES
    getActiveProgrammes: async (): Promise<any[]> => {
        try {
            const response = await apiClient.get('/admission/get-active-programmes');
            const data = response.data;

            console.log('active programmes', data)
            if (Array.isArray(data)) {
                return data;
            }

            if (data && typeof data === 'object' && 'data' in data) {
                return Array.isArray(data.data) ? data.data : [];
            }

            return [];
        } catch (error) {
            console.error("Failed to fetch active programmes list", error);
            return [];
        }
    },

    // HANDLES UPDATE ADMISSION
    updateAdmission: async (admissionId: number, data: UpdateApplicationTypeRequest): Promise<any> => {
        const response = await apiClient.post(`/admission/application-types/update/${admissionId}`, data);
        return response.data;
    },

    // HANDLES BULK ADMISSION FETCH
    getAdmissionBulk: async (params: {
        level?: number;
        admission?: number;
        faculty?: number;
        department?: number;
        programme?: number;
        country?: number;
        state?: number;
        lga?: number;
        gender?: number;
    }): Promise<any> => {
        const response = await apiClient.get('/admission/admission-bulk', { params });
        return response.data;
    },

    // HANDLES SINGLE ADMISSION FETCH
    getAdmissionSingle: async (applicantId: string): Promise<any> => {
        const response = await apiClient.get('/admission/admission-single', {
            params: { applicantId }
        });
        return response.data;
    },

    // HANDLES ENABLE ADMISSION SESSION
    enableAdmission: async (sessionId: number): Promise<any> => {
        const response = await apiClient.put(`/admission/enable/${sessionId}`);
        return response.data;
    }
};
