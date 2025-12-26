import apiClient from "@/lib/api";
import { Level } from "../types/level";

export const levelService = {

    //HANDLE ALL LEVEL FETCHING VIA PROGRAMME TYPE
    getAllLevels: async (programmeTypeId: number): Promise<Level[]> => {
        try {
            const response = await apiClient.get<Level[]>(`/levels/all`, {
                params: { programme_type: programmeTypeId }
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    createLevel: async (data: any): Promise<Level> => {
        try {
            const response = await apiClient.post<Level>(`/levels/create`, data);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    updateLevel: async (id: number, data: any): Promise<Level> => {
        try {
            const response = await apiClient.put<Level>(`/levels/update/${id}`, data);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    deleteLevel: async (id: number): Promise<void> => {
        try {
            await apiClient.delete(`/levels/${id}`);
        } catch (error) {
            throw error;
        }
    }
};
