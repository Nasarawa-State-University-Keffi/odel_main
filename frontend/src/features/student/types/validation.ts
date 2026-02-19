import { z } from "zod";
import { ApplicationTypeConfig } from "./application";

export const createApplicationSchema = (config: ApplicationTypeConfig | null) => {
    // Base schemas
    const personalSchema = z.object({
        firstName: z.string().min(2, "First name is required"),
        lastName: z.string().min(2, "Last name is required"),
        middleName: z.string().optional(),
        email: z.string().email("Invalid email address"),
        phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
        dob: z.string().min(1, "Date of birth is required"),
        genderId: z.string().min(1, "Gender is required"),
        maritalStatusId: z.string().min(1, "Marital status is required"),
        countryId: z.string().min(1, "Country is required"),
        stateId: z.string().min(1, "State is required"),
        lgaId: z.string().min(1, "LGA is required"),
        placeOfBirth: z.string().min(1, "Place of birth is required"),
        homeTown: z.string().min(1, "Home town is required"),
        utmeReg: config?.utmeDetailsEnabled ? z.string().min(1, "UTME registration number is required") : z.string().optional(),
    });

    const contactSchema = z.object({
        address: z.string().min(5, "Address must be at least 5 characters"),
        countryId: z.string().min(1, "Country is required"),
        stateId: z.string().min(1, "State is required"),
        lgaId: z.string().min(1, "LGA is required"),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
    });

    const entryLevelSchema = z.object({
        level: z.string().min(1, "Please select an entry level"),
    });

    const olevelSubjectSchema = z.object({
        subject: z.string().min(1, "Subject is required"),
        grade: z.string().min(1, "Grade is required"),
    });

    const olevelResultSchema = z.object({
        examType: z.string().min(1, "Exam type is required"),
        examNumber: z.string().min(1, "Exam number is required"),
        examYear: z.string().min(4, "Year is required"),
        subjects: z.array(olevelSubjectSchema).min(5, "At least 5 subjects are required"),
    });

    const olevelSchema = z.object({
        results: z.array(olevelResultSchema).min(1, "At least one sitting is required"),
    });

    const nyscSchema = z.object({
        nyscNumber: z.string().min(1, "NYSC Number is required"),
        yearOfService: z.string().min(4, "Year of Service is required"),
        stateOfDeployment: z.string().min(1, "State of Deployment is required"),
    });

    const utmeSchema = z.object({
        jambRegNumber: z.string().min(1, "JAMB Registration Number is required"),
        year: z.string().min(4, "Year is required"),
        subject1: z.string().min(1, "Subject 1 is required"),
        score1: z.string().min(1, "Score 1 is required"),
        subject2: z.string().min(1, "Subject 2 is required"),
        score2: z.string().min(1, "Score 2 is required"),
        subject3: z.string().min(1, "Subject 3 is required"),
        score3: z.string().min(1, "Score 3 is required"),
        subject4: z.string().min(1, "Subject 4 is required"),
        score4: z.string().min(1, "Score 4 is required"),
    });

    const nextOfKinSchema = z.object({
        fullName: z.string().min(2, "Name is required"),
        relationshipId: z.string().min(1, "Relationship is required"),
        phoneNumber: z.string().regex(/^(\+234|0)[789][01]\d{8}$/, "Must be a valid Nigerian phone number"),
        address: z.string().min(5, "Address is required"),
    });

    const refereeSchema = z.object({
        fullName: z.string().min(2, "Name is required"),
        email: z.string().email("Invalid email"),
        phoneNumber: z.string().min(10, "Phone number is required"),
        address: z.string().min(5, "Address is required"),
    });

    const refereesSchema = z.array(refereeSchema).min(config?.numberOfReferees || 1, `At least ${config?.numberOfReferees || 1} referee(s) required`);

    const qualificationResultSchema = z.object({
        qualificationId: z.string().min(1, "Qualification type is required"),
        school: z.string().min(2, "Institution name is required"),
        year: z.string().min(4, "Year is required"),
        courseOfStudy: z.string().min(2, "Course of study is required"),
        gradeId: z.string().min(1, "Grade is required"),
        // file validation is handled separately via File objects check if needed, but schema focuses on text
    });

    const qualificationSchema = z.object({
        results: z.array(qualificationResultSchema).min(1, "At least one qualification is required"),
    });

    const programmeSchema = z.object({
        programmeId: z.string().min(1, "Programme selection is required"),
    });

    // Build the main schema dynamically
    return z.object({
        personal: personalSchema,
        contact: config?.contactDetailsEnabled ? contactSchema : z.any().optional(),
        programme: programmeSchema,
        entryLevel: config?.modeOfEntries?.length ? entryLevelSchema : z.any().optional(),
        utme: config?.utmeDetailsEnabled ? utmeSchema : z.any().optional(),
        olevel: config?.ssceDetailsEnabled ? olevelSchema : z.any().optional(),
        qualification: config?.qualificationDocumentEnabled ? qualificationSchema : z.any().optional(),
        nysc: config?.nyscDetailsEnabled ? nyscSchema : z.any().optional(),
        nextOfKin: config?.nextOfKinDetailsEnabled ? nextOfKinSchema : z.any().optional(),
        referees: config?.refereeDetailsEnabled ? refereesSchema : z.any().optional(),
        // Add other sections as needed validation
        passport: z.any().optional(),
    });
};
