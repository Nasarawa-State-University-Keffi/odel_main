import apiClient from "@/lib/api";
import { CreateStaffRequest, Staff } from "../types/staff";
export type { CreateStaffRequest, Staff };

// Define Interfaces for Metadata
export interface Title { id: number; title: string; value: string; }
export interface Department { id: number; name: string; faculty: any; }
export interface Faculty { id: number; name: string; }
export interface ProgrammeType { id: number; name: string; }


// HANDLES STAFF OPERATIONS
// In-memory cache variables
let titlesCache: Title[] | null = null;
let departmentsCache: Department[] | null = null;
let facultiesCache: Faculty[] | null = null;
let programmeTypesCache: ProgrammeType[] | null = null;

export const staffService = {
    getAllStaff: async (): Promise<Staff[]> => {
        const response = await apiClient.get<Staff[]>('/staff');
        return response.data;
    },


    // HANDLES STAFF CREATION
    createStaff: async (data: CreateStaffRequest): Promise<Staff> => {
        const response = await apiClient.post<Staff>('/staff/create', data);
        return response.data;
    },

    // Metadata Fetchers with Caching
    getAllTitles: async (): Promise<Title[]> => {
        if (titlesCache) return titlesCache;
        const response = await apiClient.get<Title[]>('/basic-information/get-titles');
        titlesCache = response.data;
        return response.data;
    },

    getAllDepartments: async (): Promise<Department[]> => {
        if (departmentsCache) return departmentsCache;
        const response = await apiClient.get<Department[]>('/setup/department');
        departmentsCache = response.data;
        return response.data;
    },

    getAllFaculties: async (): Promise<Faculty[]> => {
        if (facultiesCache) return facultiesCache;
        const response = await apiClient.get<Faculty[]>('/setup/faculty');
        facultiesCache = response.data;
        return response.data;
    },

    getAllProgrammeTypes: async (): Promise<ProgrammeType[]> => {
        if (programmeTypesCache) return programmeTypesCache;
        const response = await apiClient.get<ProgrammeType[]>('/setup/programme-type');
        programmeTypesCache = response.data;
        return response.data;
    }
};
