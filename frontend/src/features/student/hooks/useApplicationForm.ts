import { useState, useEffect, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { applicationService } from "@/features/student/services/applicationService";
import { ApplicationFormData, ApplicationTypeConfig } from "@/features/student/types/application";
import { createApplicationSchema } from "@/features/student/types/validation";

export const useApplicationForm = (
    appConfig: ApplicationTypeConfig | null,
    applicantId: string | number | null,
    mappedData: ApplicationFormData | null,
    userData: any
) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [direction, setDirection] = useState(0);

    const validationSchema = useMemo(() => createApplicationSchema(appConfig), [appConfig]);

    const methods = useForm<ApplicationFormData>({
        mode: "onChange",
        resolver: zodResolver(validationSchema),
        defaultValues: {
            personal: { firstName: "", lastName: "", middleName: "", email: "", phoneNumber: "", placeOfBirth: "", homeTown: "", countryId: "", stateId: "", lgaId: "", maritalStatusId: "", genderId: "", stateOfOrigin: "", dob: "", utmeReg: "" },
            contact: { address: "", countryId: "", stateId: "", lgaId: "", city: "", state: "", country: "" },
            programme: { programmeId: "" },
            utme: { jambRegNumber: "", year: "", subject1: "", score1: "", subject2: "", score2: "", subject3: "", score3: "", subject4: "", score4: "" },
            olevel: { results: [{ registrationNumber: "", year: "", organization: "", examType: "", numberOfSubjects: 5, subject1: "", grade1: "", subject2: "", grade2: "", subject3: "", grade3: "", subject4: "", grade4: "", subject5: "", grade5: "" }] },
            qualification: { results: [{ qualificationId: "", school: "", courseOfStudy: "", year: "", gradeId: "" }] },
            nysc: { nyscNumber: "", yearOfService: "", stateOfDeployment: "" },
            nextOfKin: { fullName: "", relationship: "", relationshipId: "", phoneNumber: "", address: "" }
        }
    });

    const [hasInitialReset, setHasInitialReset] = useState(false);

    // Initial Data Reset Logic
    useEffect(() => {
        if (mappedData && !hasInitialReset) {
            methods.reset(mappedData);

            if (mappedData.personal) {
                const p = mappedData.personal;
                const fieldsToForce: (keyof typeof p)[] = [
                    'countryId', 'stateId', 'lgaId', 'genderId', 'maritalStatusId', 'dob'
                ];
                fieldsToForce.forEach(field => {
                    if (p[field]) {
                        methods.setValue(`personal.${field}` as any, p[field], {
                            shouldDirty: false,
                            shouldValidate: true
                        });
                    }
                });
            }

            if (mappedData.contact) {
                const c = mappedData.contact;
                const fieldsToForce: (keyof typeof c)[] = ['countryId', 'stateId', 'lgaId'];
                fieldsToForce.forEach(field => {
                    if (c[field]) {
                        methods.setValue(`contact.${field}` as any, c[field], {
                            shouldDirty: false,
                            shouldValidate: true
                        });
                    }
                });
            }

            setHasInitialReset(true);
        }
    }, [mappedData, methods, hasInitialReset]);

    // Steps Configuration Memoized
    const steps = useMemo(() => {
        if (!appConfig) return [];
        return [
            { id: 'personal', title: 'Personal Info', show: true },
            { id: 'contact', title: 'Contact Info', show: appConfig.contactDetailsEnabled },
            { id: 'programme', title: 'Programme', show: true },
            { id: 'olevel', title: "O'Level Results", show: appConfig.ssceDetailsEnabled },
            { id: 'qualification', title: "Higher Qualifications", show: appConfig.qualificationDocumentEnabled },
            { id: 'utme', title: "UTME Details", show: appConfig.utmeDetailsEnabled },
            { id: 'nysc', title: 'NYSC Details', show: appConfig.nyscDetailsEnabled },
            { id: 'nextOfKin', title: 'Next of Kin', show: appConfig.nextOfKinDetailsEnabled },
            { id: 'referees', title: 'Referees', show: appConfig.refereeDetailsEnabled },
            { id: 'documents', title: 'Uploads', show: true },
            { id: 'review', title: 'Review & Pay', show: true }
        ].filter(step => step.show);
    }, [appConfig]);

    // Progress Restoration Logic
    const [hasRestoredProgress, setHasRestoredProgress] = useState(false);
    useEffect(() => {
        if (applicantId && steps.length > 0 && !hasRestoredProgress) {
            const savedStepId = localStorage.getItem(`application_step_${applicantId}`)
            if (savedStepId) {
                const stepIndex = steps.findIndex(s => s.id === savedStepId);
                if (stepIndex !== -1) {
                    setCurrentStep(stepIndex);
                }
            }
            setHasRestoredProgress(true);
        }
    }, [applicantId, steps.length, hasRestoredProgress]);

    // Progress Persistence Logic
    useEffect(() => {
        if (applicantId && steps[currentStep]) {
            localStorage.setItem(`application_step_${applicantId}`, steps[currentStep].id);
        }
    }, [currentStep, applicantId, steps]);

    // Form Data Auto-save Fallback
    const formData = methods.watch();
    useEffect(() => {
        if (applicantId && hasInitialReset) {
            localStorage.setItem(`application_data_${applicantId}`, JSON.stringify(formData));
        }
    }, [formData, applicantId, hasInitialReset]);

    // Can Skip Logic Memoized
    const canSkip = useMemo(() => {
        const stepId = steps[currentStep]?.id;
        if (!stepId) return false;

        let serverHasData = false;
        if (mappedData) {
            switch (stepId) {
                case 'personal': serverHasData = !!mappedData.personal?.firstName && !!mappedData.personal?.lastName; break;
                case 'contact': serverHasData = !!mappedData.contact?.address && !!mappedData.contact?.lgaId; break;
                case 'programme': serverHasData = !!mappedData.programme?.programmeId; break;
                case 'utme': serverHasData = !!mappedData.utme?.jambRegNumber; break;
                case 'olevel': serverHasData = mappedData.olevel?.results?.length > 0 && !!mappedData.olevel.results[0].registrationNumber; break;
                case 'qualification': serverHasData = (mappedData.qualification?.results || []).length > 0; break;
                case 'nysc': serverHasData = !!mappedData.nysc?.nyscNumber; break;
                case 'nextOfKin': serverHasData = !!mappedData.nextOfKin?.fullName; break;
                case 'referees': serverHasData = (mappedData as any).referees?.length > 0; break;
            }
        }

        if (serverHasData) return true;

        const currentSection = (formData as any)[stepId];
        if (currentSection) {
            switch (stepId) {
                case 'personal': return !!currentSection.firstName && !!currentSection.lastName && !!currentSection.dob;
                case 'contact': return !!currentSection.address && !!currentSection.lgaId;
                case 'programme': return !!currentSection.programmeId;
                case 'utme': return !!currentSection.jambRegNumber && !!currentSection.subject1;
                case 'olevel': return currentSection.results?.length > 0 && !!currentSection.results[0].registrationNumber;
                case 'qualification': return currentSection.results?.length > 0 && !!currentSection.results[0].school;
                case 'nysc': return !!currentSection.nyscNumber;
                case 'nextOfKin': return !!currentSection.fullName;
                case 'referees': return (formData.referees || []).length > 0;
            }
        }

        return false;
    }, [mappedData, currentStep, steps, formData]);

    // Action Handlers
    const skipStep = useCallback(() => {
        setDirection(1);
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [currentStep, steps.length]);

    const prevStep = useCallback(() => {
        if (currentStep > 0) {
            setDirection(-1);
            setCurrentStep(prev => prev - 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [currentStep]);

    const nextStep = async () => {
        if (!appConfig || !applicantId) return;

        const currentStepId = steps[currentStep].id;
        let valid = false;

        try {
            switch (currentStepId) {
                case 'personal': {
                    valid = await methods.trigger('personal');
                    if (valid) {
                        setIsSubmitting(true);
                        try {
                            const personalData = methods.getValues("personal");
                            await applicationService.updatePersonalDetails(applicantId, {
                                firstName: personalData.firstName,
                                lastName: personalData.lastName,
                                middleName: personalData.middleName || "",
                                phone: personalData.phoneNumber,
                                placeOfBirth: personalData.placeOfBirth,
                                homeTown: personalData.homeTown,
                                countryId: personalData.countryId ? Number(personalData.countryId) : 0,
                                stateId: personalData.stateId ? Number(personalData.stateId) : 0,
                                lgaId: personalData.lgaId ? Number(personalData.lgaId) : 0,
                                maritalStatusId: personalData.maritalStatusId ? Number(personalData.maritalStatusId) : 0,
                                genderId: personalData.genderId ? Number(personalData.genderId) : 0,
                                dob: personalData.dob,
                                utmeReg: personalData.utmeReg || null
                            });
                            toast({ title: "Progress Saved", description: "Personal information updated successfully." });
                        } catch (error: any) {
                            const status = error.response?.status;
                            const errorMessage = error.response?.data?.message || "Could not save personal details. Please try again.";
                            if (status === 422 && errorMessage.toLowerCase().includes("phone")) {
                                methods.setError("personal.phoneNumber", { type: "manual", message: errorMessage || "Phone number already in use" });
                            } else if (status === 400 && errorMessage.toLowerCase().includes("utme")) {
                                methods.setError("personal.utmeReg", { type: "manual", message: errorMessage || "UTME Registration Number is required" });
                            }
                            toast({ variant: "destructive", title: "Update Failed", description: errorMessage });
                            valid = false;
                        } finally { setIsSubmitting(false); }
                    }
                    break;
                }
                case 'contact':
                    valid = await methods.trigger('contact');
                    if (valid) {
                        setIsSubmitting(true);
                        try {
                            const contactData = methods.getValues("contact");
                            await applicationService.updateContactDetails(applicantId, {
                                contactAddress: contactData.address,
                                lgaId: Number(contactData.lgaId)
                            });
                            toast({ title: "Progress Saved", description: "Contact information updated." });
                        } catch (error: any) {
                            const status = error.response?.status;
                            const errorMessage = error.response?.data?.message || "Could not save contact details.";
                            if (status === 404 && errorMessage.toLowerCase().includes("lga")) {
                                methods.setError("contact.lgaId", { type: "manual", message: "Selected LGA not found" });
                            } else if (status === 422) {
                                toast({ variant: "destructive", title: "Update Failed", description: "You cannot update details at this stage." });
                            } else {
                                toast({ variant: "destructive", title: "Update Failed", description: errorMessage });
                            }
                            valid = false;
                        } finally { setIsSubmitting(false); }
                    }
                    break;
                case 'programme':
                    valid = await methods.trigger('programme');
                    if (valid) {
                        setIsSubmitting(true);
                        try {
                            const programmeData = methods.getValues("programme");
                            await applicationService.updateProgrammeDetails(applicantId, {
                                programmeId: Number(programmeData.programmeId)
                            });
                            toast({ title: "Progress Saved", description: "Programme selection updated." });
                        } catch (error: any) {
                            const status = error.response?.status;
                            const errorMessage = error.response?.data?.message || "Could not save programme details.";
                            if (status === 404) {
                                methods.setError("programme.programmeId", { type: "manual", message: "Selected programme not found" });
                            } else {
                                toast({ variant: "destructive", title: "Update Failed", description: errorMessage });
                            }
                            valid = false;
                        } finally { setIsSubmitting(false); }
                    }
                    break;
                case 'utme':
                    valid = await methods.trigger('utme');
                    if (valid) {
                        setIsSubmitting(true);
                        try {
                            const utmeData = methods.getValues("utme");
                            await applicationService.updateUtmeDetails(applicantId, {
                                jambRegNumber: utmeData.jambRegNumber,
                                year: utmeData.year,
                                subject1: Number(utmeData.subject1),
                                subject2: Number(utmeData.subject2),
                                subject3: Number(utmeData.subject3),
                                subject4: Number(utmeData.subject4),
                                score1: Number(utmeData.score1),
                                score2: Number(utmeData.score2),
                                score3: Number(utmeData.score3),
                                score4: Number(utmeData.score4),
                            });
                            toast({ title: "Progress Saved", description: "UTME details updated." });
                        } catch (error: any) {
                            const errorMessage = error.response?.data?.message || "Could not save UTME details.";
                            toast({ variant: "destructive", title: "Update Failed", description: errorMessage });
                            valid = false;
                        } finally { setIsSubmitting(false); }
                    }
                    break;
                case 'olevel':
                    valid = await methods.trigger('olevel');
                    if (valid) {
                        setIsSubmitting(true);
                        try {
                            const olevelData = methods.getValues("olevel");
                            const results = olevelData.results.map(r => ({
                                ...r,
                                organization: Number(r.organization),
                                examType: Number(r.examType),
                                numberOfSubjects: Number(r.numberOfSubjects),
                                subject1: Number(r.subject1), grade1: Number(r.grade1),
                                subject2: Number(r.subject2), grade2: Number(r.grade2),
                                subject3: Number(r.subject3), grade3: Number(r.grade3),
                                subject4: Number(r.subject4), grade4: Number(r.grade4),
                                subject5: Number(r.subject5), grade5: Number(r.grade5),
                                subject6: r.subject6 ? Number(r.subject6) : undefined, grade6: r.grade6 ? Number(r.grade6) : undefined,
                                subject7: r.subject7 ? Number(r.subject7) : undefined, grade7: r.grade7 ? Number(r.grade7) : undefined,
                                subject8: r.subject8 ? Number(r.subject8) : undefined, grade8: r.grade8 ? Number(r.grade8) : undefined,
                                subject9: r.subject9 ? Number(r.subject9) : undefined, grade9: r.grade9 ? Number(r.grade9) : undefined,
                            }));
                            await applicationService.updateOLevelResults(applicantId, { results });
                            toast({ title: "Progress Saved", description: "O'Level results updated." });
                        } catch (error: any) {
                            const errorMessage = error.response?.data?.message || "Could not save O'Level results.";
                            toast({ variant: "destructive", title: "Update Failed", description: errorMessage });
                            valid = false;
                        } finally { setIsSubmitting(false); }
                    }
                    break;
                case 'qualification':
                    valid = await methods.trigger('qualification');
                    if (valid) {
                        setIsSubmitting(true);
                        try {
                            const qualData = methods.getValues("qualification");
                            const files: File[] = [];
                            const results = qualData!.results.map((r: any) => {
                                if (r.file && r.file.length > 0) files.push(r.file[0]);
                                else if (r.file instanceof File) files.push(r.file);
                                return {
                                    qualificationId: Number(r.qualificationId),
                                    school: r.school,
                                    courseOfStudy: r.courseOfStudy,
                                    year: r.year,
                                    gradeId: Number(r.gradeId)
                                };
                            });
                            await applicationService.updateQualificationDetails(applicantId, { results, files });
                            toast({ title: "Progress Saved", description: "Qualifications updated." });
                        } catch (error: any) {
                            const errorMessage = error.response?.data?.message || "Could not save qualifications.";
                            toast({ variant: "destructive", title: "Update Failed", description: errorMessage });
                            valid = false;
                        } finally { setIsSubmitting(false); }
                    }
                    break;
                case 'nysc':
                    valid = await methods.trigger('nysc');
                    if (valid) {
                        setIsSubmitting(true);
                        try {
                            const nyscData = methods.getValues("nysc");
                            if (nyscData) {
                                await applicationService.updateNyscDetails(applicantId, nyscData);
                                toast({ title: "Progress Saved", description: "NYSC details updated." });
                            }
                        } catch (error: any) {
                            const errorMessage = error.response?.data?.message || "Could not save NYSC details.";
                            toast({ variant: "destructive", title: "Update Failed", description: errorMessage });
                            valid = false;
                        } finally { setIsSubmitting(false); }
                    }
                    break;
                case 'nextOfKin':
                    valid = await methods.trigger('nextOfKin');
                    if (valid) {
                        setIsSubmitting(true);
                        try {
                            const nextOfKinData = methods.getValues("nextOfKin");
                            await applicationService.updateNextOfKinDetails(applicantId, {
                                name: nextOfKinData.fullName,
                                relationshipId: Number(nextOfKinData.relationshipId),
                                phone: nextOfKinData.phoneNumber,
                                address: nextOfKinData.address
                            });
                            toast({ title: "Progress Saved", description: "Next of Kin details updated." });
                        } catch (error: any) {
                            const errorMessage = error.response?.data?.message || "Could not save Next of Kin details.";
                            toast({ variant: "destructive", title: "Update Failed", description: errorMessage });
                            valid = false;
                        } finally { setIsSubmitting(false); }
                    }
                    break;
                case 'referees':
                    valid = await methods.trigger('referees');
                    if (valid) {
                        setIsSubmitting(true);
                        try {
                            const referees = methods.getValues("referees") || [];
                            await applicationService.updateRefereeDetails(applicantId, { referees });
                            toast({ title: "Progress Saved", description: "Referee details updated." });
                        } catch (error: any) {
                            const errorMessage = error.response?.data?.message || "Could not save referee details.";
                            toast({ variant: "destructive", title: "Update Failed", description: errorMessage });
                            valid = false;
                        } finally { setIsSubmitting(false); }
                    }
                    break;
                case 'documents':
                    valid = await methods.trigger('passport');
                    if (valid) {
                        setIsSubmitting(true);
                        try {
                            const passportFile = methods.getValues("passport" as any);
                            if (passportFile instanceof File) {
                                const email = userData?.data?.email;
                                if (!email) throw new Error("User email unavailable for upload");
                                await applicationService.updatePassport(email, passportFile);
                                await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
                                toast({ title: "Progress Saved", description: "Passport uploaded successfully." });
                            }
                        } catch (error: any) {
                            const errorMessage = error.response?.data?.message || "Could not upload passport.";
                            toast({ variant: "destructive", title: "Upload Failed", description: errorMessage });
                            valid = false;
                        } finally { setIsSubmitting(false); }
                    }
                    break;
                default:
                    valid = true;
            }

            if (!valid) {
                toast({ variant: "destructive", title: "Validation Error", description: "Please fill in all required fields correctly." });
            } else {
                setDirection(1);
                if (currentStep < steps.length - 1) {
                    setCurrentStep(prev => prev + 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            }
        } catch (err) {
            toast({ variant: "destructive", title: "System Error", description: "An unexpected error occurred." });
        }
    };

    const onSubmit = async (data: ApplicationFormData) => {
        setIsSubmitting(true);
        try {
            if (!applicantId) throw new Error("Applicant ID not found");
            await applicationService.submitApplication(applicantId);
            toast({ title: "Application Submitted", description: "Redirecting to payment..." });
        } catch (error) {
            toast({ variant: "destructive", title: "Submission Failed", description: "Please check your inputs and try again." });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Animation Variants
    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 50 : -50,
            opacity: 0,
            scale: 0.95
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
            scale: 1
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 50 : -50,
            opacity: 0,
            scale: 0.95
        })
    };

    return {
        methods,
        currentStep,
        steps,
        direction,
        isSubmitting,
        canSkip,
        nextStep,
        prevStep,
        skipStep,
        onSubmit,
        variants
    };
};
