import { useState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { applicationService } from "@/features/student/services/applicationService";
import { ApplicationFormData, ApplicationTypeConfig } from "@/features/student/types/application";

export const useApplicationData = () => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [appConfig, setAppConfig] = useState<ApplicationTypeConfig | null>(null);
    const [applicantId, setApplicantId] = useState<string | number | null>(null);
    const [mappedData, setMappedData] = useState<ApplicationFormData | null>(null);

    const [userData, setUserData] = useState<any>(null);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const data = await applicationService.getInitialData();
                if (!data?.userData?.data) throw new Error("Applicant data not found");

                setUserData(data.userData);

                const applicantRecord = data.userData.data;
                const userConfig = applicantRecord.admission?.applicationType;

                if (userConfig) setAppConfig(userConfig);
                setApplicantId(applicantRecord.id);

                // Improved normalization logic: Prioritizes non-empty values from multiple sources
                const val = (camelKey: string, snakeKey: string, altKeys: string[] = [], preferName = false) => {
                    const keys = [camelKey, snakeKey, ...altKeys];

                    for (const key of keys) {
                        const value = data.information?.[key] ?? (applicantRecord as any)[key];
                        if (value !== undefined && value !== null && value !== "" && value !== 0 && value !== "0") {

                            if (typeof value === 'object') {
                                // Extract ID or Name based on preference
                                const result = preferName ? (value.name || value.title || value.id || "") : (value.id || value.name || value.title || "");
                                return result?.toString() || "";
                            }
                            return value.toString();
                        }
                    }

                    // RETURN AN EMPTY STRING IF NO MATCH IS FOUND
                    return "";
                };

                const getNested = (obj: any, keys: string[]) => {
                    if (!obj || typeof obj !== 'object') return "";
                    for (const key of keys) {
                        if (obj[key]) return obj[key];
                    }
                    return "";
                };

                const nokSource = (applicantRecord as any).nextOfKin || (applicantRecord as any).nok || data.information?.nextOfKin || data.information?.nok || {};

                const mapped: ApplicationFormData = {
                    personal: {
                        firstName: val("firstName", "first_name"),
                        lastName: val("lastName", "last_name"),
                        middleName: val("middleName", "middle_name"),
                        email: val("email", "email_address"),
                        phoneNumber: val("phoneNumber", "phone_number", ["phone"]),
                        placeOfBirth: val("placeOfBirth", "place_of_birth"),
                        homeTown: val("homeTown", "home_town"),
                        countryId: val("countryId", "country_id", ["country", "nationality"]),
                        stateId: val("stateId", "state_id", ["state", "state_of_origin"]),
                        lgaId: val("lgaId", "lga_id", ["lga", "lga_of_origin"]),
                        maritalStatusId: val("maritalStatusId", "marital_status_id", ["marital_status", "maritalStatus"]),
                        genderId: val("genderId", "gender_id", ["sex", "gender", "sex_id"]),
                        stateOfOrigin: val("stateOfOrigin", "state_of_origin"),
                        dob: val("dob", "date_of_birth"),
                        utmeReg: val("utmeReg", "utme_reg")
                    },
                    contact: {
                        address: val("address", "home_address", ["contactAddress", "contact_address"]),
                        city: val("city", "city"),
                        state: val("state", "state_of_residence", ["residentialState", "residential_state"], true),
                        country: val("country", "country_of_residence", ["residentialCountry", "residential_country"], true),
                        countryId: val("countryId", "country_id", ["contact_country_id"]),
                        stateId: val("stateId", "state_id", ["contact_state_id"]),
                        lgaId: val("lgaId", "lga_id", ["contact_lga_id", "residential_lga_id"]),
                    },
                    programme: {
                        programmeId: (applicantRecord as any).admission?.programme?.id?.toString() || (applicantRecord as any).programme?.id?.toString() || ""
                    },
                    utme: {
                        jambRegNumber: (data.utmeDetails as any)?.jambRegNumber || (data.utmeDetails as any)?.jamb_reg_number || "",
                        year: (data.utmeDetails as any)?.year || "",
                        subject1: (data.utmeDetails as any)?.subject1?.id?.toString() || "",
                        score1: (data.utmeDetails as any)?.score1?.toString() || "",
                        subject2: (data.utmeDetails as any)?.subject2?.id?.toString() || "",
                        score2: (data.utmeDetails as any)?.score2?.toString() || "",
                        subject3: (data.utmeDetails as any)?.subject3?.id?.toString() || "",
                        score3: (data.utmeDetails as any)?.score3?.toString() || "",
                        subject4: (data.utmeDetails as any)?.subject4?.id?.toString() || "",
                        score4: (data.utmeDetails as any)?.score4?.toString() || "",
                    },
                    olevel: {
                        results: data.ssceDetails?.length > 0 ? data.ssceDetails.map((ssce: any) => ({
                            registrationNumber: ssce.registrationNumber || ssce.registration_number || "",
                            year: ssce.year || "",
                            organization: ssce.organization?.id?.toString() || "",
                            examType: ssce.examType?.id?.toString() || "",
                            numberOfSubjects: ssce.numberOfSubjects || 5,
                            subject1: ssce.subject1?.id?.toString() || "", grade1: ssce.grade1?.id?.toString() || "",
                            subject2: ssce.subject2?.id?.toString() || "", grade2: ssce.grade2?.id?.toString() || "",
                            subject3: ssce.subject3?.id?.toString() || "", grade3: ssce.grade3?.id?.toString() || "",
                            subject4: ssce.subject4?.id?.toString() || "", grade4: ssce.grade4?.id?.toString() || "",
                            subject5: ssce.subject5?.id?.toString() || "", grade5: ssce.grade5?.id?.toString() || "",
                            subject6: ssce.subject6?.id?.toString() || "", grade6: ssce.grade6?.id?.toString() || "",
                            subject7: ssce.subject7?.id?.toString() || "", grade7: ssce.grade7?.id?.toString() || "",
                            subject8: ssce.subject8?.id?.toString() || "", grade8: ssce.grade8?.id?.toString() || "",
                            subject9: ssce.subject9?.id?.toString() || "", grade9: ssce.grade9?.id?.toString() || "",
                        })) : [{
                            registrationNumber: "", year: "", organization: "", examType: "", numberOfSubjects: 5,
                            subject1: "", grade1: "", subject2: "", grade2: "", subject3: "", grade3: "", subject4: "", grade4: "", subject5: "", grade5: ""
                        }]
                    },
                    qualification: {
                        results: data.qualificationCertificate?.length > 0 ? data.qualificationCertificate.map((q: any) => ({
                            qualificationId: q.qualification?.id?.toString() || "",
                            school: q.school || "",
                            courseOfStudy: q.courseOfStudy || "",
                            year: q.year || "",
                            gradeId: q.qualificationGrade?.id?.toString() || "",
                            fileName: q.fileName || ""
                        })) : [{ qualificationId: "", school: "", courseOfStudy: "", year: "", gradeId: "" }]
                    },
                    nysc: (data.nyscDetails || (applicantRecord as any).nyscDetails) ? {
                        nyscNumber: val("nyscNumber", "nysc_number", ["nysc_no", "nyscNo"]),
                        yearOfService: val("yearOfService", "year_of_service", ["year_of_nysc", "nyscYear"])?.toString(),
                        stateOfDeployment: val("stateOfDeployment", "state_of_deployment", ["nyscState", "nysc_state"]),
                    } : { nyscNumber: "", yearOfService: "", stateOfDeployment: "" },
                    nextOfKin: {
                        fullName: getNested(nokSource, ["fullName", "full_name", "name"]) || val("nextOfKinName", "next_of_kin_name", ["nokName", "nok_name"]),
                        relationship: getNested(nokSource, ["relationship", "relation"]) || val("nextOfKinRelationship", "next_of_kin_relationship", ["nokRelationship", "nok_relationship"]),
                        relationshipId: getNested(nokSource, ["relationshipId", "relationship_id"]) || val("nextOfKinRelationshipId", "next_of_kin_relationship_id", ["nokRelationshipId", "nok_relationship_id"]),
                        phoneNumber: getNested(nokSource, ["phoneNumber", "phone_number", "phone"]) || val("nextOfKinPhone", "next_of_kin_phone", ["nokPhone", "nok_phone", "nokPhoneNumber"]),
                        address: getNested(nokSource, ["address", "home_address"]) || val("nextOfKinAddress", "next_of_kin_address", ["nokAddress", "nok_address"])
                    },
                    referees: data.refereeDetails || [],
                    passport: val("passport", "passport_url", ["passport_path"])
                };

                // Merge with localStorage if available (Fallback for failed server persistence)
                const savedData = localStorage.getItem(`application_data_${applicantRecord.id}`);
                if (savedData) {
                    try {
                        const parsed = JSON.parse(savedData);
                        // Deep merge basic sections if server values are missing but local ones exist
                        if (parsed.personal) {
                            Object.keys(parsed.personal).forEach(key => {
                                if (!mapped.personal[key as keyof typeof mapped.personal] && parsed.personal[key]) {
                                    (mapped.personal as any)[key] = parsed.personal[key];
                                }
                            });
                        }
                        if (parsed.contact) {
                            Object.keys(parsed.contact).forEach(key => {
                                if (!mapped.contact[key as keyof typeof mapped.contact] && parsed.contact[key]) {
                                    (mapped.contact as any)[key] = parsed.contact[key];
                                }
                            });
                        }
                    } catch (e) {
                        console.warn("Failed to parse local storage data:", e);
                    }
                }

                setMappedData(mapped);
            } catch (error) {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Could not load application data.",
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    return { isLoading, appConfig, applicantId, mappedData, userData };
};
