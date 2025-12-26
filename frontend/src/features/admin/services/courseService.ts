import apiClient from "@/lib/api";
import { CourseRegistrationPayload, ProgrammeCourse, CreateCourseRequest, CourseLecturer, CourseQueryParams, CourseWithApproval } from "../types/course";


export const courseService = {
    // HANDLES REGISTER COURSE FOR STUDENT
    registerCourse: async (payload: CourseRegistrationPayload): Promise<void> => {
        await apiClient.post("/registered-courses/register", payload);
    },

    //HANDLES GET ALL COURSES FOR A PROGRAMME
    getAllCoursesByProgramme: async (programmeId: number): Promise<ProgrammeCourse[]> => {
        const response = await apiClient.get<ProgrammeCourse[]>(`/course/all/programme/${programmeId}`);
        return response.data;
    },

    // HANDLES COOURSE CREATION
    createCourse: async (data: CreateCourseRequest): Promise<any> => {
        const response = await apiClient.post("/course/create", data);
        return response.data;
    },


    // HANDLE UPDATE COURSE
    updateCourse: async (id: number, data: CreateCourseRequest): Promise<any> => {
        const response = await apiClient.put(`/course/update/${id}`, data);
        return response.data;
    },


    // HANDLE GET LECTURERS BY COURSE
    getLecturersByCourse: async (courseId: number): Promise<CourseLecturer[]> => {
        const response = await apiClient.get<CourseLecturer[]>(`/course/get-lecturers/${courseId}`);
        return response.data;
    },

    //HANDLE GET ALL COURSES
    getAllCourses: async (params: CourseQueryParams): Promise<ProgrammeCourse[]> => {
        const response = await apiClient.get<ProgrammeCourse[]>('/course/all', { params });
        return response.data;
    },

    // HANDLE GET COURSES FOR DEPARTMENT APPROVAL
    getCoursesForDepartmentApproval: async (sessionId: number, semester: number, departmentId: number): Promise<CourseWithApproval[]> => {
        const response = await apiClient.get<CourseWithApproval[]>(`/course/all/department-for-approval/${sessionId}/${semester}/${departmentId}`);
        return response.data;
    },

    // HANDLE GET COURSES FOR FACULTY APPROVAL
    getCoursesForFacultyApproval: async (sessionId: number, semester: number, departmentId: number): Promise<CourseWithApproval[]> => {
        const response = await apiClient.get<CourseWithApproval[]>(`/course/all/department-for-approval-faculty/${sessionId}/${semester}/${departmentId}`);
        return response.data;
    },

    // HANDLE GET COURSES FOR PROGRAMME APPROVAL
    getCoursesForProgrammeApproval: async (programmeTypeId: number, sessionId: number, semester: number, programmeId: number): Promise<CourseWithApproval[]> => {
        const response = await apiClient.get<CourseWithApproval[]>(`/course/all/programme-for-approval/${programmeTypeId}/${sessionId}/${semester}/${programmeId}`);
        return response.data;
    },


    // HANDLE ASSIGN LECTURERS TO A COURSE
    assignLecturers: async (courseId: number, lecturers: number[]): Promise<any> => {
        const response = await apiClient.post(`/course/assign-lecturers/${courseId}`, { lecturers });
        return response.data;
    },

    //HANDLE LECTURER REMOVAL FROM A COURSE
    removeLecturer: async (courseId: number, staffId: string): Promise<any> => {
        const response = await apiClient.put(`/course/un-assign-lecturer/${courseId}`, staffId, {
            headers: { "Content-Type": "text/plain" }
        });
        return response.data;
    },

    // HANDLE GET REGISTERED STUDENTS
    getRegisteredStudents: async (courseId: number, sessionId: number, semester: number, page: number, size: number): Promise<any> => {
        const response = await apiClient.get<any>(`/course/registered-students/${courseId}/${sessionId}/${semester}`, {
            params: { page, size }
        });
        return response.data;
    },

    // HANDLE DOWNLOAD REGISTERED STUDENTS
    downloadRegisteredStudents: async (courseId: number, sessionId: number, semester: number): Promise<void> => {
        const response = await apiClient.get(`/course/registered-students-download/${courseId}/${sessionId}/${semester}`, {
            responseType: 'blob', // Important for file download
        });

        // Trigger download
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'registered_students.xlsx');
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },

    // HANDLE GET COURSES FOR STUDENT
    getStudentRegisteredCourses: async (studentId: string, sessionId: number, semesterId: number): Promise<any> => {
        const response = await apiClient.get('/course/get-for-student', {
            params: { student: studentId, session: sessionId, semester: semesterId }
        });
        return response.data;
    },

    // HANDLE GET COURSES FOR STUDENT (ADMINISTRATIVE)
    getStudentRegisteredCoursesAdministrative: async (studentId: string, semesterId: number): Promise<any> => {
        const response = await apiClient.get('/course/get-for-student-administrative', {
            params: { student: studentId, semester: semesterId }
        });
        return response.data;
    },

    // HANDLE UNREGISTER COURSE FOR STUDENT (ADMINISTRATIVE)
    unregisterCourseAdministrative: async (studentId: string, registeredCourseId: number): Promise<void> => {
        await apiClient.post('/course/unregister-administrative', null, {
            params: { student: studentId, registered_course: registeredCourseId }
        });
    },

    // HANDLE GET COURSE PREREQUISITES
    getCoursePrerequisites: async (courseId: number): Promise<ProgrammeCourse[]> => {
        const response = await apiClient.get<ProgrammeCourse[]>(`/course/prerequisites/all/${courseId}`);
        return response.data;
    },

    // HANDLE ADD COURSE PREREQUISITE
    addCoursePrerequisite: async (courseId: number, prerequisiteId: number): Promise<string> => {
        const response = await apiClient.put(`/course/prerequisites/add/${courseId}`, { prerequisiteId });
        return response.data;
    },

    // HANDLE REMOVE COURSE PREREQUISITE
    removeCoursePrerequisite: async (courseId: number, prerequisiteId: number): Promise<string> => {
        const response = await apiClient.put(`/course/prerequisites/remove/${courseId}`, { prerequisiteId });
        return response.data;
    },

    // HANDLE SET MAIN LECTURER FOR A COURSE
    setMainLecturer: async (courseId: number, staffId: string): Promise<ProgrammeCourse> => {
        const response = await apiClient.put<ProgrammeCourse>(`/course/set-main-lecturer/${courseId}`, { staffId });
        return response.data;
    },

    // HANDLE DELETE COURSE
    deleteCourse: async (courseId: number): Promise<void> => {
        await apiClient.delete(`/course/delete/${courseId}`);
    },

    // HANDLE UPLOAD COURSES
    uploadCourses: async (file: File, programmeType: number, level: number): Promise<any> => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("programme_type", programmeType.toString());
        formData.append("level", level.toString());

        const response = await apiClient.post("/course/upload", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data;
    },

    // HANDLE SEARCH COURSES
    searchCourses: async (programmeType: number, query: string): Promise<ProgrammeCourse[]> => {
        const response = await apiClient.get<ProgrammeCourse[]>("/course/search", {
            params: { programme_type: programmeType, query }
        });
        return response.data;
    },

    // HANDLE BULK STUDENT DEREGISTRATION
    deregisterAllStudents: async (
        courseId: number,
        semesterId: number,
        programmeId: number,
        removeResult: boolean,
        levelId?: number
    ): Promise<void> => {
        await apiClient.delete("/course/deregister-all", {
            params: {
                courseId,
                semesterId,
                programmeId,
                removeResult,
                levelId
            }
        });
    },

    // HANDLE BULK STUDENT REGISTRATION
    bulkRegisterStudents: async (
        file: File,
        courseId: number,
        semesterId: number,
        includeUnpaid: boolean
    ): Promise<{ success: number; failed: number; errors: string[] }> => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("course", courseId.toString());
        formData.append("semester", semesterId.toString());
        formData.append("includeUnpaid", includeUnpaid.toString());

        const response = await apiClient.post("/course/bulk-registration", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data;
    },
};



