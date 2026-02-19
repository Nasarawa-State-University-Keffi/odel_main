import apiClient from "@/lib/api";
import { Student, StudentStats, RegisteredCourse, PaginatedResponse, StudentQueryParams, Deferment } from "@/features/admin/types/student";

// Helper to normalize backend data to frontend Student interface
const normalizeStudent = (data: any): Student => {
    if (!data) return data;


    if (data.student && typeof data.student === 'object') {
        data = { ...data, ...data.student };
    }

    const student = { ...data };

    // Map registrationNumber to matricNumber if missing
    if (!student.matricNumber) {
        if (student.registrationNumber) student.matricNumber = student.registrationNumber;
        else if (student.matric_number) student.matricNumber = student.matric_number;
        else if (student.registration_number) student.matricNumber = student.registration_number;
        else if (student.userId) student.matricNumber = student.userId;
    }

    // Map common snake_case fields to camelCase
    if (!student.firstName && student.first_name) student.firstName = student.first_name;
    if (!student.lastName && student.last_name) student.lastName = student.last_name;
    if (!student.middleName && student.middle_name) student.middleName = student.middle_name;
    if (!student.email && student.email_address) student.email = student.email_address;

    // Handle Programme/Level if flattened
    if (!student.programmeType && student.programme_type) {
        // If it's an ID or string, we might need an object wrapper, or if it's already an object
        student.programmeType = typeof student.programme_type === 'object' ? student.programme_type : { name: student.programme_type, id: 0 };
    }

    // Handle Faculty if flattened or missing
    if (!student.faculty) {
        if (student.faculty_id || student.faculty_name) {
            student.faculty = {
                id: student.faculty_id || 0,
                name: student.faculty_name || 'Unknown Faculty'
            };
        } else if (student.department && student.department.faculty) {
            student.faculty = student.department.faculty;
        } else if (student.programme && student.programme.department && student.programme.department.faculty) {
            student.faculty = student.programme.department.faculty;
        }
    }

    // Some endpoints might return 'level_title' or 'level_name'
    if (!student.level) {
        if (student.level_title || student.level_name) {
            student.level = { id: 0, title: student.level_title || student.level_name };
        }
    }

    // Ensure user object exists if flat structure
    if (!student.user && (student.enabled !== undefined || student.creationTime)) {
        student.user = {
            enabled: student.enabled ?? false,
            creationTime: student.creationTime || new Date().toISOString(),
        };
    }

    return student;
};

//HANDLES ALL STUDENT SERVICES

export const studentService = {

    getStudentStats: async (session: number): Promise<StudentStats> => {
        const response = await apiClient.get<StudentStats>(
            "/students/get-stats",
            { params: { session } }
        );
        return response.data;
    },

    getAllStudents: async (
        params: StudentQueryParams
    ): Promise<PaginatedResponse<Student>> => {
        const response = await apiClient.get<PaginatedResponse<Student>>(
            "/students/all-students",
            { params }
        );
        if (response.data && response.data.content) {
            response.data.content = response.data.content.map(normalizeStudent);
        }


        return response.data;
    },

    getStudentById: async (id: number): Promise<Student> => {
        const response = await apiClient.get<Student>(
            `/students/get-by-id/${id}`
        );
        const rawData = (response.data as any).data || response.data;
        return normalizeStudent(rawData);
    },

    getRegisteredCourses: async (
        studentId: number | string,
        session?: number,
        semester?: number
    ): Promise<RegisteredCourse[]> => {
        const response = await apiClient.get<RegisteredCourse[]>(
            "/students/get-registered-course",
            { params: { student: studentId, session, semester } }
        );

        console.log('registered courses', response.data);
        return response.data;
    },

    // HANDLE GET STUDENTS BY PROGRAMME AND LEVEL
    getStudentsByProgrammeAndLevel: async (
        programmeId: number,
        levelId: number,
        page = 0,
        size = 10
    ): Promise<PaginatedResponse<Student>> => {
        const response = await apiClient.get<PaginatedResponse<Student>>(
            `/students/fetch-programme-level/${programmeId}/${levelId}`,
            { params: { page, size } }
        );
        if (response.data && response.data.content) {
            response.data.content = response.data.content.map(normalizeStudent);
        }
        return response.data;
    },

    // HANDLE GET STUDENTS BY DEPARTMENT
    getStudentsByDepartment: async (
        departmentId: number,
        levelId: number,
        page = 0,
        size = 10
    ): Promise<PaginatedResponse<Student>> => {
        const response = await apiClient.get<PaginatedResponse<Student>>(
            `/students/fetch-department-level/${departmentId}/${levelId}`,
            { params: { page, size } }
        );
        if (response.data && response.data.content) {
            response.data.content = response.data.content.map(normalizeStudent);
        }
        return response.data;
    },


    // HANDLE GET ALL STUDENTS AT A SPECIFIC SESSION, PROGRAMME AND LEVEL
    getAllStudentsAt: async (
        session: number,
        programme: number,
        level: number
    ): Promise<Student[]> => {
        const response = await apiClient.get<Student[]>(
            "/students/all-students-at",
            { params: { session, programme, level } }
        );
        const rawData = (response.data as any).data || response.data;
        const dataArray = Array.isArray(rawData) ? rawData : [rawData];
        return dataArray.map(normalizeStudent);
    },


    // HANDLE STUDENT SUSPENSION
    suspendStudent: async (id: number): Promise<void> => {
        await apiClient.post(`/students/suspend/${id}`);
    },

    // HANDLE STUDENT SUSPENSION WITH REASON
    suspendStudentWithReason: async (sessionId: number, userId: string, reason: string): Promise<void> => {
        await apiClient.post(`/students/suspend/${sessionId}`, {
            studentId: userId,
            reason
        });
    },


    // HANDLE STUDENT RUSTICATION
    rusticateStudent: async (studentMatric: string): Promise<void> => {
        await apiClient.put(`/students/rusticate`, null, {
            params: { "student-matric": studentMatric }
        });
    },

    // HANDLE STUDENT WITHDRAWAL
    withdrawStudent: async (studentMatric: string): Promise<void> => {
        await apiClient.put(`/students/withdraw`, null, {
            params: { "student-matric": studentMatric }
        });
    },

    // HANDLE CANCEL SUSPENSION
    cancelSuspension: async (suspendId: number, sessionId: number): Promise<void> => {
        await apiClient.put(`/students/suspend/cancel/${suspendId}/${sessionId}`);
    },

    // HANDLE  STUDETNT SEARCH VIA STRING, PRGRAMME TYPE AND DEPARTMENT
    searchStudents: async (
        q: string,
        programme_type?: number,
        department?: number
    ): Promise<Student[]> => {
        const response = await apiClient.get<Student[]>("/students/search", {
            params: { q, programme_type, department },
        });
        const rawData = (response.data as any).data || response.data;
        const dataArray = Array.isArray(rawData) ? rawData : [rawData];
        return dataArray.map(normalizeStudent);
    },

    // HANDLE STUDENT SEARCH BY EXTENSION
    searchStudentExtension: async (query: string): Promise<Student[]> => {
        const response = await apiClient.get<any>("/students/search-extension", {
            params: { query },
        });

        // Handle standard wrapper { data: ... }
        let rawData = response.data?.data || response.data;

        // Handle PaginatedResponse { content: ... }
        if (rawData && Array.isArray(rawData.content)) {
            rawData = rawData.content;
        }

        const dataArray = Array.isArray(rawData) ? rawData : [rawData];
        console.log('data gotten from search extension endpoint', dataArray)
        return dataArray.map(normalizeStudent);
    },

    // HANDLE GENERAL STUDENT FIND
    findStudents: async (q: string, programme_type?: number, department?: number): Promise<Student[]> => {
        try {
            const response = await apiClient.get<Student[]>("/students/search", {
                params: { q, programme_type, department },
            });
            const rawData = (response.data as any).data || response.data;
            const dataArray = Array.isArray(rawData) ? rawData : [rawData];
            return dataArray.map(normalizeStudent);
        } catch (error: any) {
            if (error.response && (error.response.status === 400 || error.response.status === 404)) {
                return [];
            }
            throw error;
        }
    },


    //HANDLES SEARCH BY MATRIC 
    getStudentByMatric: async (userId: string): Promise<Student> => {
        const response = await apiClient.get<Student>(`/students/get-by-matric/${userId}`);
        const rawData = (response.data as any).data || response.data;
        return normalizeStudent(rawData);
    },

    // HANDLE DOWNLOAD REPORT
    downloadReport: async (params: any): Promise<Blob> => {
        const response = await apiClient.get("/students/download-report", {
            params,
            responseType: "blob",
        });
        return response.data;
    },


    // HANDLE GET ALL DEFERMENTS
    getAllDeferments: async (page: number, size: number): Promise<PaginatedResponse<Deferment>> => {
        const response = await apiClient.get<PaginatedResponse<Deferment>>("/students/all-deferment", {
            params: { page, size }
        });

        return response.data;
    },

    // HANDLE GET STUDENT RESULT
    getStudentResult: async (matricNumber: string): Promise<any> => {
        const response = await apiClient.get<any>("/students/get-result", {
            params: { "student-matric": matricNumber }
        });
        return response.data;
    },

    // HANDLE GET SUSPENSIONS AND EXTENSIONS
    getSuspensionsAndExtensions: async (programmeType: number, departmentId: number): Promise<any> => {
        const response = await apiClient.get<any>(`/students/suspensions-and-extensions/${programmeType}/department/${departmentId}`);
        return response.data;
    },

    // HANDLE GET SUSPENSIONS AND EXTENSIONS BY PROGRAMME TYPE
    getSuspensionsAndExtensionsByType: async (programmeType: number): Promise<any> => {
        const response = await apiClient.get<any>(`/students/suspensions-and-extensions/${programmeType}`);
        return response.data;
    },



    // HANDLE REGENERATE MATRIC
    regenerateMatric: async (studentId: string): Promise<void> => {
        await apiClient.put(`/students/regenerate-matric`, { id: studentId });
    },

    // HANDLE PROBATE STUDENT
    probateStudent: async (userId: string): Promise<void> => {
        await apiClient.put(`/students/probate`, null, {
            params: { "student-matric": userId }
        });
    },

    // HANDLE DOWNGRADE STUDENT LEVEL
    downgradeStudentLevel: async (studentId: string, maintainPromotion: boolean = true): Promise<void> => {
        await apiClient.put(`/students/downgrade-student-level`, {
            id: studentId,
            maintainPromotion
        });
    },

    // HANDLE CANCEL DEFERMENT
    cancelDeferment: async (defermentId: number, studentId: number): Promise<void> => {
        await apiClient.put(`/students/defer/cancel/${defermentId}/${studentId}`);
    },

    // HANDLE UPGRADE STUDENT LEVEL
    upgradeStudentLevel: async (studentId: number, sessionId: number): Promise<void> => {
        await apiClient.post(`/students/upgrade-level`, {
            studentId,
            sessionId
        });
    },

    // HANDLE REGISTER COURSE
    registerCourse: async (payload: { course: number; studentMatric: string; sessionId: number; semesterId: number }): Promise<void> => {
        await apiClient.post(`/students/register-course`, payload);
    },

    // GET COURSES BY PROGRAMME
    getCoursesByProgramme: async (programmeId: number): Promise<any[]> => {
        const response = await apiClient.get<any[]>(`/course/all/programme/${programmeId}`);
        return response.data;
    }
};