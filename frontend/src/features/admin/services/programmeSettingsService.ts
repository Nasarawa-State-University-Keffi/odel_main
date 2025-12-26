import apiClient from "@/lib/api";
import {
    ProgrammeSettingsResponse,
    FetchProgrammeSettingsParams,
    AddCoursesToProgrammeRequest,
    AddCoursesToProgrammeResponse
} from "../types/programmeSettings";

export const programmeSettingsService = {
    fetchProgrammeSettings: async (params: FetchProgrammeSettingsParams): Promise<ProgrammeSettingsResponse> => {
        try {
            const response = await apiClient.get<ProgrammeSettingsResponse>('/programme-settings/fetch', {
                params
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    fetchUnregisteredCourses: async (params: FetchProgrammeSettingsParams): Promise<any[]> => {
        try {
            const response = await apiClient.get<any[]>('/programme-settings/fetch-unregistered-course', {
                params
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    addCoursesToProgramme: async (programmeId: number, data: AddCoursesToProgrammeRequest): Promise<AddCoursesToProgrammeResponse[]> => {
        try {
            const response = await apiClient.post<AddCoursesToProgrammeResponse[]>(`/programme-settings/add-courses-to-programme/programme/${programmeId}`, data);
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};
