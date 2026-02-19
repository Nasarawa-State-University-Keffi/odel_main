
import apiClient from "@/lib/api";
import { Title, Gender, Role, Country, LGA, MaritalStatus, BasicInformationResponse, State } from "@/features/admin/types/staff";

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
    },

    // GET STATES BY COUNTRY
    getStatesByCountry: async (countryId: number): Promise<State[]> => {
        const response = await apiClient.get<State[]>(`/nationality/get-states/${countryId}`);
        return response.data;
    },

    // GET ALL BASIC INFORMATION
    getBasicInformation: async (): Promise<BasicInformationResponse> => {
        const response = await apiClient.get<BasicInformationResponse>('/basic-information/get-all');
        return response.data;
    },

    // GET JAMB SUBJECTS
    getJambSubjects: async (): Promise<{ id: number; title: string; code: string; }[]> => {
        const response = await apiClient.get<{ id: number; title: string; code: string; }[]>('/basic-information/get-jamb-subjects');
        return response.data;
    },

    // GET SSCE SUBJECTS
    getSsceSubjects: async (): Promise<{ id: number; title: string; code: string; }[]> => {
        const response = await apiClient.get<{ id: number; title: string; code: string; }[]>('/basic-information/get-ssce-subjects');
        return response.data;
    },

    // GET SSCE GRADES
    getSsceGrades: async (): Promise<{ id: number; title: string; score: number; }[]> => {
        const response = await apiClient.get<{ id: number; title: string; score: number; }[]>('/basic-information/get-ssce-grades');
        return response.data;
    },

    // GET SSCE ORGANIZATIONS
    getSsceOrganizations: async (): Promise<{ id: number; title: string; value: string; }[]> => {
        const response = await apiClient.get<{ id: number; title: string; value: string; }[]>('/basic-information/get-ssce-organizations');
        return response.data;
    },

    // GET SSCE EXAM TYPES
    getSsceExamTypes: async (): Promise<{ id: number; title: string; }[]> => {
        const response = await apiClient.get<{ id: number; title: string; }[]>('/basic-information/get-ssce-exam-types');
        return response.data;
    },

    // GET QUALIFICATION TYPES
    getQualificationTypes: async (): Promise<{ id: number; title: string; value: string; }[]> => {
        const response = await apiClient.get<{ id: number; title: string; value: string; }[]>('/basic-information/get-qualification-types');
        return response.data;
    },

    // GET QUALIFICATION GRADES
    getQualificationGrades: async (): Promise<{ id: number; title: string; score: number; }[]> => {
        const response = await apiClient.get<{ id: number; title: string; score: number; }[]>('/basic-information/get-qualification-grades');
        return response.data;
    }
};
