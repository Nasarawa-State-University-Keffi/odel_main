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

//BASE URL FOR THE PROGRAMME SETTINGS
const BASE_URL = '/programme-settings';

export const programmeSettingsService = {

    //HANDLES PROGRAMMES FETCHING
    fetchProgrammeSettings: async (params: FetchProgrammeSettingsParams): Promise<ProgrammeSettingsResponse> => {
        try {
            const response = await apiClient.get<ProgrammeSettingsResponse>(`${BASE_URL}/fetch`, {
                params
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    //HANDLES FETCHING REGISTERED COURSES UNDER A PROGRAMME
    fetchUnregisteredCourses: async (params: FetchProgrammeSettingsParams): Promise<any[]> => {
        try {
            const response = await apiClient.get<any[]>(`${BASE_URL}/fetch-unregistered-course`, {
                params
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    //HANDLES ADDING COURSES TO A PROGRAMME
    addCoursesToProgramme: async (programmeId: number, data: AddCoursesToProgrammeRequest): Promise<AddCoursesToProgrammeResponse[]> => {
        try {
            const response = await apiClient.post<AddCoursesToProgrammeResponse[]>(`${BASE_URL}/add-courses-to-programme/programme/${programmeId}`, data);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    //HANDLES UPLOADING COURSES TO A PROGRAMME
    uploadCourses: async (file: File, programmeId: number, semesterId: number): Promise<UploadCoursesResponse> => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('programme', programmeId.toString());
            formData.append('semester', semesterId.toString());

            const response = await apiClient.post<UploadCoursesResponse>(`${BASE_URL}/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    //HANDLES DELETING A COURSE FROM A PROGRAMME
    deleteCourseFromProgramme: async (idToDelete: number): Promise<void> => {
        try {
            await apiClient.delete(`${BASE_URL}/delete-course-from-programme/${idToDelete}`);
        } catch (error) {
            throw error;
        }
    },

    //HANDLES DELETING A COURSE FROM A PROGRAMME ADMIN
    deleteCourseFromProgrammeAdmin: async (idToDelete: number): Promise<void> => {
        try {
            await apiClient.delete(`${BASE_URL}/delete-course-from-programme-admin/${idToDelete}`);
        } catch (error) {
            throw error;
        }
    },

    //HANDLES RE-ENABLING A COURSE IN A PROGRAMME
    reEnableCourseForProgramme: async (idToEnable: number): Promise<any> => {
        try {
            const response = await apiClient.put(`${BASE_URL}/re-enable-course-for-programme/${idToEnable}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    //HANDLES UPDATING SEMESTER SETTINGS
    updateSemesterSettings: async (settingId: number, data: UpdateSemesterSettingsRequest): Promise<SemesterSettings> => {
        try {
            const response = await apiClient.put<SemesterSettings>(`${BASE_URL}/${BASE_URL}/update/${settingId}`, data);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    //HANDLES UPDATING A COURSE IN A PROGRAMME
    updateCourse: async (data: UpdateProgrammeCourseRequest): Promise<UpdateProgrammeCourseResponse> => {
        try {
            const response = await apiClient.post<UpdateProgrammeCourseResponse>(`${BASE_URL}/${BASE_URL}/update-course`, data);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    //HANDLES EDITING A COURSE IN A PROGRAMME
    editProgrammeCourse: async (courseId: number, data: EditProgrammeCourseRequest): Promise<UpdateProgrammeCourseResponse> => {
        try {
            const response = await apiClient.put<UpdateProgrammeCourseResponse>(`${BASE_URL}/edit-programme-course/${courseId}`, data);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    //HANDLES SYNCING OPTIONAL SEMESTER
    syncOptionalSemester: async (semesterId: number): Promise<void> => {
        try {
            console.log("Sending sync request for semester:", semesterId);
            await apiClient.post(`${BASE_URL}/sync-optional-semester`, { semester: semesterId });
        } catch (error) {
            throw error;
        }
    },

    //HANDLES DOWNLOADING COURSE REPORT
    downloadCourseReport: async (semesterId: number, filterType: 'programme' | 'department' | 'faculty', filterId: number): Promise<Blob> => {
        try {
            const params = new URLSearchParams();
            params.append('semester', semesterId.toString());
            params.append(filterType, filterId.toString());

            const response = await apiClient.get(`${BASE_URL}/download-course-report`, {
                params,
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};
