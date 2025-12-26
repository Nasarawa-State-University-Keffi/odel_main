export interface CourseRegistrationPayload {
    course: number;
    studentMatric: string;
    sessionId: number;
    semesterId: number;
}


export interface ProgrammeCourse {
    id: number;
    courseCode: string;
    title: string;
    creditUnit: number;
    courseSpan: number;
    compulsory: boolean;
    department?: {
        id: number;
        name: string;
    };
    level?: {
        id: number;
        name: string;
    };
    programmeType?: {
        id: number;
        name: string;
    };
    programme?: { // In case it's programme specific and has this info
        id: number;
        name: string;
    };
    mainLecturer?: {
        id: number;
        user: {
            userId: string;
            firstName: string;
            lastName: string;
        };
    };
}

export interface CreateCourseRequest {
    courseCode: string;
    title: string;
    creditUnit: number;
    departmentId: number;
    levelId: number;
    programme?: number | null;
    programmeTypeId: number;
    compulsory: boolean;
    courseSpan: number;
}

export interface UpdateCourseRequest extends CreateCourseRequest { }

export interface CourseLecturer {
    id: number;
    user: {
        userId: string;
        firstName: string;
        lastName: string;
    };
    title: {
        id: number;
        name: string;
    };
    department: {
        id: number;
        name: string;
    };
}

export interface CourseQueryParams {
    programme_type: number;
    strict: boolean;
    department?: number;
    programme?: number;
    faculty?: number;
    level?: number;
}

export interface ApprovalInformation {
    id: number;
    submitted: boolean;
    departmentApproved: boolean;
    facultyApproved: boolean;
    senateApproved: boolean;
}

export interface CourseWithApproval extends ProgrammeCourse {
    currentApprovalInformation: ApprovalInformation;
}