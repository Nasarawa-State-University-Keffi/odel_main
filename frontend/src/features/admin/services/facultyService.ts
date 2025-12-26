import apiClient from "@/lib/api";
import { Faculty, CreateFacultyRequest, UpdateFacultyRequest, FacultyWithDean } from "../types/faculty";

export const facultyService = {
    // FETCH ALL FACULTIES
    getAllFaculties: async (): Promise<Faculty[]> => {
        try {
            const response = await apiClient.get<Faculty[]>('/faculty/all');
            return response.data;
        } catch (error) {
            console.error("Error fetching faculties:", error);
            throw error;
        }
    },

    // FETCH ALL FACULTIES WITH DEANS
    getAllFacultiesWithDeans: async (): Promise<FacultyWithDean[]> => {
        try {
            const response = await apiClient.get<FacultyWithDean[]>('/faculty/all-with-deans');
            return response.data;
        } catch (error) {
            console.error("Error fetching faculties with deans:", error);
            throw error;
        }
    },

    // CREATE NEW FACULTY
    createFaculty: async (data: CreateFacultyRequest): Promise<Faculty> => {
        try {
            const response = await apiClient.post<Faculty>('/faculty/create', data);
            return response.data;
        } catch (error: any) {
            const status = error.response?.status;
            const message = error.response?.data?.message || error.response?.data || "Failed to create faculty";

            if (status === 422) {
                throw new Error(message); // Already exists
            }
            if (status === 400) {
                throw new Error("Validation error: " + message);
            }
            if (status === 403) {
                throw new Error("Access denied: Admin privileges required");
            }

            throw new Error(message);
        }
    },

    // UPDATE FACULTY
    updateFaculty: async (data: UpdateFacultyRequest): Promise<Faculty> => {
        try {
            const response = await apiClient.put<Faculty>('/faculty/update', data);
            return response.data;
        } catch (error: any) {
            const status = error.response?.status;
            const message = error.response?.data?.message || error.response?.data || "Failed to update faculty";

            if (status === 422) {
                throw new Error(message); // Name/Code exists
            }
            if (status === 404) {
                throw new Error("Target faculty not found");
            }
            if (status === 400) {
                throw new Error("Validation error: " + message);
            }
            if (status === 403) {
                throw new Error("Access denied: Admin privileges required");
            }

            throw new Error(message);
        }
    },

    // FETCH EXAM OFFICER FOR FACULTY
    getExamOfficer: async (facultyId: number): Promise<DeanOfficer | null> => {
        try {
            const response = await apiClient.get<DeanOfficer | null>(`/faculty/exam-officer/${facultyId}`);
            return response.data;
        } catch (error: any) {
            const status = error.response?.status;
            const message = error.response?.data?.message || error.response?.data || "Failed to fetch exam officer";

            if (status === 422) {
                throw new Error("Faculty does not exist");
            }

            console.error("Error fetching exam officer:", error);
            throw new Error(message);
        }
    }
};
