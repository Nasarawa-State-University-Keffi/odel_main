import apiClient from "@/lib/api";
import {
    ProgrammeSettingsResponse,
    FetchProgrammeSettingsParams,
    AddCoursesToProgrammeRequest,
    AddCoursesToProgrammeResponse,
    UploadCoursesResponse,
    UpdateSemesterSettingsRequest,
    SemesterSettings,
    UpdateProgrammeCourseRequest,
    UpdateProgrammeCourseResponse,
    EditProgrammeCourseRequest
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
    },

    uploadCourses: async (file: File, programmeId: number, semesterId: number): Promise<UploadCoursesResponse> => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('programme', programmeId.toString());
            formData.append('semester', semesterId.toString());

            const response = await apiClient.post<UploadCoursesResponse>('/programme-settings/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    deleteCourseFromProgramme: async (idToDelete: number): Promise<void> => {
        try {
            await apiClient.delete(`/programme-settings/delete-course-from-programme/${idToDelete}`);
        } catch (error) {
            throw error;
        }
    },

    deleteCourseFromProgrammeAdmin: async (idToDelete: number): Promise<void> => {
        try {
            await apiClient.delete(`/programme-settings/delete-course-from-programme-admin/${idToDelete}`);
        } catch (error) {
            throw error;
        }
    },

    reEnableCourseForProgramme: async (idToEnable: number): Promise<any> => {
        try {
            const response = await apiClient.put(`/programme-settings/re-enable-course-for-programme/${idToEnable}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    updateSemesterSettings: async (settingId: number, data: UpdateSemesterSettingsRequest): Promise<SemesterSettings> => {
        try {
            const response = await apiClient.put<SemesterSettings>(`/programme-settings/programme-settings/update/${settingId}`, data);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    updateCourse: async (data: UpdateProgrammeCourseRequest): Promise<UpdateProgrammeCourseResponse> => {
        try {
            const response = await apiClient.post<UpdateProgrammeCourseResponse>('/programme-settings/programme-settings/update-course', data);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    editProgrammeCourse: async (courseId: number, data: EditProgrammeCourseRequest): Promise<UpdateProgrammeCourseResponse> => {
        try {
            const response = await apiClient.put<UpdateProgrammeCourseResponse>(`/programme-settings/edit-programme-course/${courseId}`, data);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    syncOptionalSemester: async (semesterId: number): Promise<void> => {
        try {
            console.log("Sending sync request for semester:", semesterId);
            await apiClient.post('/programme-settings/sync-optional-semester', { semester: semesterId });
        } catch (error) {
            throw error;
        }
    },

    downloadCourseReport: async (semesterId: number, filterType: 'programme' | 'department' | 'faculty', filterId: number): Promise<Blob> => {
        try {
            const params = new URLSearchParams();
            params.append('semester', semesterId.toString());
            params.append(filterType, filterId.toString());

            const response = await apiClient.get('/programme-settings/download-course-report', {
                params,
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};
