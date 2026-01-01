import apiClient from "@/lib/api";
import { ModeOfEntry } from "../types/modeOfEntry";

//BASE URL FOR THE MODE OF ENTRY
const BASE_URL = '/mode-of-entries';

export const modeOfEntryService = {

    // HANDLE GET ALL MODE ENTRIES
    getAllModeOfEntries: async (programmeTypeId: number): Promise<ModeOfEntry[]> => {
        try {
            const response = await apiClient.get<ModeOfEntry[]>(`${BASE_URL}/all`, {
                params: { programme_type: programmeTypeId }
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // HANDLE CREATE MODE OF ENTRY
    createModeOfEntry: async (data: any): Promise<ModeOfEntry> => {
        try {
            const response = await apiClient.post<ModeOfEntry>(`${BASE_URL}/create`, data);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // HANDLE UPDATE MODE OF ENTRY
    updateModeOfEntry: async (id: number, data: any): Promise<ModeOfEntry> => {
        try {
            const response = await apiClient.put<ModeOfEntry>(`${BASE_URL}/update/${id}`, data);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // GET MODE OF ENTRY BY ID
    getModeOfEntryById: async (id: number): Promise<ModeOfEntry> => {
        try {
            const response = await apiClient.get<ModeOfEntry>(`${BASE_URL}/${id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // HANDLE DELETE MODE OF ENTRY
    deleteModeOfEntry: async (id: number): Promise<void> => {
        try {
            await apiClient.delete(`${BASE_URL}/${id}`);
        } catch (error) {
            throw error;
        }
    }
};
