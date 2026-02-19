export interface ModeOfEntry {
    id: number;
    title: string;
    value: string;
    requireUtmeScores: boolean;
    requireScreeningDocuments: boolean;
    numberOfSemesters: number;
    useOnMatriculation: boolean;
}

export interface ApplicationTypeConfig {
    id: number;
    name: string;
    code: string;
    session: any;
    modeOfEntries: ModeOfEntry[];
    ssceDetailsEnabled: boolean;
    numberOfQualifications: number;
    nyscDetailsEnabled: boolean;
    nextOfKinDetailsEnabled: boolean;
    qualificationDocumentEnabled: boolean;
    contactDetailsEnabled: boolean;
    refereeDetailsEnabled: boolean;
    numberOfReferees: number;
    utmeDetailsEnabled?: boolean;
    scratchCardDetailsEnabled?: boolean;
}

export interface ApplicantInfo {
    id: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    email: string;
    phoneNumber?: string;
    stateOfOrigin?: string;
    admission: {
        applicationType: ApplicationTypeConfig;
    };
}

export interface UserDataWrapper {
    user: {
        id: string;
        username: string;
    };
    data: ApplicantInfo;
    superOption: boolean;
}

export interface InitialDataResponse {
    userData: UserDataWrapper;
    information: any | null;
    ssceDetails: any[];
    utmeDetails: any | null;
    nyscDetails: any | null;
    qualificationCertificate: any[];
    scratchCardPayments: any;
    scratchCards: any[];
    admissionFee: any | null;
    applicationFee: any | null;
    screeningFee: any | null;
    verificationFee: any | null;
    verificationPaymentRequired: boolean;
    refereeDetails?: any[];
}

export interface PersonalInfo {
    firstName: string;
    lastName: string;
    middleName?: string;
    phoneNumber: string;
    email: string;
    stateOfOrigin: string;
    placeOfBirth: string;
    homeTown: string;
    dob: string;
    utmeReg?: string;
    countryId: number | string;
    stateId: number | string;
    lgaId: number | string;
    maritalStatusId: number | string;
    genderId: number | string;
}

export interface ContactInfo {
    address: string;
    city: string;
    state: string;
    country: string;
    countryId: string | number;
    stateId: string | number;
    lgaId: string | number;
}

export interface EntryLevelInfo {
    level: string;
}

export interface OLevelResult {
    registrationNumber: string;
    year: string;
    organization: number | string;
    examType: number | string;
    numberOfSubjects: number;
    subject1: number | string;
    grade1: number | string;
    subject2: number | string;
    grade2: number | string;
    subject3: number | string;
    grade3: number | string;
    subject4: number | string;
    grade4: number | string;
    subject5: number | string;
    grade5: number | string;
    subject6?: number | string;
    grade6?: number | string;
    subject7?: number | string;
    grade7?: number | string;
    subject8?: number | string;
    grade8?: number | string;
    subject9?: number | string;
    grade9?: number | string;
}

export interface OLevelInfo {
    results: OLevelResult[];
}

export interface NYSCInfo {
    nyscNumber: string;
    yearOfService: string;
    stateOfDeployment: string;
}

export interface NextOfKinInfo {
    fullName: string;
    relationship: string;
    relationshipId: string | number;
    phoneNumber: string;
    address: string;
}

export interface QualificationResult {
    courseOfStudy: string;
    school: string;
    year: string;
    gradeId: string | number;
    qualificationId: string | number;
    file?: File | null; // For frontend use
    fileName?: string; // For display of existing files
}

export interface QualificationInfo {
    results: QualificationResult[];
    files?: File[];
}

export interface RefereeInfo {
    fullName: string;
    email: string;
    phoneNumber: string;
    address: string;
}

export interface UtmeInfo {
    jambRegNumber: string;
    year: string;
    subject1: string | number;
    score1: string | number;
    subject2: string | number;
    score2: string | number;
    subject3: string | number;
    score3: string | number;
    subject4: string | number;
    score4: string | number;
}

export interface ApplicationFormData {
    personal: PersonalInfo;
    contact: ContactInfo;
    programme: ProgrammeInfo;
    utme: UtmeInfo;
    olevel: OLevelInfo;
    qualification?: QualificationInfo;
    nysc?: NYSCInfo;
    nextOfKin: NextOfKinInfo;
    referees?: RefereeInfo[];
    passport?: File;
}

export interface UtmeUpdateData {
    jambRegNumber: string;
    year: string;
    subject1: number;
    subject2: number;
    subject3: number;
    subject4: number;
    score1: number;
    score2: number;
    score3: number;
    score4: number;
}

export interface PersonalDetailsUpdateData {
    firstName: string;
    lastName: string;
    middleName: string;
    phone: string;
    placeOfBirth: string;
    homeTown: string;
    countryId: number;
    stateId: number;
    lgaId: number;
    maritalStatusId: number;
    genderId: number;
    dob: string;
    utmeReg: string | null;
}

export interface ContactUpdateData {
    contactAddress: string;
    lgaId: number;
}

export interface NyscUpdateData {
    nyscNumber: string;
    yearOfService: string;
    stateOfDeployment: string;
}

export interface NextOfKinUpdateData {
    name: string;
    relationshipId: number;
    phone: string;
    address: string;
}

export interface RefereeUpdateData {
    referees: RefereeInfo[];
}

export interface OLevelUpdateData {
    results: OLevelResult[];
}

export interface QualificationUpdateData {
    results: {
        courseOfStudy: string;
        school: string;
        year: string;
        gradeId: number;
        qualificationId: number;
    }[];
    files?: File[];
}

export interface ProgrammeInfo {
    programmeId: number | string;
}

export interface ProgrammeUpdateData {
    programmeId: number;
}

export interface ModeOfEntryUpdateData {
    modeOfEntry: number;
}
