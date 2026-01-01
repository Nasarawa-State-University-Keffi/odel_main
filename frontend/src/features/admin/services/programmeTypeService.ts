import apiClient from "@/lib/api";
import { ProgrammeType, CreateProgrammeTypeRequest, UpdateProgrammeTypeRequest, PaymentSettingReqObject, School } from "../types/programmeType";

// BASE URL FOR PROGAMME TYPE
const BASE_URL = '/programme-type';

export const programmeTypeService = {

    //HANDLES GETTING ALL PROGRAMME TYPES
    getAllProgrammeTypes: async (): Promise<ProgrammeType[]> => {
        try {
            const response = await apiClient.get<ProgrammeType[]>(`${BASE_URL}/get-all`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // HANDLES GET ALL SCHOOLS
    getAllSchools: async (): Promise<School[]> => {
        try {
            const response = await apiClient.get<School[]>('/school/get-all');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // HANDLES CREATING A PROGRAMME TYPE
    createProgrammeType: async (data: CreateProgrammeTypeRequest): Promise<ProgrammeType> => {
        try {
            const response = await apiClient.post<ProgrammeType>(`${BASE_URL}/create`, data);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // HANDLES UPDATING A PROGRAMME TYPE
    updateProgrammeType: async (id: number, data: UpdateProgrammeTypeRequest): Promise<ProgrammeType> => {
        try {
            const response = await apiClient.put<ProgrammeType>(`${BASE_URL}/update/${id}`, data);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // HANDLES UPDATING PAYMENT DETAILS
    updatePaymentDetails: async (id: number, data: PaymentSettingReqObject): Promise<ProgrammeType> => {
        try {
            const response = await apiClient.put<ProgrammeType>(`${BASE_URL}/update-payment-details/${id}`, data);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // HANDLES GETTING ALL PROGRAMME TYPES FOR CURRENT ROLE
    getProgrammeTypesForCurrentRole: async (): Promise<ProgrammeType[]> => {
        try {
            const response = await apiClient.get<ProgrammeType[]>(`${BASE_URL}/all-for-current-role`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};
