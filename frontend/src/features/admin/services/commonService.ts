
import apiClient from "@/lib/api";
import { Title, Gender, Role, Country, LGA } from "@/features/admin/types/staff";

// THESE ARE COMMON ENDPOINTS SHARED ACROSS MODULES

export const commonService = {
    // GET TITLES
    getAllTitles: async (): Promise<Title[]> => {
        const response = await apiClient.get<Title[]>('/basic-information/get-titles');
        return response.data;
    },

    // GET ROLES
    getAllRoles: async (): Promise<Role[]> => {
        const response = await apiClient.get<Role[]>('/system/settings/get-roles');
        return response.data;
    },

    // GET COUNTRIES
    getCountries: async (): Promise<Country[]> => {
        const response = await apiClient.get<Country[]>('/nationality/get-countries');
        return response.data;
    },

    // GET GENDERS
    getGenders: async (): Promise<Gender[]> => {
        const response = await apiClient.get<Gender[]>('/basic-information/get-genders');
        return response.data;
    },

    // GET LGAS BY STATE
    getLgasByState: async (stateId: number): Promise<LGA[]> => {
        const response = await apiClient.get<LGA[]>(`/nationality/get-lgas/${stateId}`);
        return response.data;
    }
};
