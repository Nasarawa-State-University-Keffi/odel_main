export interface Session {
    id: number;
    name: string;
    isActive: boolean;
}

export interface Semester {
    id: number;
    name: string;
    title: string;
}

export interface ModeOfEntry {
    title: string;
    level: string;
    semesters: number;
    utmeRequired: boolean;
    screeningDocumentsRequired: boolean;
}

export interface ApplicationRequirement {
    label: string;
    required: boolean | "NOT_REQUIRED";
}

export interface ApplicationType {
    id: number;
    name: string;
    code: string;
    modeOfStudy: string;
    programmeType: {
        name: string;
        code: string;
    };
    school?: string;
    admissionType: string;
    admissionRole: string;

    // Requirements (Decision-Making Section)
    requirements?: {
        utmeRequired: boolean;
        ssceRequired: boolean;
        screeningRequired: boolean;
        nyscRequired: boolean;
        qualificationDetailsRequired: boolean;
        qualificationDocumentsRequired: boolean;
        nextOfKinRequired: boolean;
        refereeRequired: boolean;
    };

    // Fees & Payments
    fees?: {
        application: number;
        admission: number;
        screening: number;
        programmeChange: number;
    };
    paymentCodes?: {
        acceptance: string;
        screening: string;
    };

    // Root-level fees/codes specific to new structure
    applicationFee?: number;
    admissionFee?: number;
    screeningFee?: number;
    changeProgrammeFee?: number;
    verificationFee?: number;

    applicationFeeServiceCode?: string;
    screeningFeeServiceCode?: string;
    acceptanceFeeServiceCode?: string;
    changeOfProgrammeFeeServiceCode?: string;
    verificationFeeServiceCode?: string;
    verificationPaymentPlatform?: {
        name: string;
    } | string;

    screeningForm?: string | number;
    requireVerificationPayment?: boolean;
    manualScratchCard?: boolean;
    collectNonAutomaticOrgs?: boolean;
    numberOfQualifications?: number;
    numberOfSittings?: number;
    modesOfEntry?: ModeOfEntry[];

    // Automation & System Behaviour
    automation?: {
        autoLoadUtme: boolean;
        autoClearApplicants: boolean;
        processPostUtme: boolean;
        ssceVerification: boolean;
    };

    certificateRequireResults: boolean;
    enableProgressStatus: boolean;
    modeOfEntryEnabled: boolean;
    modeOfStudyEnabled: boolean;
    status?: string | "CLEARED" | "ADMISSION_ACCEPTED" | "PROGRAMME_CHANGE";
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateAdmissionRequest {
    startDate: string;
    endDate: string;
    sessionId: number;
    semesterId: number;
    applicationTypeId: number;
    postResetPayment: boolean;
    mode: string;
}

export interface Admission {
    id: number;
    name: string;
    admissionMode: string;
    semester: {
        id?: number;
        name?: string;
        title: string;
    };
    startDate: string;
    endDate: string;
    open: boolean;
}

export interface UpdateApplicationTypeRequest {
    name: string;
    programmeType: number;
    statuses: string[];
    autoLoadUtme: boolean;
    autoClearApplicants: boolean;
    processPostUtme: boolean;
    modeOfEntryEnabled: boolean;
    ssceDetailsEnabled: boolean;
    screeningDetailsEnabled: boolean;
    utmeDetailsEnabled: boolean;
    utmeRegEnabled: boolean;
    nyscDetailsEnabled: boolean;
    contactDetailsEnabled: boolean;
    qualificationDetailsEnabled: boolean;
    qualificationDocumentEnabled: boolean;
    nextOfKinDetailsEnabled: boolean;
    refereeDetailsEnabled: boolean;
    ssceVerification: boolean;
    manualScratchCard: boolean;
    collectNonAutomaticOrgs: boolean;
    scratchCardDetailsEnabled: boolean;
    freshApplicationEnabled: boolean;
    transcriptRequestEnabled: boolean;
    numberOfQualifications: number;
    numberOfSittings: number;
    applicationFee: number;
    admissionFee: number;
    screeningFee: number;
    changeProgrammeFee: number;
    screeningForm: number;
    applicationFeeServiceCode: string;
    screeningFeeServiceCode: string;
    acceptanceFeeServiceCode: string;
    changeOfProgrammeFeeServiceCode: string;
    verificationFeeServiceCode: string;
    requireVerificationPayment: boolean;
    verificationFee: number;
    verificationPaymentPlatform: string;
    modeOfEntries: number[];
    autoScratchCards: number[];
}
