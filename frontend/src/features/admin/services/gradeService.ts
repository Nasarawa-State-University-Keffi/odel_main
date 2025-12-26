import apiClient from "@/lib/api";
import { Grade, CreateGradeRequest, UpdateGradeRequest } from "../types/grade";

export const gradeService = {
    // DELETE GRADE
    deleteGrade: async (id: number): Promise<void> => {
        try {
            await apiClient.delete(`/grades/${id}`);
        } catch (error: any) {
            const status = error.response?.status;
            const message = error.response?.data?.message || error.response?.data || "Failed to disable grade";

            if (status === 404) {
                throw new Error("Grade not found");
            }
            if (status === 403) {
                throw new Error("Access denied: Admin privileges required");
            }

            throw new Error(message);
        }
    },

    // UPDATE GRADE
    updateGrade: async ({ id, data }: { id: number; data: UpdateGradeRequest }): Promise<Grade> => {
        try {
            const response = await apiClient.put<Grade>(`/grades/update/${id}`, data);
            return response.data;
        } catch (error: any) {
            const status = error.response?.status;
            const message = error.response?.data?.message || error.response?.data || "Failed to update grade";

            if (status === 404) {
                // Could be Grade or Programme Type not found
                if (message.includes("Programme")) throw new Error("Programme Type not found");
                throw new Error("Grade not found");
            }
            if (status === 422) {
                throw new Error("Grade with this title already exists");
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

    // CREATE GRADE
    createGrade: async (data: CreateGradeRequest): Promise<Grade> => {
        try {
            const response = await apiClient.post<Grade>('/grades/create', data);
            return response.data;
        } catch (error: any) {
            const status = error.response?.status;
            const message = error.response?.data?.message || error.response?.data || "Failed to create grade";

            if (status === 404) {
                throw new Error("Programme Type not found");
            }
            if (status === 422) {
                throw new Error("Grade already exists for this programme");
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

    // FETCH ALL GRADES BY PROGRAMME TYPE
    getAllGrades: async (programmeTypeId: number): Promise<Grade[]> => {
        try {
            const response = await apiClient.get<Grade[]>(`/grades/all?programme_type=${programmeTypeId}`);
            return response.data;
        } catch (error: any) {
            const status = error.response?.status;
            const message = error.response?.data?.message || error.response?.data || "Failed to fetch grades";

            if (status === 404) {
                throw new Error("Programme Type not found");
            }

            console.error("Error fetching grades:", error);
            throw new Error(message);
        }
    }
};
