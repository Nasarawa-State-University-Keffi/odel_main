export interface Department {
    id: number;
    name: string;
    faculty: {
        id: number;
        name: string;
    };
}

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
    title?: any; // Can be string or object depending on endpoint
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
    middleName?: string;
    email: string;
    departmentId: number;
    academic: boolean;
    roles: string[];
    faculties: number[];
    departments: number[];
    programmeTypeId?: number;
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
