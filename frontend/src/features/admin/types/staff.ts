import { Department } from "./department";
import { Faculty } from "./faculty";
import { ProgrammeType } from "./programmeType";

export type { Department, Faculty, ProgrammeType };

export interface LevelAdviser {
    id: number;
    name: string;
    userId: string;
    department: Department;
    levels: any[];
    programmeType: any;
}

export interface Staff {
    id: number;
    userId: string;
    title?: any;
    firstName: string;
    middleName?: string;
    lastName: string;
    name: string;
    email: string;
    roles: string[];
    creationTime: string;
    updatedTime: string;
    enabled: boolean;
    isAdmin: boolean;
    gender?: string;
    dob?: string;
    professionalTitle?: string;
    phone?: string;
    department?: Department;
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
    programmeTypeId?: number;
}

export interface UpdateStaffRequest {
    staffId?: string;
    gender?: string;
    dob?: string;
    professionalTitle?: string;
    phone: string;
}

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

export interface ApprovalInfo {
    approved: boolean;
    approvalLevel: string;
    approvedAt: string;

}

export interface AssignedCourseWithApproval {
    id: number;
    courseCode: string;
    title: string;
    currentApprovalInformation: ApprovalInfo;
}

// MOVED TYPES FROM staffService.ts

export interface Title { id: number; title: string; value: string; }

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
