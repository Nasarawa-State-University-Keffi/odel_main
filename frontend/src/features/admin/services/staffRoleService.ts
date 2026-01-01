
import apiClient from "@/lib/api";
import { Staff, LevelAdviser } from "../types/staff";

// BASE URL FOR ROLES/APPOINTMENTS (Most look like they hang off /staff)
const BASE_URL = '/staff';

export const staffRoleService = {

    // FETCH LEVEL ADVISERS BY DEPARTMENT
    getLevelAdvisers: async (departmentId: number): Promise<LevelAdviser[]> => {
        try {
            const response = await apiClient.get<LevelAdviser[] | { data: LevelAdviser[] }>(`${BASE_URL}/get-level-advisers`, {
                params: { department: departmentId }
            });
            const rawData = (response.data as any).data || response.data;
            return Array.isArray(rawData) ? rawData : [];
        } catch (error: any) {
            if (error.response?.status === 404) {
                throw new Error("Department not found");
            }
            throw error;
        }
    },

    // UNMAKE HOD
    unmakeHod: async (staffId: string): Promise<string> => {
        try {
            const response = await apiClient.put<string>(`${BASE_URL}/unmake-hod/${staffId}`);
            return response.data;
        } catch (error: any) {
            const status = error.response?.status;
            const message = error.response?.data?.message || error.response?.data || "Failed to remove HOD role";

            if (status === 404) throw new Error("Lecturer does not exist");
            if (status === 403) throw new Error("Access denied: Admin privileges required");

            throw new Error(message);
        }
    },

    // MAKE HOD
    makeHod: async (staffId: string): Promise<string> => {
        try {
            const response = await apiClient.put<string>(`${BASE_URL}/make-hod/${staffId}`);
            return response.data;
        } catch (error: any) {
            const status = error.response?.status;
            const message = error.response?.data?.message || error.response?.data || "Failed to make HOD";

            if (status === 404) throw new Error("Lecturer does not exist");
            if (status === 403) throw new Error("Access denied: Admin privileges required");

            throw new Error(message);
        }
    },

    // MAKE VC
    makeVC: async (staffId: string): Promise<Staff> => {
        try {
            const response = await apiClient.put<Staff>(`${BASE_URL}/make-vc/${staffId}`);
            return response.data;
        } catch (error: any) {
            const status = error.response?.status;
            const message = error.response?.data?.message || error.response?.data || "Failed to assign role";

            if (status === 422) throw new Error("Lecturer does not exist or invalid state");
            if (status === 403) throw new Error("Access denied: Admin privileges required");

            throw new Error(message);
        }
    },

    // MAKE DVC ACADEMIC
    makeDvcAcademic: async (staffId: string): Promise<Staff> => {
        try {
            const response = await apiClient.put<Staff>(`${BASE_URL}/make-dvc-academics/${staffId}`);
            return response.data;
        } catch (error: any) {
            const status = error.response?.status;
            const message = error.response?.data?.message || error.response?.data || "Failed to assign role";

            if (status === 422) throw new Error("Lecturer does not exist or invalid state");
            if (status === 403) throw new Error("Access denied: Admin privileges required");

            throw new Error(message);
        }
    },

    // MAKE DVC ADMINISTRATION
    makeDvcAdministration: async (staffId: string): Promise<Staff> => {
        try {
            const response = await apiClient.put<Staff>(`${BASE_URL}/make-dvc-administration/${staffId}`);
            return response.data;
        } catch (error: any) {
            const status = error.response?.status;
            const message = error.response?.data?.message || error.response?.data || "Failed to assign role";

            if (status === 422) throw new Error("Lecturer does not exist or invalid state");
            if (status === 403) throw new Error("Access denied: Admin privileges required");

            throw new Error(message);
        }
    },

    // MAKE BURSAR
    makeBursar: async (staffId: string): Promise<Staff> => {
        try {
            const response = await apiClient.put<Staff>(`${BASE_URL}/make-bursar/${staffId}`);
            return response.data;
        } catch (error: any) {
            const status = error.response?.status;
            const message = error.response?.data?.message || error.response?.data || "Failed to assign role";

            if (status === 422) throw new Error("Lecturer does not exist or invalid state");
            if (status === 403) throw new Error("Access denied: Admin privileges required");

            throw new Error(message);
        }
    },

    // MAKE REGISTRAR
    makeRegistrar: async (staffId: string): Promise<Staff> => {
        try {
            const response = await apiClient.put<Staff>(`${BASE_URL}/make-registerer/${staffId}`);
            return response.data;
        } catch (error: any) {
            const status = error.response?.status;
            const message = error.response?.data?.message || error.response?.data || "Failed to assign role";

            if (status === 422) throw new Error("Lecturer does not exist or invalid state");
            if (status === 403) throw new Error("Access denied: Admin privileges required");

            throw new Error(message);
        }
    },

    // MAKE ACADEMIC SECRETARY
    makeAcademicSecretary: async (staffId: string): Promise<Staff> => {
        try {
            const response = await apiClient.put<Staff>(`${BASE_URL}/make-academic-secretary/${staffId}`);
            return response.data;
        } catch (error: any) {
            const status = error.response?.status;
            const message = error.response?.data?.message || error.response?.data || "Failed to assign role";

            if (status === 422) throw new Error("Lecturer does not exist or invalid state");
            if (status === 403) throw new Error("Access denied: Admin privileges required");

            throw new Error(message);
        }
    },

    // MAKE SENATE
    makeSenate: async (staffId: string): Promise<Staff> => {
        try {
            const response = await apiClient.put<Staff>(`${BASE_URL}/make-senate/${staffId}`);
            return response.data;
        } catch (error: any) {
            const status = error.response?.status;
            const message = error.response?.data?.message || error.response?.data || "Failed to assign role";

            if (status === 422) throw new Error("Lecturer does not exist or invalid state");
            if (status === 403) throw new Error("Access denied: Admin privileges required");

            throw new Error(message);
        }
    },

    // UNMAKE SENATE
    unmakeSenate: async (staffId: string): Promise<Staff> => {
        try {
            const response = await apiClient.put<Staff>(`${BASE_URL}/unmake-senate/${staffId}`);
            return response.data;
        } catch (error: any) {
            const status = error.response?.status;
            const message = error.response?.data?.message || error.response?.data || "Failed to remove Senate role";

            if (status === 422) throw new Error("Lecturer does not exist or invalid state");
            if (status === 403) throw new Error("Access denied: Admin privileges required");

            throw new Error(message);
        }
    },

    // MAKE FACULTY EXAM OFFICER
    makeFacultyExamOfficer: async (staffId: string): Promise<Staff> => {
        try {
            const response = await apiClient.put<Staff>(`${BASE_URL}/make-faculty-officer/${staffId}`);
            return response.data;
        } catch (error: any) {
            const status = error.response?.status;
            const message = error.response?.data?.message || error.response?.data || "Failed to assign role";

            if (status === 422) throw new Error("Lecturer does not exist or invalid state");
            if (status === 403) throw new Error("Access denied: Admin or Dean privileges required");

            throw new Error(message);
        }
    },

    // MAKE DEAN
    makeDean: async (staffId: string): Promise<Staff> => {
        try {
            const response = await apiClient.put<Staff>(`${BASE_URL}/make-faculty-dean/${staffId}`);
            return response.data;
        } catch (error: any) {
            const status = error.response?.status;
            const message = error.response?.data?.message || error.response?.data || "Failed to assign role";

            if (status === 422) throw new Error("Lecturer does not exist or invalid state");
            if (status === 403) throw new Error("Access denied: Admin privileges required");

            throw new Error(message);
        }
    },

    // MAKE DEPARTMENT EXAM OFFICER
    makeDepartmentExamOfficer: async (staffId: string, data: { programmeTypeId?: number }): Promise<Staff> => {
        try {
            const response = await apiClient.put<Staff>(`${BASE_URL}/make-department-officer/${staffId}`, data);
            return response.data;
        } catch (error: any) {
            const status = error.response?.status;
            const message = error.response?.data?.message || error.response?.data || "Failed to assign role";

            if (status === 422) throw new Error("Lecturer does not exist or invalid state");
            if (status === 404) throw new Error("Programme type not found");
            if (status === 403) throw new Error("Access denied: HOD privileges required");

            throw new Error(message);
        }
    },

    // MAKE LEVEL ADVISER
    makeLevelAdviser: async (data: { levelId: number[]; userId: string; departmentId: number; }): Promise<void> => {
        try {
            await apiClient.post(`${BASE_URL}/make-level-adviser`, data);
        } catch (error: any) {
            const status = error.response?.status;
            const message = error.response?.data?.message || error.response?.data || "Failed to assign level adviser";

            if (status === 404) throw new Error("Staff not found");
            if (status === 403) throw new Error("Access denied");

            throw new Error(message);
        }
    }
};
