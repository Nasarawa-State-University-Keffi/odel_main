import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Save, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";

import { admissionService } from "../../services/admissionService";
import { programmeTypeService } from "../../services/programmeTypeService";
import { modeOfEntryService } from "../../services/modeOfEntryService";
import { CreateApplicationTypeRequest, ApplicationType } from "../../types/admission";

const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
    programmeType: z.string().min(1, "Programme Type is required"),

    // Fees - Use defaults to avoid validation errors on empty/undefined strings
    applicationFee: z.coerce.number().default(0),
    admissionFee: z.coerce.number().default(0),
    screeningFee: z.coerce.number().default(0),
    changeProgrammeFee: z.coerce.number().default(0),
    verificationFee: z.coerce.number().default(0),

    // Service Codes
    applicationFeeServiceCode: z.string().optional(),
    screeningFeeServiceCode: z.string().optional(),
    acceptanceFeeServiceCode: z.string().optional(),
    changeOfProgrammeFeeServiceCode: z.string().optional(),
    verificationFeeServiceCode: z.string().optional(),
    verificationPaymentPlatform: z.string().optional(),

    // Flags
    autoLoadUtme: z.boolean().default(false),
    autoClearApplicants: z.boolean().default(false),
    modeOfEntryEnabled: z.boolean().default(false),
    utmeDetailsEnabled: z.boolean().default(false),
    utmeRegEnabled: z.boolean().default(false),
    processPostUtme: z.boolean().default(false),
    freshApplicationEnabled: z.boolean().default(true),
    ssceDetailsEnabled: z.boolean().default(false),
    screeningDetailsEnabled: z.boolean().default(false),
    nyscDetailsEnabled: z.boolean().default(false),
    contactDetailsEnabled: z.boolean().default(true),
    nextOfKinDetailsEnabled: z.boolean().default(true),
    qualificationDetailsEnabled: z.boolean().default(false),
    qualificationDocumentEnabled: z.boolean().default(false),
    scratchCardDetailsEnabled: z.boolean().default(false),
    refereeDetailsEnabled: z.boolean().default(false),
    transcriptRequestEnabled: z.boolean().default(false),
    ssceVerification: z.boolean().default(false),
    manualScratchCard: z.boolean().default(false),
    collectNonAutomaticOrgs: z.boolean().default(false),
    requireVerificationPayment: z.boolean().default(false),

    // Config
    numberOfSittings: z.coerce.number().default(2),
    numberOfQualifications: z.coerce.number().default(1),
    screeningForm: z.coerce.number().default(1),

    // Lists
    modeOfEntries: z.array(z.number()).default([]),
    autoScratchCards: z.array(z.number()).default([]),
    statuses: z.array(z.string()).default([]),
});

interface ApplicationTypeFormProps {
    open: boolean;
    onClose: () => void;
    initialData?: ApplicationType | null;
}

// Temporary Constants
const SCREENING_FORMS = [
    { id: 1, name: "Standard Screening" },
    { id: 2, name: "Advanced Screening" },
];

const STUDENT_STATUSES = [
    "STUDENT", "CLEARED", "ADMITTED", "APPLICANT"
];

const ApplicationTypeForm = ({ open, onClose, initialData }: ApplicationTypeFormProps) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            programmeType: "",
            applicationFee: 0,
            admissionFee: 0,
            screeningFee: 0,
            changeProgrammeFee: 0,
            verificationFee: 0,
            applicationFeeServiceCode: "",
            screeningFeeServiceCode: "",
            acceptanceFeeServiceCode: "",
            changeOfProgrammeFeeServiceCode: "",
            verificationFeeServiceCode: "",
            verificationPaymentPlatform: "REMITA",
            autoLoadUtme: false,
            autoClearApplicants: false,
            modeOfEntryEnabled: true,
            utmeDetailsEnabled: true,
            utmeRegEnabled: false,
            processPostUtme: true,
            freshApplicationEnabled: true,
            ssceDetailsEnabled: true,
            screeningDetailsEnabled: true,
            nyscDetailsEnabled: false,
            contactDetailsEnabled: true,
            nextOfKinDetailsEnabled: true,
            qualificationDetailsEnabled: false,
            qualificationDocumentEnabled: false,
            scratchCardDetailsEnabled: true,
            refereeDetailsEnabled: false,
            transcriptRequestEnabled: false,
            ssceVerification: true,
            manualScratchCard: false,
            collectNonAutomaticOrgs: false,
            requireVerificationPayment: true,
            numberOfSittings: 2,
            numberOfQualifications: 1,
            screeningForm: 1,
            modeOfEntries: [],
            autoScratchCards: [],
            statuses: ["STUDENT"],
        },
    });

    const selectedProgrammeTypeId = form.watch("programmeType");

    // Fetch Programme Types
    const { data: programmeTypes } = useQuery({
        queryKey: ["programmeTypes"],
        queryFn: programmeTypeService.getAllProgrammeTypes,
    });

    // Fetch Modes of Entry when Programme Type changes
    const { data: modeOfEntries } = useQuery({
        queryKey: ["modeOfEntries", selectedProgrammeTypeId],
        queryFn: () => modeOfEntryService.getAllModeOfEntries(Number(selectedProgrammeTypeId)),
        enabled: !!selectedProgrammeTypeId,
    });

    useEffect(() => {
        if (initialData) {
            form.reset({
                name: initialData.name,
                programmeType: initialData.programmeType?.id.toString(),
                applicationFee: initialData.applicationFee,
                admissionFee: initialData.admissionFee,
                screeningFee: initialData.screeningFee,
                changeProgrammeFee: initialData.changeProgrammeFee,
                verificationFee: initialData.verificationFee,
                applicationFeeServiceCode: initialData.applicationFeeServiceCode || "",
                screeningFeeServiceCode: initialData.screeningFeeServiceCode || "",
                acceptanceFeeServiceCode: initialData.acceptanceFeeServiceCode || "",
                changeOfProgrammeFeeServiceCode: initialData.changeOfProgrammeFeeServiceCode || "",
                verificationFeeServiceCode: initialData.verificationFeeServiceCode || "",
                verificationPaymentPlatform: (typeof initialData.verificationPaymentPlatform === 'object'
                    ? (initialData.verificationPaymentPlatform as any)?.name || (initialData.verificationPaymentPlatform as any)?.code || "REMITA"
                    : initialData.verificationPaymentPlatform) || "REMITA",
                autoLoadUtme: initialData.autoLoadUtme,
                autoClearApplicants: initialData.autoClearApplicants,
                modeOfEntryEnabled: initialData.modeOfEntryEnabled,
                utmeDetailsEnabled: initialData.utmeDetailsEnabled,
                utmeRegEnabled: initialData.utmeRegEnabled,
                processPostUtme: initialData.processPostUtme,
                freshApplicationEnabled: initialData.freshApplicationEnabled,
                ssceDetailsEnabled: initialData.ssceDetailsEnabled,
                screeningDetailsEnabled: initialData.screeningDetailsEnabled,
                nyscDetailsEnabled: initialData.nyscDetailsEnabled,
                contactDetailsEnabled: initialData.contactDetailsEnabled,
                nextOfKinDetailsEnabled: initialData.nextOfKinDetailsEnabled,
                qualificationDetailsEnabled: initialData.qualificationDetailsEnabled,
                qualificationDocumentEnabled: initialData.qualificationDocumentEnabled,
                scratchCardDetailsEnabled: initialData.scratchCardDetailsEnabled,
                refereeDetailsEnabled: initialData.refereeDetailsEnabled,
                transcriptRequestEnabled: initialData.transcriptRequestEnabled,
                ssceVerification: initialData.ssceVerification,
                manualScratchCard: initialData.manualScratchCard,
                collectNonAutomaticOrgs: initialData.collectNonAutomaticOrgs,
                requireVerificationPayment: initialData.requireVerificationPayment,
                numberOfSittings: initialData.numberOfSittings,
                numberOfQualifications: initialData.numberOfQualifications,
                screeningForm: initialData.screeningForm,
                // Map ModeOfEntry objects to their IDs for the form (which expects numbers)
                modeOfEntries: initialData.modeOfEntries?.map((m: any) => typeof m === 'object' ? m.id : m) || [],
                autoScratchCards: initialData.autoScratchCards || [],
                statuses: initialData.statuses || [],
            });
        } else {
            form.reset({
                name: "",
                programmeType: "",
                applicationFee: 0,
                admissionFee: 0,
                screeningFee: 0,
                changeProgrammeFee: 0,
                verificationFee: 0,
                applicationFeeServiceCode: "",
                screeningFeeServiceCode: "",
                acceptanceFeeServiceCode: "",
                changeOfProgrammeFeeServiceCode: "",
                verificationFeeServiceCode: "",
                verificationPaymentPlatform: "REMITA",
                autoLoadUtme: false,
                autoClearApplicants: false,
                modeOfEntryEnabled: true,
                utmeDetailsEnabled: true,
                utmeRegEnabled: false,
                processPostUtme: true,
                freshApplicationEnabled: true,
                ssceDetailsEnabled: true,
                screeningDetailsEnabled: true,
                nyscDetailsEnabled: false,
                contactDetailsEnabled: true,
                nextOfKinDetailsEnabled: true,
                qualificationDetailsEnabled: false,
                qualificationDocumentEnabled: false,
                scratchCardDetailsEnabled: true,
                refereeDetailsEnabled: false,
                transcriptRequestEnabled: false,
                ssceVerification: true,
                manualScratchCard: false,
                collectNonAutomaticOrgs: false,
                requireVerificationPayment: true,
                numberOfSittings: 2,
                numberOfQualifications: 1,
                screeningForm: 1,
                modeOfEntries: [],
                autoScratchCards: [],
                statuses: ["STUDENT"],
            });
        }
    }, [initialData, form]);

    const mutation = useMutation({
        mutationFn: (data: CreateApplicationTypeRequest) => {
            if (initialData) {
                return admissionService.updateApplicationType(initialData.id, data);
            }
            return admissionService.createApplicationType(data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["applicationTypes"] });
            toast({ title: "Success", description: `Application Type ${initialData ? "updated" : "created"} successfully.` });
            onClose();
        },
        onError: (error: any) => {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.response?.data?.message || `Failed to ${initialData ? "update" : "create"} application type`
            });
        }
    });

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        const payload: CreateApplicationTypeRequest = {
            name: values.name,
            programmeType: Number(values.programmeType),

            // Fees (Coerced to number by zod, but good to ensure)
            applicationFee: Number(values.applicationFee),
            admissionFee: Number(values.admissionFee),
            screeningFee: Number(values.screeningFee),
            changeProgrammeFee: Number(values.changeProgrammeFee),
            verificationFee: Number(values.verificationFee),

            // Service Codes
            applicationFeeServiceCode: values.applicationFeeServiceCode || "",
            screeningFeeServiceCode: values.screeningFeeServiceCode || "",
            acceptanceFeeServiceCode: values.acceptanceFeeServiceCode || "",
            changeOfProgrammeFeeServiceCode: values.changeOfProgrammeFeeServiceCode || "",
            verificationFeeServiceCode: values.verificationFeeServiceCode || "",
            verificationPaymentPlatform: values.verificationPaymentPlatform || "",

            // Flags
            autoLoadUtme: values.autoLoadUtme,
            autoClearApplicants: values.autoClearApplicants,
            modeOfEntryEnabled: values.modeOfEntryEnabled,
            utmeDetailsEnabled: values.utmeDetailsEnabled,
            utmeRegEnabled: values.utmeRegEnabled,
            processPostUtme: values.processPostUtme,
            freshApplicationEnabled: values.freshApplicationEnabled,
            ssceDetailsEnabled: values.ssceDetailsEnabled,
            screeningDetailsEnabled: values.screeningDetailsEnabled,
            nyscDetailsEnabled: values.nyscDetailsEnabled,
            contactDetailsEnabled: values.contactDetailsEnabled,
            nextOfKinDetailsEnabled: values.nextOfKinDetailsEnabled,
            qualificationDetailsEnabled: values.qualificationDetailsEnabled,
            qualificationDocumentEnabled: values.qualificationDocumentEnabled,
            scratchCardDetailsEnabled: values.scratchCardDetailsEnabled,
            refereeDetailsEnabled: values.refereeDetailsEnabled,
            transcriptRequestEnabled: values.transcriptRequestEnabled,
            ssceVerification: values.ssceVerification,
            manualScratchCard: values.manualScratchCard,
            collectNonAutomaticOrgs: values.collectNonAutomaticOrgs,
            requireVerificationPayment: values.requireVerificationPayment,

            // Config
            numberOfSittings: values.numberOfSittings,
            numberOfQualifications: values.numberOfQualifications,
            screeningForm: Number(values.screeningForm),

            // Arrays
            statuses: values.statuses || [],
            modeOfEntries: values.modeOfEntries || [],
            autoScratchCards: values.autoScratchCards || [],
        };

        mutation.mutate(payload);
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="px-6 py-4 border-b bg-background z-10">
                    <DialogTitle>{initialData ? "Edit" : "Create"} Application Type</DialogTitle>
                    <DialogDescription>
                        Configure the settings for this application type.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
                        console.error("Form Validation Errors:", errors);
                        toast({
                            variant: "destructive",
                            title: "Validation Error",
                            description: "Please check the form for errors. Some required fields might be missing in other tabs.",
                        });
                    })} className="flex flex-col flex-1 overflow-hidden">
                        <div className="flex-1 overflow-hidden">
                            <Tabs defaultValue="core" className="h-full flex flex-col">
                                <div className="px-6 pt-4 border-b">
                                    <TabsList className="grid w-full grid-cols-4 max-w-[600px]">
                                        <TabsTrigger value="core">Core Info</TabsTrigger>
                                        <TabsTrigger value="fees">Fees & Payment</TabsTrigger>
                                        <TabsTrigger value="config">Configuration</TabsTrigger>
                                        <TabsTrigger value="settings">Settings</TabsTrigger>
                                    </TabsList>
                                </div>

                                <ScrollArea className="flex-1">
                                    <div className="p-6">
                                        <TabsContent value="core" className="space-y-6 mt-0">
                                            {/* Basic Info */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name="name"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Name</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="e.g. UTME Application" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="programmeType"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Programme Type</FormLabel>
                                                            <Select onValueChange={field.onChange} value={field.value || ""}>
                                                                <FormControl>
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Select Programme Type" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    {programmeTypes?.map((pt) => (
                                                                        <SelectItem key={pt.id} value={pt.id.toString()}>{pt.name}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            {/* Mode of Entries */}
                                            {modeOfEntries && modeOfEntries.length > 0 && (
                                                <div className="space-y-4 border p-4 rounded-md">
                                                    <h3 className="font-semibold text-sm text-foreground">Allowed Mode of Entries</h3>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                                        {modeOfEntries.map((mode) => (
                                                            <FormField
                                                                key={mode.id}
                                                                control={form.control}
                                                                name="modeOfEntries"
                                                                render={({ field }) => {
                                                                    return (
                                                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                                                            <FormControl>
                                                                                <Checkbox
                                                                                    checked={field.value?.includes(mode.id)}
                                                                                    onCheckedChange={(checked) => {
                                                                                        return checked
                                                                                            ? field.onChange([...field.value, mode.id])
                                                                                            : field.onChange(
                                                                                                field.value?.filter(
                                                                                                    (value) => value !== mode.id
                                                                                                )
                                                                                            )
                                                                                    }}
                                                                                />
                                                                            </FormControl>
                                                                            <FormLabel className="font-normal text-sm cursor-pointer">
                                                                                {mode.title}
                                                                            </FormLabel>
                                                                        </FormItem>
                                                                    )
                                                                }}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </TabsContent>

                                        <TabsContent value="fees" className="space-y-6 mt-0">
                                            {/* Fees Setup */}
                                            <div className="space-y-4 border p-4 rounded-md">
                                                <h3 className="font-semibold text-sm text-foreground">Fees Amounts</h3>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    <FormField control={form.control} name="applicationFee" render={({ field }) => (
                                                        <FormItem><FormLabel>Application Fee</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                                    )} />
                                                    <FormField control={form.control} name="admissionFee" render={({ field }) => (
                                                        <FormItem><FormLabel>Admission Fee</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                                    )} />
                                                    <FormField control={form.control} name="screeningFee" render={({ field }) => (
                                                        <FormItem><FormLabel>Screening Fee</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                                    )} />
                                                    <FormField control={form.control} name="verificationFee" render={({ field }) => (
                                                        <FormItem><FormLabel>Verification Fee</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                                    )} />
                                                    <FormField control={form.control} name="changeProgrammeFee" render={({ field }) => (
                                                        <FormItem><FormLabel>Change Prog. Fee</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                                    )} />
                                                </div>
                                            </div>

                                            {/* Service Codes */}
                                            <div className="space-y-4 border p-4 rounded-md">
                                                <h3 className="font-semibold text-sm text-foreground">Service Codes (Payment Integration)</h3>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <FormField control={form.control} name="applicationFeeServiceCode" render={({ field }) => (
                                                        <FormItem><FormLabel>App Fee Code</FormLabel><FormControl><Input placeholder="CODE" {...field} /></FormControl><FormMessage /></FormItem>
                                                    )} />
                                                    <FormField control={form.control} name="acceptanceFeeServiceCode" render={({ field }) => (
                                                        <FormItem><FormLabel>Acceptance Fee Code</FormLabel><FormControl><Input placeholder="CODE" {...field} /></FormControl><FormMessage /></FormItem>
                                                    )} />
                                                    <FormField control={form.control} name="screeningFeeServiceCode" render={({ field }) => (
                                                        <FormItem><FormLabel>Screening Fee Code</FormLabel><FormControl><Input placeholder="CODE" {...field} /></FormControl><FormMessage /></FormItem>
                                                    )} />
                                                    <FormField control={form.control} name="verificationFeeServiceCode" render={({ field }) => (
                                                        <FormItem><FormLabel>Verification Fee Code</FormLabel><FormControl><Input placeholder="CODE" {...field} /></FormControl><FormMessage /></FormItem>
                                                    )} />
                                                </div>
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="config" className="space-y-6 mt-0">
                                            {/* Config */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <FormField control={form.control} name="numberOfSittings" render={({ field }) => (
                                                    <FormItem><FormLabel>No. of Sittings</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                                )} />
                                                <FormField control={form.control} name="numberOfQualifications" render={({ field }) => (
                                                    <FormItem><FormLabel>No. of Qualifications</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                                )} />
                                                <FormField
                                                    control={form.control}
                                                    name="screeningForm"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Screening Form Type</FormLabel>
                                                            <Select onValueChange={(v) => field.onChange(Number(v))} value={field.value?.toString() || ""}>
                                                                <FormControl>
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Select Screening Form" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    {SCREENING_FORMS.map((sf) => (
                                                                        <SelectItem key={sf.id} value={sf.id.toString()}>{sf.name}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            {/* Statuses */}
                                            <div className="space-y-4 border p-4 rounded-md">
                                                <h3 className="font-semibold text-sm text-foreground">Applicable Statuses</h3>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                    {STUDENT_STATUSES.map((status) => (
                                                        <FormField
                                                            key={status}
                                                            control={form.control}
                                                            name="statuses"
                                                            render={({ field }) => {
                                                                return (
                                                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                                                        <FormControl>
                                                                            <Checkbox
                                                                                checked={field.value?.includes(status)}
                                                                                onCheckedChange={(checked) => {
                                                                                    return checked
                                                                                        ? field.onChange([...field.value, status])
                                                                                        : field.onChange(
                                                                                            field.value?.filter(
                                                                                                (value) => value !== status
                                                                                            )
                                                                                        )
                                                                                }}
                                                                            />
                                                                        </FormControl>
                                                                        <FormLabel className="font-normal cursor-pointer">
                                                                            {status}
                                                                        </FormLabel>
                                                                    </FormItem>
                                                                )
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Auto Scratch Cards */}
                                            <div className="space-y-4 border p-4 rounded-md">
                                                <h3 className="font-semibold text-sm text-foreground">Auto Scratch Cards (SSCE Orgs)</h3>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                    {[
                                                        { id: 1, name: "WAEC" },
                                                        { id: 2, name: "NECO" },
                                                        { id: 3, name: "NABTEB" },
                                                        { id: 4, name: "NBAIS" }
                                                    ].map((org) => (
                                                        <FormField
                                                            key={org.id}
                                                            control={form.control}
                                                            name="autoScratchCards"
                                                            render={({ field }) => {
                                                                return (
                                                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                                                        <FormControl>
                                                                            <Checkbox
                                                                                checked={field.value?.includes(org.id)}
                                                                                onCheckedChange={(checked) => {
                                                                                    return checked
                                                                                        ? field.onChange([...field.value, org.id])
                                                                                        : field.onChange(
                                                                                            field.value?.filter(
                                                                                                (value) => value !== org.id
                                                                                            )
                                                                                        )
                                                                                }}
                                                                            />
                                                                        </FormControl>
                                                                        <FormLabel className="font-normal cursor-pointer">
                                                                            {org.name}
                                                                        </FormLabel>
                                                                    </FormItem>
                                                                )
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="settings" className="space-y-6 mt-0">
                                            {/* Boolean Flags Grid */}
                                            <div className="space-y-4 border p-4 rounded-md">
                                                <h3 className="font-semibold text-sm text-foreground">Settings & Features</h3>
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                    {[
                                                        { name: "freshApplicationEnabled", label: "Fresh Application Enabled" },
                                                        { name: "modeOfEntryEnabled", label: "Enable Mode of Entry Selection" },
                                                        { name: "utmeDetailsEnabled", label: "Collect UTME Details" },
                                                        { name: "utmeRegEnabled", label: "Enable UTME Registration" },
                                                        { name: "processPostUtme", label: "Process Post UTME" },
                                                        { name: "autoLoadUtme", label: "Auto Load UTME Results" },
                                                        { name: "ssceDetailsEnabled", label: "Collect SSCE Details" },
                                                        { name: "screeningDetailsEnabled", label: "Enable Screening Details" },
                                                        { name: "nyscDetailsEnabled", label: "Collect NYSC Details" },
                                                        { name: "contactDetailsEnabled", label: "Collect Contact Details" },
                                                        { name: "nextOfKinDetailsEnabled", label: "Collect Next of Kin Details" },
                                                        { name: "qualificationDetailsEnabled", label: "Collect Qualification Details" },
                                                        { name: "qualificationDocumentEnabled", label: "Collect Qualification Documents" },
                                                        { name: "scratchCardDetailsEnabled", label: "Enable Scratch Card Details" },
                                                        { name: "refereeDetailsEnabled", label: "Collect Referee Details" },
                                                        { name: "transcriptRequestEnabled", label: "Enable Transcript Requests" },
                                                        { name: "ssceVerification", label: "Enable SSCE Verification" },
                                                        { name: "requireVerificationPayment", label: "Require Verification Payment" },
                                                        { name: "autoClearApplicants", label: "Auto Clear Applicants" },
                                                        { name: "manualScratchCard", label: "Enable Manual Scratch Card" },
                                                        { name: "collectNonAutomaticOrgs", label: "Collect Non-Auto Orgs" }
                                                    ].map((item) => (
                                                        <FormField
                                                            key={item.name}
                                                            control={form.control}
                                                            name={item.name as any}
                                                            render={({ field }) => (
                                                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                                                    <div className="space-y-0.5">
                                                                        <FormLabel className="text-sm font-medium">{item.label}</FormLabel>
                                                                    </div>
                                                                    <FormControl>
                                                                        <Switch
                                                                            checked={field.value}
                                                                            onCheckedChange={field.onChange}
                                                                        />
                                                                    </FormControl>
                                                                </FormItem>
                                                            )}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </TabsContent>
                                    </div>
                                </ScrollArea>
                            </Tabs>
                        </div>

                        <DialogFooter className="px-6 py-4 border-t bg-muted/40 z-10">
                            <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={mutation.isPending} className="bg-[#01402c] hover:bg-[#01402c]/90">
                                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {initialData ? "Update" : "Create"} Application Type
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default ApplicationTypeForm;
