import { Level } from "./level";
import { Programme } from "./programme";
import { ModeOfEntry } from "./modeOfEntry";

export interface CourseInSettings {
    id: number;
    courseCode: string;
    title: string;
    alias: string | null;
}

export interface ProgrammeSettingsCourse {
    id: number;
    courseType: 'COMPULSORY' | 'REQUIRED' | 'ELECTIVE';
    course: CourseInSettings;
    creditUnit: number;
    level: {
        id: number;
        name: string;
    } | null;
    disabled: boolean;
    alias: string | null;
    aliasSession: any | null;
    modeOfEntries: ModeOfEntry[];
    effectiveSession: any | null;
}

export interface SemesterSettings {
    id: number;
    totalCreditUnit: number;
    minimumCreditUnit: number;
    numberOfElectives: number;
    passMark: number;
    isSiwes: boolean;
}

export interface ProgrammeLevel {
    id: number;
    programme: {
        id: number;
        name: string;
    };
    level: {
        id: number;
        name: string;
    };
}

export interface ProgrammeSettingsResponse {
    compulsoryCourses: ProgrammeSettingsCourse[];
    requiredCourses: ProgrammeSettingsCourse[];
    electiveCourses: ProgrammeSettingsCourse[];
    semesterSettings: SemesterSettings | null;
    programmeLevel: ProgrammeLevel;
}

export interface FetchProgrammeSettingsParams {
    level: number;
    semester: number;
    programme: number;
}

export type UnregisteredCourse = CourseInSettings;

export interface AddCoursesToProgrammeRequest {
    modeOfEntries: number[];
    courses: number[];
    compulsory?: boolean;
    required?: boolean;
    elective?: boolean;
    level?: number;
    semesterId: number;
    effectiveSessionId?: number;
}

export interface AddCoursesToProgrammeResponse {
    id: number;
    programme: {
        id: number;
        name: string;
    };
    course: {
        id: number;
        courseCode: string;
        title: string;
    };
    courseType: 'COMPULSORY' | 'REQUIRED' | 'ELECTIVE';
    creditUnit: number;
    semester: {
        id: number;
        title: string;
    };
}
