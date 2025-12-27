import apiClient from "@/lib/api";
import { School, CreateSchoolRequest, UpdateSchoolRequest } from "../types/school";

export const schoolService = {
    getAllSchools: async (): Promise<School[]> => {
        try {
            const response = await apiClient.get<School[]>('/schools/all');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    getDominantSchool: async (): Promise<School> => {
        try {
            const response = await apiClient.get<School>('/schools/get-dominant');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    createSchool: async (data: CreateSchoolRequest): Promise<School> => {
        try {
            const response = await apiClient.post<School>('/schools/create', data);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    updateSchool: async (id: number, data: UpdateSchoolRequest): Promise<School> => {
        try {
            const response = await apiClient.put<School>(`/schools/update/${id}`, data);
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};
