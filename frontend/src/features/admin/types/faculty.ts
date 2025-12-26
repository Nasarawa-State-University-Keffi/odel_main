export interface FacultyDepartment {
    id: number;
    name: string;
}

export interface Faculty {
    id: number;
    name: string;
    code: string;
    science: boolean;
    numberOfQuestions: number;
    departments: FacultyDepartment[];
}

export interface CreateFacultyRequest {
    name: string;
    code: string;
    science: boolean;
    numberOfQuestions: number;
}

export interface UpdateFacultyRequest {
    id: number;
    name: string;
    code: string;
    science: boolean;
}

export interface DeanOfficer {
    id: number;
    user: {
        userId: string;
        firstName: string;
        lastName: string;
        email: string;
    };
    title: {
        id: number;
        name: string;
    };
    department: {
        id: number;
        name: string;
    };
    professionalTitle: string;
}

export interface FacultyWithDean {
    faculty: {
        id: number;
        name: string;
        code: string;
        science: boolean;
        numberOfQuestions?: number;
        departments?: FacultyDepartment[];
    };
    officer: DeanOfficer | null;
}
