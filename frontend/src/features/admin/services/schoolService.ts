import apiClient from "@/lib/api";
import { School, CreateSchoolRequest, UpdateSchoolRequest } from "../types/school";


// SCHOOLS BASE URL
const BASE_URL = '/schools';

export const schoolService = {
    // HANDLES GETTING ALL SCHOOLS
    getAllSchools: async (): Promise<School[]> => {
        try {
            const response = await apiClient.get<School[]>(`${BASE_URL}/all`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // HANDLES GETTING DOMINANT SCHOOL
    getDominantSchool: async (): Promise<School> => {
        try {
            const response = await apiClient.get<School>(`${BASE_URL}/get-dominant`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // HANDLES CREATING A SCHOOL
    createSchool: async (data: CreateSchoolRequest): Promise<School> => {
        try {
            const response = await apiClient.post<School>(`${BASE_URL}/create`, data);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // HANDLES UPDATING A SCHOOL
    updateSchool: async (id: number, data: UpdateSchoolRequest): Promise<School> => {
        try {
            const response = await apiClient.put<School>(`${BASE_URL}/update/${id}`, data);
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};
