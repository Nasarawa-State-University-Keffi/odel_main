import { ProgrammeType } from "./programmeType";

export enum FeePaymentMode {
    SESSION = 1,
    SEMESTER = 2,
}

export interface Semester {
    id: number;
    title: string;
    isOpen: boolean;
}

export interface Level {
    id: number;
    title: string;
    levelOrder: number;
    programmeType: {
        id: number;
        name: string;
    };
}

export interface Session {
    id: number;
    name: string;
    isOpen: boolean;
    registrationBegins: string;
    registrationEnds: string;
    openForPayment: boolean;
    latePaymentEnabled: boolean;
    enableRegistrationApproval: boolean;
    sessionGroupingEnabled: boolean;
    latePaymentDate: string | null;
    semestersCount: number;
    semesters: Semester[];
    currentSemesters: Semester[];
    dateOnAdmission: string | null;
    programmeType: ProgrammeType;
    paymentMode: string | FeePaymentMode; // API doc says string in response ("SESSION"), enum int in request?
}

export interface NewSessionReqObject {
    name: string;
    registrationBegins: Date;
    registrationEnds: Date;
    semestersCount: number;
    programmeTypeId: number;
    feePaymentMode: number;
    openForPayment: boolean;
    latePaymentEnabled: boolean;
    sessionGroupingEnabled: boolean;
    enableRegistrationApproval: boolean;
    latePaymentDate: Date | null;
}

export interface UpdateSessionReqObject {
    name: string;
    registrationBegins: Date;
    registrationEnds: Date;
    semestersCount: number;
    programmeTypeId: number;
    feePaymentMode: number;
    openForPayment: boolean;
    latePaymentEnabled: boolean;
    sessionGroupingEnabled: boolean;
    enableRegistrationApproval: boolean;
    latePaymentDate: Date | null;
}

export interface SessionsAndLevelsResponse {
    sessions: Session[];
    levels: Level[];
}
