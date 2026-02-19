import apiClient from "@/lib/api";
import { InitialDataResponse, UtmeUpdateData, PersonalDetailsUpdateData, ContactUpdateData, NyscUpdateData, NextOfKinUpdateData, RefereeUpdateData, OLevelUpdateData, ModeOfEntryUpdateData } from "../types/application";

// the application endpoint

const BASE_URL = "/applications";

export const applicationService = {

    // HANDLES GETTING OF INITIAL DATA FOR THE APPLICANT

    getInitialData: async (): Promise<InitialDataResponse> => {
        const response = await apiClient.get<InitialDataResponse>(`${BASE_URL}/get-initial-data`);
        return response.data;
    },

    // HANDLES UPDATING THE APPLICANT UTME
    updateUtmeDetails: async (applicantId: number | string, data: UtmeUpdateData) => {
        const response = await apiClient.put(`${BASE_URL}/utme-update/${applicantId}`, data);
        return response.data;
    },

    // HANDLES UPDATING THE APPLICANT PERSONAL DETAILS
    updatePersonalDetails: async (applicantId: number | string, data: PersonalDetailsUpdateData) => {
        const response = await apiClient.put(`${BASE_URL}/personal-details-update/${applicantId}`, data);
        return response.data;
    },

    // HANDLES UPDATING THE APPLICANT CONTACT DETAILS
    updateContactDetails: async (applicantId: number | string, data: ContactUpdateData) => {
        const response = await apiClient.put(`${BASE_URL}/contact-address-update/${applicantId}`, data);
        return response.data;
    },

    // HANDLES UPDATING THE APPLICANT PROGRAMME
    updateProgrammeDetails: async (applicantId: number | string, data: import("../types/application").ProgrammeUpdateData) => {
        const response = await apiClient.put(`${BASE_URL}/programme-update/${applicantId}`, data);
        return response.data;
    },

    // HANDLES UPDATING THE APPLICANT MODE OF ENTRY
    updateModeOfEntry: async (applicantId: number | string, data: ModeOfEntryUpdateData) => {
        const response = await apiClient.put(`${BASE_URL}/step-applicant/${applicantId}`, data);
        return response.data;
    },

    // HANDLES UPDATING THE APPLICANT NYSC DETAILS
    updateNyscDetails: async (applicantId: number | string, data: NyscUpdateData) => {
        const response = await apiClient.put(`${BASE_URL}/nysc-update/${applicantId}`, data);
        return response.data;
    },

    // HANDLES UPDATING THE APPLICANT NEXT OF KIN DETAILS
    updateNextOfKinDetails: async (applicantId: number | string, data: NextOfKinUpdateData) => {
        const response = await apiClient.put(`${BASE_URL}/next-of-kin-update/${applicantId}`, data);
        return response.data;
    },

    // HANDLES UPDATING THE APPLICANT REFEREE DETAILS
    updateRefereeDetails: async (applicantId: number | string, data: RefereeUpdateData) => {
        const response = await apiClient.put(`${BASE_URL}/referee-update/${applicantId}`, data);
        return response.data;
    },

    // HANDLES UPDATING THE APPLICANT OLEVEL RESULTS
    updateOLevelResults: async (applicantId: number | string, data: OLevelUpdateData) => {
        const response = await apiClient.put(`${BASE_URL}/olevel-update/${applicantId}`, data);
        return response.data;
    },

    // HANDLES UPDATING THE APPLICANT QUALIFICATION DETAILS
    updateQualificationDetails: async (applicantId: number | string, data: import("../types/application").QualificationUpdateData) => {
        const formData = new FormData();
        formData.append("results", JSON.stringify(data.results));

        if (data.files && data.files.length > 0) {
            data.files.forEach((file) => {
                if (file) formData.append("files", file);
            });
        }

        const response = await apiClient.put(`${BASE_URL}/qualification-update/${applicantId}`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data;


    },

    // HANDLES UPDATING THE APPLICANT PASSPORT
    updatePassport: async (email: string, file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("user", email);

        const response = await apiClient.post(`/profile-picture/store`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data;
    },

    // HANDLES FINAL APPLICATION SUBMISSION
    submitApplication: async (applicantId: number | string) => {
        const response = await apiClient.post(`${BASE_URL}/submit/${applicantId}`);
        return response.data;
    },

    // FETCH PROFILE PICTURE
    fetchProfilePicture: async (email: string) => {
        const response = await apiClient.get<string>(`/profile-picture/fetch`, {
            params: { user: email }
        });
        return response.data;
    }
};
