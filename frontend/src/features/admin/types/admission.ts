import { ProgrammeType } from "./programmeType";
import { ModeOfEntry } from "./modeOfEntry";
import { Session } from "./session";

// 0. Entity Relationships & Core Types

export interface ApplicationType {
    id: number;
    name: string;
    description?: string;
    programmeType: ProgrammeType;
    amount: number; // fees
    active: boolean;
    // Feature Flags
    modeOfEntryEnabled: boolean;
    utmeDetailsEnabled: boolean;
    utmeRegEnabled: boolean;
    ssceDetailsEnabled: boolean;
    screeningDetailsEnabled: boolean;
    contactDetailsEnabled: boolean;
    nextOfKinDetailsEnabled: boolean;
    qualificationDetailsEnabled: boolean;
    qualificationDocumentEnabled: boolean;
    scratchCardDetailsEnabled: boolean;
    refereeDetailsEnabled: boolean;
    nyscDetailsEnabled: boolean;
    transcriptRequestEnabled: boolean;
    autoLoadUtme: boolean;
    autoClearApplicants: boolean;
    processPostUtme: boolean;
    ssceVerification: boolean;
    // Configuration
    numberOfSittings?: number;
    numberOfQualifications?: number;
    modeOfEntries: ModeOfEntry[]; // Array of allowed modes

    // Fees
    applicationFee: number;
    admissionFee: number;
    screeningFee: number;
    changeProgrammeFee: number;
    verificationFee: number;

    // Service Codes
    applicationFeeServiceCode?: string;
    screeningFeeServiceCode?: string;
    acceptanceFeeServiceCode?: string;
    changeOfProgrammeFeeServiceCode?: string;
    verificationFeeServiceCode?: string;
    verificationPaymentPlatform?: string;

    // Other flags
    freshApplicationEnabled: boolean;
    manualScratchCard: boolean;
    collectNonAutomaticOrgs: boolean;
    requireVerificationPayment: boolean;

    screeningForm: number; // Enum value or ID
    statuses: string[];
    autoScratchCards?: number[]; // Added to match CREATE request
}

export interface CreateApplicationTypeRequest {
    name: string;
    programmeType: number; // ID
    applicationFee: number;
    admissionFee: number;
    screeningFee: number;
    changeProgrammeFee: number;
    verificationFee: number;

    // Flags
    autoLoadUtme: boolean;
    autoClearApplicants: boolean;
    modeOfEntryEnabled: boolean;
    utmeDetailsEnabled: boolean;
    utmeRegEnabled: boolean;
    processPostUtme: boolean;
    freshApplicationEnabled: boolean;
    ssceDetailsEnabled: boolean;
    screeningDetailsEnabled: boolean;
    nyscDetailsEnabled: boolean;
    contactDetailsEnabled: boolean;
    nextOfKinDetailsEnabled: boolean;
    qualificationDetailsEnabled: boolean;
    qualificationDocumentEnabled: boolean;
    scratchCardDetailsEnabled: boolean;
    refereeDetailsEnabled: boolean;
    transcriptRequestEnabled: boolean;
    ssceVerification: boolean;
    manualScratchCard: boolean;
    collectNonAutomaticOrgs: boolean;
    requireVerificationPayment: boolean;

    // Config
    numberOfSittings: number;
    numberOfQualifications: number;

    // Service Codes
    applicationFeeServiceCode: string;
    screeningFeeServiceCode: string;
    acceptanceFeeServiceCode: string;
    changeOfProgrammeFeeServiceCode: string;
    verificationFeeServiceCode: string;
    verificationPaymentPlatform: string;

    screeningForm: number;

    // Lists
    modeOfEntries: number[];
    autoScratchCards: number[];
    statuses: string[];
}

export interface Admission {
    id: number;
    session: Session;
    applicationType: ApplicationType;
    startDate: string; // ISO Date string
    endDate: string; // ISO Date string
    admissionMode: string; // "SESSION" or "SEMESTER"
    postResetPayment?: number;
    isOpen: boolean; // Virtual property based on dates
    semester?: any; // Semester object if applicable
    level?: any; // Level object if applicable
}

// 1. Admission Statistics

export interface ProgrammeStats {
    registered: number;
    unregistered: number;
}

export interface AdmissionStats {
    [key: string]: ProgrammeStats;
}

// ...

export interface CreateAdmissionRequest {
    sessionId: number;
    applicationTypeId: number;
    startDate: string;
    endDate: string;
    mode: string; // "SESSION" or "SEMESTER"
    postResetPayment: number;
    semesterId?: number;
    levelId?: number;
}

export interface UpdateAdmissionRequest {
    sessionId: number;
    applicationTypeId: number;
    startDate: string;
    endDate: string;
    mode: string; // "SESSION" or "SEMESTER"
    postResetPayment: number;
    semesterId?: number;
}

// Bulk Download Params
export interface BulkAdmissionParams {
    admission: number;
    level?: number;
    faculty?: number;
    department?: number;
    programme?: number;
    country?: number;
    state?: number;
    lga?: number;
    gender?: number;
}

// Response Wrappers
export interface ApplicationTypeResponse extends ApplicationType { }
export interface AdmissionResponse extends Admission { }
