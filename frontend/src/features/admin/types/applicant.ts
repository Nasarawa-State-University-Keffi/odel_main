import { Admission } from "./admission";
import { ModeOfEntry } from "./modeOfEntry";

export interface Applicant {
    id: number;
    applicationNumber: string;
    emailAddress: string;
    jambRegNumber?: string;
    firstName?: string;
    lastName?: string;
    middleName?: string;
    phoneNumber?: string;
    admission: Admission;
    modeOfEntry: ModeOfEntry;
    // Add other fields as they become relevant
}
