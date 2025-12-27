export interface School {
    id: number;
    name: string;
    shortName: string;
    preSenateCommitteeLabel: string;
    dominant: boolean;
    crossProgrammeTypeChange: boolean;
}

export interface CreateSchoolRequest {
    name: string;
    shortName: string;
    preSenateCommitteeLabel: string;
    dominant: boolean;
    maintainFeeForRepeating?: boolean;
    crossProgrammeTypeChange?: boolean;
}

export interface UpdateSchoolRequest {
    name: string;
    shortName: string;
    preSenateCommitteeLabel: string;
    dominant: boolean;
    maintainFeeForRepeating?: boolean;
    crossProgrammeTypeChange?: boolean;
}
