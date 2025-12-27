import apiClient from "@/lib/api";
import { ProgrammeType, CreateProgrammeTypeRequest, UpdateProgrammeTypeRequest, PaymentSettingReqObject, School } from "../types/programmeType";

export const programmeTypeService = {
    getAllProgrammeTypes: async (): Promise<ProgrammeType[]> => {
        try {
            const response = await apiClient.get<ProgrammeType[]>('/programme-type/get-all');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    getAllSchools: async (): Promise<School[]> => {
        try {
            const response = await apiClient.get<School[]>('/school/get-all');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    createProgrammeType: async (data: CreateProgrammeTypeRequest): Promise<ProgrammeType> => {
        try {
            const response = await apiClient.post<ProgrammeType>('/programme-type/create', data);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    updateProgrammeType: async (id: number, data: UpdateProgrammeTypeRequest): Promise<ProgrammeType> => {
        try {
            const response = await apiClient.put<ProgrammeType>(`/programme-type/update/${id}`, data);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    updatePaymentDetails: async (id: number, data: PaymentSettingReqObject): Promise<ProgrammeType> => {
        try {
            const response = await apiClient.put<ProgrammeType>(`/programme-type/update-payment-details/${id}`, data);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    getProgrammeTypesForCurrentRole: async (): Promise<ProgrammeType[]> => {
        try {
            const response = await apiClient.get<ProgrammeType[]>('/programme-type/all-for-current-role');
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};
