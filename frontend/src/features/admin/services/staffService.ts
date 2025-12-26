import apiClient from "@/lib/api";
import { CreateStaffRequest, Staff, UpdateStaffRequest, LevelAdviser } from "../types/staff";
export type { CreateStaffRequest, Staff, UpdateStaffRequest, LevelAdviser };

// Define Interfaces for Metadata
export interface Title { id: number; title: string; value: string; }
export interface Department { id: number; name: string; faculty: any; }
export interface Faculty { id: number; name: string; }

export interface ProgrammeType {
    id: number;
    name: string;
    code: string;
    modeOfStudy: string;
    school: {
        id: number;
        name: string;
        shortName: string;
    };
}


export interface Role { id: number; name: string; value: string; guard_name: string; }

export interface Gender {
    id: number;
    title: string;
    value: string;
}

export interface State {
    id: number;
    name: string;
    code: string;
    disabled: boolean;
}

export interface Country {
    id: number;
    name: string;
    code: string;
    states: State[];
    disabled: boolean;
}

export interface LGA {
    id: number;
    name: string;
    code: string;
}

export interface Level {
    id: number;
    title: string;
    value: string;
}

// HANDLES STAFF OPERATIONS
export interface UpdateStaffFromAdminRequest {
    titleId: number;
    userId: string;
    firstName: string;
    lastName: string;
    middleName: string;
    email: string;
    departmentId: number;
    academic: boolean;
    roles: string[];
    faculties: number[];
    departments: number[];
    programmeTypeId: number;
}
export interface Programme {
    id: number;
    name: string;
    code: string;
    department: {
        id: number;
        name: string;
    };
    programmeType: {
        id: number;
        name: string;
    };
    programmeDuration: number;
    availableOnline: boolean;
}

// In-memory cache variables
let titlesCache: Title[] | null = null;
let departmentsCache: Department[] | null = null;
let facultiesCache: Faculty[] | null = null;
let countriesCache: Country[] | null = null;
let gendersCache: Gender[] | null = null;
let lgasCache: Record<number, LGA[]> = {};
let levelsCache: Record<number, Level[]> = {};

let programmeTypesCache: ProgrammeType[] | null = null;
let programmesCache: Programme[] | null = null;
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

    // HANDLES FETCHING LEVEL ADVISERS BY DEPARTMENT
    getLevelAdvisers: async (departmentId: number): Promise<LevelAdviser[]> => {
        try {
            const response = await apiClient.get<LevelAdviser[] | { data: LevelAdviser[] }>(`/staff/get-level-advisers`, {
                params: { department: departmentId }
            });
            const rawData = (response.data as any).data || response.data;
            return Array.isArray(rawData) ? rawData : [];
        } catch (error: any) {
            if (error.response?.status === 404) {
                throw new Error("Department not found");
            }
            throw error;
        }
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

    // HANDLES UNMAKING STAFF A HOD
    unmakeHod: async (staffId: string): Promise<string> => {
        try {
            const response = await apiClient.put<string>(`/staff/unmake-hod/${staffId}`);
            return response.data;
        } catch (error: any) {
            const status = error.response?.status;
            const message = error.response?.data?.message || error.response?.data || "Failed to remove HOD role";

            if (status === 404) {
                throw new Error("Lecturer does not exist");
            }
            if (status === 403) {
                throw new Error("Access denied: Admin privileges required");
            }

            throw new Error(message);
        }
    },

    // HANDLES MAKING STAFF A HOD
    makeHod: async (staffId: string): Promise<string> => {
        try {
            const response = await apiClient.put<string>(`/staff/make-hod/${staffId}`);
            return response.data;
        } catch (error: any) {
            const status = error.response?.status;
            const message = error.response?.data?.message || error.response?.data || "Failed to make HOD";

            if (status === 404) {
                throw new Error("Lecturer does not exist");
            }
            if (status === 403) {
                throw new Error("Access denied: Admin privileges required");
            }

            throw new Error(message);
        }
    },

    // HANDLES MAKING STAFF A VC
    makeVC: async (staffId: string): Promise<Staff> => {
        try {
            const response = await apiClient.put<Staff>(`/staff/make-vc/${staffId}`);
            return response.data;
        } catch (error: any) {
            const status = error.response?.status;
            const message = error.response?.data?.message || error.response?.data || "Failed to assign role";

            if (status === 422) {
                throw new Error("Lecturer does not exist or invalid state");
            }
            if (status === 403) {
                throw new Error("Access denied: Admin privileges required");
            }

            throw new Error(message);
        }
    },

    // GET SENATE MEMBERS
    getSenateMembers: async (): Promise<Staff[]> => {
        const response = await apiClient.get<Staff[]>('/staff/senates');
        return response.data;
    },

    // HANDLES MAKING STAFF A DVC (ACADEMIC)
    makeDvcAcademic: async (staffId: string): Promise<Staff> => {
        try {
            const response = await apiClient.put<Staff>(`/staff/make-dvc-academics/${staffId}`);
            return response.data;
        } catch (error: any) {
            const status = error.response?.status;
            const message = error.response?.data?.message || error.response?.data || "Failed to assign role";

            if (status === 422) {
                throw new Error("Lecturer does not exist or invalid state");
            }
            if (status === 403) {
                throw new Error("Access denied: Admin privileges required");
            }

            throw new Error(message);
        }
    },

    // HANDLES MAKING STAFF A DVC (ADMINISTRATION)
    makeDvcAdministration: async (staffId: string): Promise<Staff> => {
        try {
            const response = await apiClient.put<Staff>(`/staff/make-dvc-administration/${staffId}`);
            return response.data;
        } catch (error: any) {
            const status = error.response?.status;
            const message = error.response?.data?.message || error.response?.data || "Failed to assign role";

            if (status === 422) {
                throw new Error("Lecturer does not exist or invalid state");
            }
            if (status === 403) {
                throw new Error("Access denied: Admin privileges required");
            }

            throw new Error(message);
        }
    },

    // HANDLES MAKING STAFF A BURSAR
    makeBursar: async (staffId: string): Promise<Staff> => {
        try {
            const response = await apiClient.put<Staff>(`/staff/make-bursar/${staffId}`);
            return response.data;
        } catch (error: any) {
            const status = error.response?.status;
            const message = error.response?.data?.message || error.response?.data || "Failed to assign role";

            if (status === 422) {
                throw new Error("Lecturer does not exist or invalid state");
            }
            if (status === 403) {
                throw new Error("Access denied: Admin privileges required");
            }

            throw new Error(message);
        }
    },

    // HANDLES MAKING STAFF A REGISTRAR
    makeRegistrar: async (staffId: string): Promise<Staff> => {
        try {
            const response = await apiClient.put<Staff>(`/staff/make-registerer/${staffId}`);
            return response.data;
        } catch (error: any) {
            const status = error.response?.status;
            const message = error.response?.data?.message || error.response?.data || "Failed to assign role";

            if (status === 422) {
                throw new Error("Lecturer does not exist or invalid state");
            }
            if (status === 403) {
                throw new Error("Access denied: Admin privileges required");
            }

            throw new Error(message);
        }
    },

    // HANDLES MAKING STAFF AN ACADEMIC SECRETARY
    makeAcademicSecretary: async (staffId: string): Promise<Staff> => {
        try {
            const response = await apiClient.put<Staff>(`/staff/make-academic-secretary/${staffId}`);
            return response.data;
        } catch (error: any) {
            const status = error.response?.status;
            const message = error.response?.data?.message || error.response?.data || "Failed to assign role";

            if (status === 422) {
                throw new Error("Lecturer does not exist or invalid state");
            }
            if (status === 403) {
                throw new Error("Access denied: Admin privileges required");
            }

            throw new Error(message);
        }
    },

    // HANDLES MAKING STAFF A SENATE MEMBER
    makeSenate: async (staffId: string): Promise<Staff> => {
        try {
            const response = await apiClient.put<Staff>(`/staff/make-senate/${staffId}`);
            return response.data;
        } catch (error: any) {
            const status = error.response?.status;
            const message = error.response?.data?.message || error.response?.data || "Failed to assign role";

            if (status === 422) {
                throw new Error("Lecturer does not exist or invalid state");
            }
            if (status === 403) {
                throw new Error("Access denied: Admin privileges required");
            }

            throw new Error(message);
        }
    },

    // HANDLES REMOVING STAFF FROM SENATE
    unmakeSenate: async (staffId: string): Promise<Staff> => {
        try {
            const response = await apiClient.put<Staff>(`/staff/unmake-senate/${staffId}`);
            return response.data;
        } catch (error: any) {
            const status = error.response?.status;
            const message = error.response?.data?.message || error.response?.data || "Failed to remove Senate role";

            if (status === 422) {
                throw new Error("Lecturer does not exist or invalid state");
            }
            if (status === 403) {
                throw new Error("Access denied: Admin privileges required");
            }

            throw new Error(message);
        }
    },


    // HANDLES MAKING STAFF A FACULTY EXAM OFFICER
    makeFacultyExamOfficer: async (staffId: string): Promise<Staff> => {
        try {
            const response = await apiClient.put<Staff>(`/staff/make-faculty-officer/${staffId}`);
            return response.data;
        } catch (error: any) {
            const status = error.response?.status;
            const message = error.response?.data?.message || error.response?.data || "Failed to assign role";

            if (status === 422) {
                throw new Error("Lecturer does not exist or invalid state");
            }
            if (status === 403) {
                throw new Error("Access denied: Admin or Dean privileges required");
            }

            throw new Error(message);
        }
    },

    // HANDLES MAKING STAFF A DEAN
    makeDean: async (staffId: string): Promise<Staff> => {
        try {
            const response = await apiClient.put<Staff>(`/staff/make-faculty-dean/${staffId}`);
            return response.data;
        } catch (error: any) {
            const status = error.response?.status;
            const message = error.response?.data?.message || error.response?.data || "Failed to assign role";

            if (status === 422) {
                throw new Error("Lecturer does not exist or invalid state");
            }
            if (status === 403) {
                throw new Error("Access denied: Admin privileges required");
            }

            throw new Error(message);
        }
    },

    // HANDLES MAKING STAFF A DEPARTMENT EXAM OFFICER
    makeDepartmentExamOfficer: async (staffId: string, data: { programmeTypeId?: number }): Promise<Staff> => {
        try {
            const response = await apiClient.put<Staff>(`/staff/make-department-officer/${staffId}`, data);
            return response.data;
        } catch (error: any) {
            const status = error.response?.status;
            const message = error.response?.data?.message || error.response?.data || "Failed to assign role";

            if (status === 422) {
                throw new Error("Lecturer does not exist or invalid state");
            }
            if (status === 404) {
                throw new Error("Programme type not found");
            }
            if (status === 403) {
                throw new Error("Access denied: HOD privileges required");
            }

            throw new Error(message);
        }
    },


    // HANDLES MAKING STAFF A LEVEL ADVISER
    makeLevelAdviser: async (data: { levelId: number[]; userId: string; departmentId: number; }): Promise<void> => {
        try {
            await apiClient.post(`/staff/make-level-adviser`, data);
        } catch (error: any) {
            const status = error.response?.status;
            const message = error.response?.data?.message || error.response?.data || "Failed to assign level adviser";

            if (status === 404) {
                throw new Error("Staff not found");
            }
            if (status === 403) {
                throw new Error("Access denied");
            }

            throw new Error(message);
        }
    },


    // HANDLES STAFF FILTERING BY SENATE

    getSenates: async (): Promise<string[]> => {
        const response = await apiClient.get<string[]>('/staff/senates');
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
        const response = await apiClient.get<Faculty[]>('/faculty/all');
        facultiesCache = response.data;
        return response.data;
    },

    // HANDLES ALL PROGRAMME TYPES FETCHING
    getAllProgrammeTypes: async (): Promise<ProgrammeType[]> => {
        if (programmeTypesCache) return programmeTypesCache;
        const response = await apiClient.get<ProgrammeType[]>('/programme-type/get-all');
        programmeTypesCache = response.data;
        return response.data;
    },

    // HANDLES ALL PROGRAMMES FETCHING
    getAllProgrammes: async (): Promise<Programme[]> => {
        if (programmesCache) return programmesCache;
        const response = await apiClient.get<Programme[]>('/programme/all');
        programmesCache = response.data;
        return response.data;
    },

    // HANDLES ALL ROLES FETCHING
    getAllRoles: async (): Promise<Role[]> => {
        if (rolesCache) return rolesCache;
        const response = await apiClient.get<Role[]>('/system/settings/get-roles');
        rolesCache = response.data;
        return response.data;
    },

    // HANDLES ALL COUNTRIES FETCHING
    getCountries: async (): Promise<Country[]> => {
        if (countriesCache) return countriesCache;
        const response = await apiClient.get<Country[]>('/nationality/get-countries');
        countriesCache = response.data;
        return response.data;
    },

    // HANDLES ALL GENDERS FETCHING
    getGenders: async (): Promise<Gender[]> => {
        if (gendersCache) return gendersCache;
        const response = await apiClient.get<Gender[]>('/basic-information/get-genders');
        gendersCache = response.data;
        return response.data;
    },

    // HANDLES LGA FETCHING BY STATE
    getLgasByState: async (stateId: number): Promise<LGA[]> => {
        if (lgasCache[stateId]) return lgasCache[stateId];
        const response = await apiClient.get<LGA[]>(`/nationality/get-lgas/${stateId}`);
        lgasCache[stateId] = response.data;
        return response.data;
    },

    // HANDLES LEVEL FETCHING BY PROGRAMME TYPE
    getLevelsByProgrammeType: async (programmeTypeId: number): Promise<Level[]> => {
        if (levelsCache[programmeTypeId]) return levelsCache[programmeTypeId];
        const response = await apiClient.get<Level[]>(`/system/settings/get-levels?programme_type=${programmeTypeId}`);
        levelsCache[programmeTypeId] = response.data;
        return response.data;
    }
};
