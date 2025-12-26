export interface User {
    userId: string;
    firstName: string;
    lastName: string;
    email?: string;
    roles?: string[];
}

export interface Teacher {
    id: number;
    user: User;
}

export interface Qualification {
    id: number;
    name: string;
}

export interface Department {
    id: number;
    name: string;
    code: string;
    faculty?: {
        id: number;
        name: string;
    };
    allowedQualifications?: Qualification[];
}

export interface DepartmentWithHod {
    department: Department;
    hod: Teacher | null;
}

export interface Hod {
    id: number;
    user: User & { roles?: string[] };
    department: {
        id: number;
        name: string;
    };
}

export interface SetSignatureModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export interface DepartmentRegistryHeaderProps {
    searchQuery: string;
    onSearchChange: (val: string) => void;
    isLoading: boolean;
    filterAction?: React.ReactNode;
}

export interface CreateDepartmentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    departmentToEdit?: any;
}

export interface RunGraduationModalProps {
    isOpen: boolean;
    onClose: () => void;
    departmentId: number | null;
}

export interface Subject {
    id: number;
    name: string;
    code?: string;
}

export interface SemesterSettings {
    id: number;
    department: {
        id: number;
        name: string;
    };
    semester: {
        id: number;
        title: string;
    };
    resultUploadEnabled: boolean;
    resultCheckingEnabled: boolean;
    scheduledCloseDate: string | null;
}

export interface Grade {
    id: number;
    grade: string;
    description?: string;
    title: string;
}


export interface ScheduleUploadClosingModalProps {
    isOpen: boolean;
    onClose: () => void;
    departmentId: number | null;
}

export interface ViewSemesterSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    departmentId: number | null;
}
