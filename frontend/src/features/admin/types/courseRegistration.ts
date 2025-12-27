export interface RequestCourseRegistrationDto {
    course: number;
    studentMatric: string;
    sessionId: number;
    semesterId: number;
}

export interface ApproveRejectRegistrationsDto {
    registrationIds: number[];
}

export interface ApproveRejectRegistrationPerCourseDto {
    courseId: number;
    programmeId: number;
    semesterId: number;
    approvalStage: number;
}

export interface Course {
    id: number;
    courseCode: string;
    title: string;
    creditUnit: number;
}

export interface Student {
    userId: string;
    name: string;
    programme: string;
}

export interface ApprovalStage {
    id: number;
    name: string;
}

export interface RegistrationDetails {
    id: number;
    studentName: string;
    matric: string;
    programme: string;
    course: Course;
    submissionDate: string;
    stage: ApprovalStage;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface ApprovedRegisteredCourseDto {
    id: number;
    student: Student;
    course: Course;
    submissionDate: string;
    approval: {
        status: string;
    };
}

export interface RegistrationHistoryDto {
    id: number;
    student: string;
    course: string;
    action: string;
    performedBy: string;
    timestamp: string;
}

export interface Page<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
}

export type RegistrationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
