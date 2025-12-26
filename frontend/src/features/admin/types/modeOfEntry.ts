export interface Level {
    id: number;
    title: string;
}

export interface ModeOfEntry {
    id: number;
    title: string;
    value: string;
    requireUtmeScores: boolean;
    useOnMatriculation: boolean;
    requireScreeningDocuments: boolean;
    numberOfSemesters: number;
    level: Level;
}

export interface ProgrammeType {
    id: number;
    name: string;
    modeOfStudy?: string;
    school?: {
        shortName: string;
    };
}

export interface CreateModeOfEntryRequest {
    title: string;
    value: string;
    levelId: number;
    requireUtmeScores: boolean;
    requireScreeningDocuments: boolean;
    numberOfSemesters: number;
    programmeTypeId: number;
    useOnMatriculation: boolean;
}

export interface UpdateModeOfEntryRequest {
    title: string;
    value: string;
    levelId: number;
    requireUtmeScores: boolean;
    requireScreeningDocuments: boolean;
    numberOfSemesters: number;
    programmeTypeId: number;
    useOnMatriculation: boolean;
}
