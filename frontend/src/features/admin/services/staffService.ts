import apiClient from "@/lib/api";
import {
    CreateStaffRequest,
    Staff,
    UpdateStaffRequest,
    Level,
    UpdateStaffFromAdminRequest,
    Programme,
    PaginatedResponse
} from "../types/staff";
export const staffService = {
    getAllStaff: async (): Promise<Staff[]> => {
        const response = await apiClient.get<Staff[]>('/staff/all');
        return response.data;
    },


    // HANDLES THE PAGINATION (PAGE AND SIZE)

    getAllStaffPaginated: async (page: number, size: number): Promise<PaginatedResponse<Staff>> => {
        const response = await apiClient.get<PaginatedResponse<Staff>>(`/staff/all-paginated?page=${page}&size=${size}`);
        return response.data;
    },

    // HANDLES STAFF FILTERING BY ID

    getStaffById: async (staffId: string): Promise<Staff> => {
        const response = await apiClient.get<Staff>(`/staff/staff-id?staff_id=${staffId}`);
        return response.data;
    },

    // HANDLES STAFF FILTERING BY EMAIL

    getStaffByEmail: async (email: string): Promise<Staff> => {
        const response = await apiClient.get<Staff>(`/staff/get-by-email/${email}`);
        return response.data;
    },

    // HANDLES STAFF SEARCH
    searchStaff: async (query: string, departmentId?: number): Promise<Staff[]> => {
        try {
            const response = await apiClient.get<Staff[]>('/staff/search', {
                params: { query, department: departmentId }
            });
            return response.data;
        } catch (error: any) {
            const status = error.response?.status;
            const message = error.response?.data?.message || error.response?.data || "Failed to search staff";

            if (status === 422) {
                throw new Error("Invalid search query");
            }
            if (status === 403) {
                throw new Error("Access denied");
            }

            throw new Error(message);
        }
    },

    // HANDLES FETCHING LECTURERS BY FACULTY
    getLecturersByFaculty: async (facultyId: number): Promise<Staff[]> => {
        const response = await apiClient.get<Staff[]>((`/staff/staffs/faculty/${facultyId}`));
        const rawData = (response.data as any).data || response.data;
        return Array.isArray(rawData) ? rawData : [];
    },

    // HANDLES FETCHING LECTURERS BY DEPARTMENT
    getLecturersByDepartment: async (departmentId: number): Promise<Staff[]> => {
        const response = await apiClient.get<Staff[]>((`/staff/staffs/department/${departmentId}`));
        const rawData = (response.data as any).data || response.data;
        return Array.isArray(rawData) ? rawData : [];
    },



    // HANDLES FETCHING ASSIGNED COURSES
    getAssignedCourses: async (programmeType: number, staffId: number) => {
        const response = await apiClient.get(`/staff/get-assigned-courses/${programmeType}/${staffId}`);
        return response.data;
    },

    // HANDLES FETCHING ASSIGNED COURSES WITH APPROVALS
    getAssignedCoursesWithApprovals: async (programmeType: number, sessionId: number, semester: number, staffId: string) => {
        const response = await apiClient.get(`/staff/get-assigned-courses-with-approvals/${programmeType}/${sessionId}/${semester}/${staffId}`);
        return response.data;
    },

    // GET SENATE MEMBERS
    getSenateMembers: async (): Promise<Staff[]> => {
        const response = await apiClient.get<Staff[]>('/staff/senates');
        return response.data;
    },



    // HANDLES STAFF CREATION
    createStaff: async (data: CreateStaffRequest): Promise<Staff> => {
        try {
            const response = await apiClient.post<Staff>('/staff/create', data);
            return response.data;
        } catch (error: any) {
            const status = error.response?.status;
            const message = error.response?.data?.message || error.response?.data || "Failed to create staff member";

            if (status === 422) {
                if (message.includes("userId")) throw new Error("Staff with same Staff ID already exists");
                if (message.includes("email")) throw new Error("Staff with same Email already exists");
                throw new Error(message || "Staff with same credentials already exists");
            }
            if (status === 404) {
                throw new Error("Title, Department, or Programme type not found");
            }
            if (status === 400) {
                throw new Error("Invalid role or academic staff configuration");
            }
            if (status === 403) {
                throw new Error("Access denied: Admin privileges required");
            }

            throw new Error(message);
        }
    },

    // HANDLES STAFF UPDATE (SELF/BASIC)
    updateStaff: async (data: UpdateStaffRequest): Promise<Staff> => {
        try {
            const response = await apiClient.put<Staff>('/staff/update', data);
            return response.data;
        } catch (error: any) {
            const status = error.response?.status;
            const message = error.response?.data?.message || error.response?.data || "Failed to update profile";

            if (status === 404) {
                throw new Error("User not found");
            }
            if (status === 422) {
                if (message.includes("phone")) throw new Error("Phone number already exists");
                throw new Error(message || "Unprocessable Entity");
            }

            throw new Error(message);
        }
    },

    // HANDLES STAFF UPDATE FROM ADMIN
    updateStaffFromAdmin: async (id: number, data: UpdateStaffFromAdminRequest): Promise<Staff> => {
        try {
            const response = await apiClient.put<Staff>(`/staff/update-from-admin/${id}`, data);
            return response.data;
        } catch (error: any) {
            const status = error.response?.status;
            const message = error.response?.data?.message || error.response?.data || "Failed to update staff member";

            if (status === 404) {
                throw new Error("Staff not found");
            }
            if (status === 422) {
                if (message.includes("email")) throw new Error("Email already taken");
                if (message.includes("department")) throw new Error("Invalid Department");
                throw new Error(message || "Unprocessable Entity");
            }
            if (status === 400) {
                throw new Error("Invalid role or department required for selected roles");
            }
            if (status === 403) {
                throw new Error("Access denied: Admin privileges required");
            }

            throw new Error(message);
        }
    },


};
