import apiClient from "@/lib/api";
import { Level } from "../types/level";

//BASE URL FOR THE LEVEL
const BASE_URL = '/levels';

export const levelService = {

    //HANDLE ALL LEVEL FETCHING VIA PROGRAMME TYPE
    getAllLevels: async (programmeTypeId?: number): Promise<Level[]> => {
        try {
            const response = await apiClient.get<Level[]>(`${BASE_URL}/all`, {
                params: programmeTypeId ? { programme_type: programmeTypeId } : {}
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    createLevel: async (data: any): Promise<Level> => {
        try {
            const response = await apiClient.post<Level>(`${BASE_URL}/create`, data);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    updateLevel: async (id: number, data: any): Promise<Level> => {
        try {
            const response = await apiClient.put<Level>(`${BASE_URL}/update/${id}`, data);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    deleteLevel: async (id: number): Promise<void> => {
        try {
            await apiClient.delete(`${BASE_URL}/${id}`);
        } catch (error) {
            throw error;
        }
    }
};
