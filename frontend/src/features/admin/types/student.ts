export interface Student {
    id: number;
    userId: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    email: string;
    matricNumber: string;
    department: {
        id: number;
        name: string;
    };
    faculty: {
        id: number;
        name: string;
    };
    level: {
        id: number;
        title: string;
    };
    programmeType: {
        id: number;
        name: string;
    };
    programme?: {
        id: number;
        name: string;
        department?: {
            id: number;
            name: string;
            faculty?: {
                id: number;
                name: string;
            };
        };
        programmeType?: {
            id: number;
            name: string;
        };
    };
    user: {
        enabled: boolean;
        creationTime: string;
    };
    phone?: string;
    gender?: {
        id: number;
        name: string;
    };
    information?: {
        id: number;
        country?: {
            id: number;
            name: string;
        };
        state?: {
            id: number;
            name: string;
        };
        lga?: {
            id: number;
            name: string;
        };
        homeAddress?: string;
        dob?: string;
    };
    registrationNumber?: string;
}

export interface StudentStats {
    totalSemesters: number;
    totalStudents: number;
    totalPaidStudents: number;
    totalUnpaidStudents: number;
    totalGenderStats: {
        Male: number;
        Female: number;
    };
    totalGenderStatsPaid: {
        Male: number;
        Female: number;
    };
    totalGenderStatsUnpaid: {
        Male: number;
        Female: number;
    };
    totalLevelStats: Record<string, number>;
    totalLevelStatsPaid: Record<string, number>;
    totalLevelStatsUnpaid: Record<string, number>;
}

export interface RegisteredCourse {
    courseId: number;
    code: string;
    title: string;
    unit: number;
    score?: number;
    grade?: string;
}

export interface PaginatedResponse<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    last: boolean;
    size: number;
    number: number;
}

export interface StudentQueryParams {
    page: number;
    size: number;
    programme_type?: number;
    start_session?: number;
    current_session?: number;
    level?: number;
    faculty?: number;
    department?: number;
    program?: number;
    gender?: number;
    country?: number;
    state?: number;
    lga?: number;
}


export interface Deferment {
    id: number;
    reason: string;
    student: Student;
    currentSession: {
        id: number;
        name: string;
    };
    defermentSession: {
        id: number;
        name: string;
    };
    approvalStatus: string;
    createdAt: string;
}
