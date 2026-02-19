import apiClient from "@/lib/api";

export interface RegisterApplicantRequest {
    admissionId: number;
    modeOfEntryId: number;
    emailAddress: string;
    jambRegNumber: string;
    password?: string;
    confirmPassword?: string;
}

export const applicantService = {
    registerApplicant: async (data: RegisterApplicantRequest): Promise<void> => {
        await apiClient.post("/applications/register", data);
    },


};
