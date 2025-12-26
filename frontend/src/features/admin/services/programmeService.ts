import apiClient from "@/lib/api";
import { Programme, CreateProgrammeRequest, UpdateProgrammeRequest, Award } from "../types/programme";

export const programmeService = {
    // FETCH ALL PROGRAMMES BY TYPE
    getAllProgrammes: async (programmeTypeId: number): Promise<Programme[]> => {
        try {
            const response = await apiClient.get<Programme[]>(`/programme/all/${programmeTypeId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // FETCH AVAILABLE ONLINE PROGRAMMES
    getAvailableProgrammes: async (programmeTypeId: number): Promise<Programme[]> => {
        try {
            const response = await apiClient.get<Programme[]>('/programme/all-available', {
                params: { programme_type: programmeTypeId }
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // GET PROGRAMME BY ID
    getProgrammeById: async (id: number): Promise<Programme> => {
        try {
            const response = await apiClient.get<Programme>(`/programme/${id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // FETCH PROGRAMMES BY DEPARTMENT AND TYPE
    getProgrammesByDepartmentAndType: async (programmeTypeId: number, departmentId: number): Promise<Programme[]> => {
        try {
            const response = await apiClient.get<Programme[]>(`/programme/all/${programmeTypeId}/${departmentId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // TOGGLE ALL ONLINE STATUS
    toggleAllOnlineStatus: async (programmeTypeId: number, enable: boolean): Promise<string> => {
        try {
            const response = await apiClient.put<string>(`/programme/all-online`, null, {
                params: {
                    enable,
                    programmeType: programmeTypeId
                }
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // CREATE PROGRAMME
    createProgramme: async (data: CreateProgrammeRequest): Promise<Programme> => {
        try {
            const response = await apiClient.post<Programme>('/programme/create', data);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // UPDATE PROGRAMME
    updateProgramme: async (id: number, data: UpdateProgrammeRequest): Promise<Programme> => {
        try {
            const response = await apiClient.put<Programme>(`/programme/update/${id}`, data);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // FETCH ALL AWARDS
    getAllAwards: async (): Promise<Award[]> => {
        try {
            const response = await apiClient.get<Award[]>('/awards/all');
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};
