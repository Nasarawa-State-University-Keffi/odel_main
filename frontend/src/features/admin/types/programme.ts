export interface ProgrammeType {
    id: number;
    name: string;
    code?: string;
    description?: string;
    modeOfStudy?: string;
    modeOfEntryEnabled?: boolean;
    school?: {
        id: number;
        name: string;
        shortName: string;
    };
}

export interface Programme {
    id: number;
    name: string;
    code: string;
    programmeType: ProgrammeType;
    description?: string;
    active?: boolean;
    department?: {
        id: number;
        name: string;
    };
    programmeDuration?: number;
    minimumSemesters?: number;
    maximumSemesters?: number;
    maximumCapacity?: number;
    revenueCode?: string;
    startingLevel?: {
        id: number;
        title: string;
    };
    level?: {
        id: number;
        title: string;
    };
    levelId?: number; // fallback
    availableOnline?: boolean;
    award?: {
        id: number;
        name: string;
    };
    awardId?: number; // fallback
    awardName?: string;
}

export interface Award {
    id: number;
    name: string;
}

export interface CreateProgrammeRequest {
    departmentId: number;
    programmeTypeId: number;
    name: string;
    code: string;
    programmeDuration: number;
    minimumSemesters: number;
    maximumSemesters: number;
    maximumCapacity: number;
    revenueCode: string;
    levelId: number;
    availableOnline: boolean;
    awardId: number;
    awardName: string;
}

export type UpdateProgrammeRequest = CreateProgrammeRequest;
