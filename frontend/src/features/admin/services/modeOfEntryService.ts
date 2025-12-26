import apiClient from "@/lib/api";
import { ModeOfEntry } from "../types/modeOfEntry";

export const modeOfEntryService = {

    // HANDLE GET ALL MODE ENTRIES
    getAllModeOfEntries: async (programmeTypeId: number): Promise<ModeOfEntry[]> => {
        try {
            const response = await apiClient.get<ModeOfEntry[]>(`/mode-of-entries/all`, {
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
            const response = await apiClient.post<ModeOfEntry>(`/mode-of-entries/create`, data);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // HANDLE UPDATE MODE OF ENTRY
    updateModeOfEntry: async (id: number, data: any): Promise<ModeOfEntry> => {
        try {
            const response = await apiClient.put<ModeOfEntry>(`/mode-of-entries/update/${id}`, data);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // GET MODE OF ENTRY BY ID
    getModeOfEntryById: async (id: number): Promise<ModeOfEntry> => {
        try {
            const response = await apiClient.get<ModeOfEntry>(`/mode-of-entries/${id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // HANDLE DELETE MODE OF ENTRY
    deleteModeOfEntry: async (id: number): Promise<void> => {
        try {
            await apiClient.delete(`/mode-of-entries/${id}`);
        } catch (error) {
            throw error;
        }
    }
};
