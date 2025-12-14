export interface Staff {
    id: number;
    userId: string;
    title?: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    name: string;
    email: string;
    // phone: string; // Removed as per latest schema
    roles: string[];
    creationTime: string;
    updatedTime: string;
    enabled: boolean;
    isAdmin: boolean;
}

export interface CreateStaffRequest {
    titleId: number;
    userId: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    email: string;
    departmentId: number;
    academic: boolean;
    roles: string[];
    faculties: number[];
    departments: number[];
    programmeTypeId: number;
}
