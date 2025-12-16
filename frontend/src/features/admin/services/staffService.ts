import apiClient from "@/lib/api";
import { CreateStaffRequest, Staff, UpdateStaffRequest } from "../types/staff";
export type { CreateStaffRequest, Staff, UpdateStaffRequest };

// Define Interfaces for Metadata
export interface Title { id: number; title: string; value: string; }
export interface Department { id: number; name: string; faculty: any; }
export interface Faculty { id: number; name: string; }

export interface ProgrammeType { id: number; name: string; }
export interface Role { id: number; name: string; value: string; guard_name: string; }


// HANDLES STAFF OPERATIONS
// In-memory cache variables
let titlesCache: Title[] | null = null;
let departmentsCache: Department[] | null = null;
let facultiesCache: Faculty[] | null = null;

let programmeTypesCache: ProgrammeType[] | null = null;
let rolesCache: Role[] | null = null;

// Pagination Response Interface
export interface PaginatedResponse<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    last: boolean;
    size: number;
    number: number;
    sort: any;
    numberOfElements: number;
    first: boolean;
    empty: boolean;
}

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

    // HANDLES STAFF FILTERING BY SENATE

    getSenates: async (): Promise<string[]> => {
        const response = await apiClient.get<string[]>('/staff/senates');
        return response.data;
    },


    // HANDLES STAFF CREATION
    createStaff: async (data: CreateStaffRequest): Promise<Staff> => {
        const response = await apiClient.post<Staff>('/staff/create', data);
        return response.data;
    },

    // HANDLES STAFF UPDATE
    updateStaff: async (data: UpdateStaffRequest): Promise<Staff> => {
        const response = await apiClient.put<Staff>('/staff/update', data);
        return response.data;
    },

    // Metadata Fetchers with Caching
    getAllTitles: async (): Promise<Title[]> => {
        if (titlesCache) return titlesCache;
        const response = await apiClient.get<Title[]>('/basic-information/get-titles');
        titlesCache = response.data;
        return response.data;
    },

    // HANDLES ALL DEPARTMENT FETCHING
    getAllDepartments: async (): Promise<Department[]> => {
        if (departmentsCache) return departmentsCache;
        const response = await apiClient.get<Department[]>('/department/all');
        departmentsCache = response.data;
        return response.data;
    },


    // HANDLES ALL FACULTIES FETCHING
    getAllFaculties: async (): Promise<Faculty[]> => {
        if (facultiesCache) return facultiesCache;
        const response = await apiClient.get<Faculty[]>('/setup/faculty');
        facultiesCache = response.data;
        return response.data;
    },

    // HANDLES ALL PROGRAMME TYPES FETCHING
    getAllProgrammeTypes: async (): Promise<ProgrammeType[]> => {
        if (programmeTypesCache) return programmeTypesCache;
        const response = await apiClient.get<ProgrammeType[]>('/setup/programme-type');
        programmeTypesCache = response.data;
        return response.data;
    },

    // HANDLES ALL ROLES FETCHING
    getAllRoles: async (): Promise<Role[]> => {
        if (rolesCache) return rolesCache;
        const response = await apiClient.get<Role[]>('/system/settings/get-roles');
        rolesCache = response.data;
        return response.data;
    }
};
