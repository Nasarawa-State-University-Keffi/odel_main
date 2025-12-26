export interface ProgrammeType {
    id: number;
    name: string;
}

export interface Level {
    id: number;
    title: string;
    levelOrder: number;
    programmeType: ProgrammeType;
}

export interface CreateLevelRequest {
    title: string;
    order: number;
    programmeTypeId: number;
}

export interface UpdateLevelRequest {
    title: string;
    order: number;
    programmeTypeId: number;
}
