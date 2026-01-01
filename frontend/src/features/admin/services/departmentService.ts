import apiClient from "@/lib/api";
import { Department, DepartmentWithHod, Hod, Grade, Qualification } from "../types/department";


// BASE URL FOR DEPARMENT
const BASE_URL = '/department';


export const departmentService = {

    //HANDLE FETCHING OF DEPARTMENTS ALONG WITH HODS
    getAllDepartmentsWithHods: async (): Promise<DepartmentWithHod[]> => {
        try {
            const response = await apiClient.get<DepartmentWithHod[]>(`${BASE_URL}/all-with-hods`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // HANDLE DEPARTMENT CREATION
    createDepartment: async (data: { facultyId: number; name: string; code: string; }): Promise<Department> => {
        const response = await apiClient.post<Department>(`${BASE_URL}/create`, data);
        return response.data;
    },

    // HANDLE DEPARTMENT UPDATE
    updateDepartment: async (data: { id: number; facultyId: number; name: string; code: string; }): Promise<Department> => {
        const response = await apiClient.put<Department>(`${BASE_URL}/update`, data);
        return response.data;
    },

    // HANDLE DEPARTMENT DELETION
    deleteDepartment: async (id: number): Promise<void> => {
        await apiClient.delete(`${BASE_URL}/delete/${id}`);
    },

    // GET ALL HODs
    getHODs: async (): Promise<Hod[]> => {
        const response = await apiClient.get<Hod[]>(`${BASE_URL}/get-hods`);
        return response.data;
    },

    //HANDLES SETTING DEPARTMENT SIGNATURE
    setSignature: async (signature: string): Promise<string> => {
        const response = await apiClient.post(`${BASE_URL}/set-signature`, { signature });
        return response.data;
    },

    //HANDLES RESULT OPENING
    openResultAccess: async (departmentId: number): Promise<void> => {
        await apiClient.put(`${BASE_URL}/open-result-access/${departmentId}`);
    },

    //HANDLES RESULT CLOSING
    closeResultAccess: async (departmentId: number): Promise<void> => {
        await apiClient.put(`${BASE_URL}/close-result-access/${departmentId}`);
    },

    //HANDLES SCHEDULED RESULT UPLOAD CLOSING
    scheduleResultUploadClosing: async (departmentId: number, semester: number, date: string): Promise<void> => {
        await apiClient.put(`${BASE_URL}/semester-settings/schedule-result-upload-closing`, null, {
            params: {
                departmentId,
                semester,
                date
            }
        });
    },

    // HANDLES GRADUATION SERVICE
    runGraduationService: async (data: { programme: number; semester: number; date: string }): Promise<any> => {
        const response = await apiClient.put(`${BASE_URL}/graduation-service`, data);
        return response.data;
    },

    // HANDLES GETTING DEPARTMENT REQUIREMENTS
    getDepartmentRequirements: async (departmentId: number): Promise<any[]> => {
        const response = await apiClient.get(`${BASE_URL}/get-all-subjects/${departmentId}`);
        return response.data;
    },

    // TOGGLE COMPULSORY SUBJECT
    toggleCompulsorySubject: async (dsubjectId: number): Promise<any> => {
        const response = await apiClient.put(`${BASE_URL}/subjects/toggle-compulsory/${dsubjectId}`);
        return response.data;
    },

    // GET ALL GRADES (STRICTLY ODEL)
    getAllGrades: async (): Promise<Grade[]> => {
        // FETCH ALL UNDER ODEL
        const typesResponse = await apiClient.get<any[]>('/programme-type/get-all');
        const odelType = typesResponse.data.find((t: any) =>
            t.name.toLowerCase().includes('odel') ||
            (t.code && t.code.toLowerCase().includes('odel')) ||
            (t.school && t.school.name.toLowerCase().includes('odel'))
        );

        if (!odelType) {
            console.warn("ODEL Programme Type not found, defaulting to empty grades.");
            return [];
        }

        const response = await apiClient.get<Grade[]>('/grades/all', {
            params: { programme_type: odelType.id }
        });
        return response.data;
    },

    // UPDATE SUBJECT GRADES
    updateSubjectGrades: async (dsubjectId: number, gradeIds: number[]): Promise<any> => {
        const response = await apiClient.put(`${BASE_URL}/subjects/update-grades/${dsubjectId}`, { grades: gradeIds });
        return response.data;
    },

    // HANDLES GETTING SEMESTER SETTINGS
    getSemesterSettings: async (departmentId: number, semesterId: number): Promise<any> => {
        const response = await apiClient.get(`${BASE_URL}/semester-settings`, {
            params: { department: departmentId, semester: semesterId }
        });
        return response.data;
    },

    // HANDLES RESULT UPLOAD TOGGLE
    toggleResultUpload: async (departmentId: number, semesterId: number): Promise<{ resultUploadEnabled: boolean }> => {
        const response = await apiClient.put(`${BASE_URL}/semester-settings/toggle-result-upload/${departmentId}/${semesterId}`);
        return response.data;
    },

    //HANDLES RESULT CHECKING TOGGLE
    toggleResultChecking: async (departmentId: number, semesterId: number): Promise<{ resultCheckingEnabled: boolean }> => {
        const response = await apiClient.put(`${BASE_URL}/semester-settings/toggle-result-checking/${departmentId}/${semesterId}`);
        return response.data;
    },

    // HANDLES GETTING ALL SUBJECTS
    getAllSubjects: async (): Promise<any[]> => {
        const response = await apiClient.get(`/subject/all`);
        return response.data;
    },

    //HANDLES ADDING SSC SUBJECT
    addSSCESubject: async (departmentId: number, subjectId: number): Promise<any> => {
        const response = await apiClient.put(`${BASE_URL}/add-to-subjects/${departmentId}`, { subjectId });
        return response.data;
    },

    // HANDLES ADDING BULK SSC SUBJECTS
    addBulkSSCESubjects: async (departmentId: number, subjectIds: number[]): Promise<any[]> => {
        const response = await apiClient.put(`${BASE_URL}/add-all-to-subjects/${departmentId}`, subjectIds);
        return response.data;
    },

    //HANDLES REMOVING SSC SUBJECT
    removeSSCESubject: async (departmentId: number, subjectId: number): Promise<any> => {
        const response = await apiClient.put(`${BASE_URL}/remove-from-subjects/${departmentId}`, { subjectId });
        return response.data;
    },

    // HANDLE FETCHING OF DEPARTMENTS 
    getAllDepartments: async (): Promise<Department[]> => {
        const response = await apiClient.get<Department[]>(`${BASE_URL}/all`);
        return response.data;
    },

    // GET DEPARTMENTS ACCESSIBLE TO A STAFF MEMBER
    getDepartmentsForCurrentUser: async (staffId: string): Promise<Department[]> => {
        try {
            const response = await apiClient.get<Department[]>(`${BASE_URL}/for-current-user`, {
                params: { staff: staffId }
            });
            return response.data;
        } catch (error: any) {
            const status = error.response?.status;
            if (status === 404 || status === 400 || error.response?.data?.status === "400") {
                const message = error.response?.data?.message || "User not found";
                throw new Error(message);
            }
            throw error;
        }
    },

    // GET DEPARTMENTS ACCESSIBLE TO A STAFF MEMBER FILTERED BY FACULTY
    getDepartmentsForCurrentUserByFaculty: async (staffId: string, facultyId: number): Promise<Department[]> => {
        try {
            const response = await apiClient.get<Department[]>(`${BASE_URL}/for-current-user-faculty`, {
                params: { staff: staffId, faculty: facultyId }
            });
            return response.data;
        } catch (error: any) {
            const status = error.response?.status;
            if (status === 400 || status === 404 || error.response?.data?.status === "400") {
                const message = error.response?.data?.message || "User or Faculty not found";
                throw new Error(message);
            }
            throw error;
        }
    },

    // GET ALL QUALIFICATIONS (WAEC, NECO, etc.)
    getQualifications: async (): Promise<Qualification[]> => {
        const response = await apiClient.get<Qualification[]>('/basic-information/get-qualifications');
        return response.data;
    },

    // ADD ALLOWED QUALIFICATIONS FOR ADMISSION
    addAllowedQualifications: async (data: { departmentId: number; qualificationIds: number[] }): Promise<Department> => {
        try {
            const response = await apiClient.post<Department>(`${BASE_URL}/allowed-qualifications/add`, data);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 400) {
                const message = error.response?.data?.message || "Failed to add qualifications";
                throw new Error(message);
            }
            throw error;
        }
    },

    // REMOVE ALLOWED QUALIFICATIONS FOR ADMISSION
    removeAllowedQualifications: async (data: { departmentId: number; qualificationIds: number[] }): Promise<Department> => {
        try {
            const response = await apiClient.post<Department>(`${BASE_URL}/allowed-qualifications/remove`, data);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 400) {
                const message = error.response?.data?.message || "Failed to remove qualifications";
                throw new Error(message);
            }
            throw error;
        }
    },

    // REPLACE ALL ALLOWED QUALIFICATIONS FOR ADMISSION
    setAllowedQualifications: async (data: { departmentId: number; qualificationIds: number[] }): Promise<Department> => {
        try {
            const response = await apiClient.put<Department>(`${BASE_URL}/allowed-qualifications/set`, data);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 400) {
                const message = error.response?.data?.message || "Failed to set qualifications";
                throw new Error(message);
            }
            throw error;
        }
    },

    // GET ALLOWED QUALIFICATIONS FOR A DEPARTMENT
    getAllowedQualificationsForDepartment: async (departmentId: number): Promise<Qualification[]> => {
        try {
            const response = await apiClient.get<Qualification[]>(`${BASE_URL}/allowed-qualifications/${departmentId}`);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 404) {
                const message = error.response?.data?.message || "Department not found";
                throw new Error(message);
            }
            throw error;
        }
    }
};
