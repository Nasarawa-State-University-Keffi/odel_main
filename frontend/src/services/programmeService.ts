import apiClient from "@/lib/api";

export interface ProgrammeType {
    id: number;
    name: string;
    code: string;
    modeOfStudy: string;
    school: {
        id: number;
        name: string;
        shortName: string;
    };
}

export interface Programme {
    id: number;
    name: string;
    code: string;
    modeOfStudy: string;
    department?: {
        id: number;
        name: string;
        faculty?: {
            id: number;
            name: string;
        }
    };
    school?: {
        id: number;
        name: string;
    };
    // Add flexible fields to capture response
    [key: string]: any;
}

import fallbackData from "@/data/programmes.json";



// In-memory cache
let programmeTypesCache: ProgrammeType[] | null = null;
const programmesCache: Record<number, Programme[]> = {};

export const programmeService = {
    getAllProgrammeTypes: async (): Promise<ProgrammeType[]> => {
        // Return JSON data directly
        return fallbackData.programmeTypes as ProgrammeType[];
    },

    getProgrammesByType: async (programmeType: number): Promise<Programme[]> => {
        // Return JSON data directly
        const programs = (fallbackData.programmes as any)[programmeType.toString()];
        return programs ? (programs as Programme[]) : [];
    }
};
