export interface Grade {
    id: number;
    title: string;
    gradeLimit: number;
    creditValue: number;
    gradeOrder: number;
    range: string;
    disabled: boolean;
}

export interface CreateGradeRequest {
    title: string;
    gradeLimit: number;
    creditValue: number;
    gradeOrder: number;
    programmeTypeId: number;
}

export interface UpdateGradeRequest {
    title: string;
    gradeLimit: number;
    creditValue: number;
    gradeOrder: number;
    programmeTypeId: number;
}
