export interface School {
    id: number;
    name: string;
    shortName?: string;
}

export interface ProgrammeType {
    id: number;
    name: string;
    code: string;
    modeOfStudy: string;
    school: School;
    admissionType: string;
    onlineResult: boolean;
    modeOfEntryEnabled: boolean;
    modeOfStudyEnabled: boolean;
    enableProgressStatus: boolean;
    admissionRole: string;
    statementCode: string;
    certificateRequireResults: boolean;
    maintainFeesForRepeating: boolean;
    partPayment: boolean;
    partPaymentForNewStudent: boolean;
    firstPaymentPercentage: number;
    serviceCode: string;
    currentSession?: any; // Transient, specific type if needed
    studentDashboardAccessStatus?: any; // Enum/Object
}

export interface ProgrammeTypeResponse extends ProgrammeType { }

export interface CreateProgrammeTypeRequest {
    schoolId: number;
    name: string;
    code: string;
    modeOfStudy: number;
    modeOfEntryEnabled: boolean;
    modeOfStudyEnabled: boolean;
    enableProgressStatus: boolean;
    onlineResult: boolean;
    admissionType: number;
    admissionRole: string;
    statementCode: string;
    certificateRequireResults: boolean;
}

export interface UpdateProgrammeTypeRequest {
    schoolId: number;
    name: string;
    code: string;
    modeOfStudy: number;
    modeOfEntryEnabled: boolean;
    modeOfStudyEnabled: boolean;
    enableProgressStatus: boolean;
    onlineResult: boolean;
    admissionType: number;
    admissionRole: string;
    statementCode: string;
    certificateRequireResults: boolean;
}

export interface PaymentSettingReqObject {
    partPayment: boolean;
    partPaymentForNewStudent: boolean;
    firstPaymentPercentage: number;
    serviceCode: string;
    maintainFeesForRepeating: boolean;
}
