import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ApplicationType, UpdateApplicationTypeRequest } from "@/features/admin/types/admission";
import { admissionService } from "@/features/admin/services/admissionService";
import { staffService, ProgrammeType } from "@/features/admin/services/staffService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface UpdateApplicationTypeModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    applicationType: ApplicationType | null;
    onSuccess: () => void;
}

// Zod Schema matching the UpdateApplicationTypeRequest interface
const updateSchema = z.object({
    name: z.string().min(1, "Name is required"),
    programmeType: z.number(),
    statuses: z.array(z.string()),

    // Automation Flags
    autoLoadUtme: z.boolean(),
    autoClearApplicants: z.boolean(),
    processPostUtme: z.boolean(),
    ssceVerification: z.boolean(),

    // Feature Flags
    modeOfEntryEnabled: z.boolean(),
    ssceDetailsEnabled: z.boolean(),
    screeningDetailsEnabled: z.boolean(),
    utmeDetailsEnabled: z.boolean(),
    utmeRegEnabled: z.boolean(),
    nyscDetailsEnabled: z.boolean(),
    contactDetailsEnabled: z.boolean(),
    qualificationDetailsEnabled: z.boolean(),
    qualificationDocumentEnabled: z.boolean(),
    nextOfKinDetailsEnabled: z.boolean(),
    refereeDetailsEnabled: z.boolean(),
    scratchCardDetailsEnabled: z.boolean(),
    freshApplicationEnabled: z.boolean(),
    transcriptRequestEnabled: z.boolean(),

    // Legacy / Specific Flags
    manualScratchCard: z.boolean(),
    collectNonAutomaticOrgs: z.boolean(),
    requireVerificationPayment: z.boolean(),

    // Numeric Configs
    numberOfQualifications: z.number().min(0),
    numberOfSittings: z.number().min(0),
    screeningForm: z.number().min(0),

    // Fees
    applicationFee: z.number().min(0),
    admissionFee: z.number().min(0),
    screeningFee: z.number().min(0),
    changeProgrammeFee: z.number().min(0),
    verificationFee: z.number().min(0),

    // Service Codes
    applicationFeeServiceCode: z.string(),
    screeningFeeServiceCode: z.string(),
    acceptanceFeeServiceCode: z.string(),
    changeOfProgrammeFeeServiceCode: z.string(),
    verificationFeeServiceCode: z.string(),
    verificationPaymentPlatform: z.string(),

    // Arrays (Simple handling for now)
    modeOfEntries: z.array(z.number()),
    autoScratchCards: z.array(z.number()),
});

type FormValues = z.infer<typeof updateSchema>;

const UpdateApplicationTypeModal = ({ open, onOpenChange, applicationType, onSuccess }: UpdateApplicationTypeModalProps) => {
    const { toast } = useToast();
    const [programmeTypes, setProgrammeTypes] = useState<ProgrammeType[]>([]);

    useEffect(() => {
        const fetchProgrammeTypes = async () => {
            try {
                const types = await staffService.getAllProgrammeTypes();
                setProgrammeTypes(types);
            } catch (error) {
                console.error("Failed to fetch programme types", error);
            }
        };
        fetchProgrammeTypes();
    }, []);
    const form = useForm<FormValues>({
        resolver: zodResolver(updateSchema),
        defaultValues: {
            name: "",
            programmeType: 0,
            statuses: [],
            autoLoadUtme: false,
            autoClearApplicants: false,
            processPostUtme: false,
            ssceVerification: false,
            modeOfEntryEnabled: false,
            ssceDetailsEnabled: false,
            screeningDetailsEnabled: false,
            utmeDetailsEnabled: false,
            utmeRegEnabled: false,
            nyscDetailsEnabled: false,
            contactDetailsEnabled: false,
            qualificationDetailsEnabled: false,
            qualificationDocumentEnabled: false,
            nextOfKinDetailsEnabled: false,
            refereeDetailsEnabled: false,
            scratchCardDetailsEnabled: false,
            freshApplicationEnabled: false,
            transcriptRequestEnabled: false,
            manualScratchCard: false,
            collectNonAutomaticOrgs: false,
            requireVerificationPayment: false,
            numberOfQualifications: 2,
            numberOfSittings: 2,
            screeningForm: 0,
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
            modeOfEntries: [],
            autoScratchCards: []
        }
    });

    // Populate form when applicationType changes
    useEffect(() => {
        if (applicationType && open) {

            // HANDLE FORM RESET
            form.reset({
                name: applicationType.name,
                programmeType: 0,
                statuses: [applicationType.status || "CLEARED"],

                // Mapping from nested automation object if valid, else defaults
                autoLoadUtme: applicationType.automation?.autoLoadUtme ?? false,
                autoClearApplicants: applicationType.automation?.autoClearApplicants ?? false,
                processPostUtme: applicationType.automation?.processPostUtme ?? false,
                ssceVerification: applicationType.automation?.ssceVerification ?? false,

                modeOfEntryEnabled: applicationType.modeOfEntryEnabled ?? false,
                ssceDetailsEnabled: applicationType.requirements?.ssceRequired ?? false,
                screeningDetailsEnabled: applicationType.requirements?.screeningRequired ?? false,
                utmeDetailsEnabled: applicationType.requirements?.utmeRequired ?? false,
                utmeRegEnabled: false,
                nyscDetailsEnabled: applicationType.requirements?.nyscRequired ?? false,
                contactDetailsEnabled: true,
                qualificationDetailsEnabled: applicationType.requirements?.qualificationDetailsRequired ?? false,
                qualificationDocumentEnabled: applicationType.requirements?.qualificationDocumentsRequired ?? false,
                nextOfKinDetailsEnabled: applicationType.requirements?.nextOfKinRequired ?? false,
                refereeDetailsEnabled: applicationType.requirements?.refereeRequired ?? false,
                scratchCardDetailsEnabled: false,
                freshApplicationEnabled: true,
                transcriptRequestEnabled: false,

                manualScratchCard: (applicationType as any).manualScratchCard ?? false,
                collectNonAutomaticOrgs: (applicationType as any).collectNonAutomaticOrgs ?? false,
                requireVerificationPayment: (applicationType as any).requireVerificationPayment ?? false,

                numberOfQualifications: (applicationType as any).numberOfQualifications ?? 2,
                numberOfSittings: (applicationType as any).numberOfSittings ?? 2,
                screeningForm: (applicationType as any).screeningForm === "ONE" ? 1 : ((applicationType as any).screeningForm === "TWO" ? 2 : 0),

                // Fees mapping
                applicationFee: applicationType.fees?.application ?? (applicationType as any).applicationFee ?? 0,
                admissionFee: applicationType.fees?.admission ?? (applicationType as any).admissionFee ?? 0,
                screeningFee: applicationType.fees?.screening ?? (applicationType as any).screeningFee ?? 0,
                changeProgrammeFee: applicationType.fees?.programmeChange ?? (applicationType as any).changeProgrammeFee ?? 0,
                verificationFee: (applicationType as any).verificationFee ?? 0,

                // Service Codes
                applicationFeeServiceCode: (applicationType as any).applicationFeeServiceCode ?? "N/A",
                screeningFeeServiceCode: applicationType.paymentCodes?.screening ?? (applicationType as any).screeningFeeServiceCode ?? "",
                acceptanceFeeServiceCode: applicationType.paymentCodes?.acceptance ?? (applicationType as any).acceptanceFeeServiceCode ?? "",
                changeOfProgrammeFeeServiceCode: (applicationType as any).changeOfProgrammeFeeServiceCode ?? "",
                verificationFeeServiceCode: (applicationType as any).verificationFeeServiceCode ?? "",
                verificationPaymentPlatform: (applicationType as any).verificationPaymentPlatform?.name ?? "REMITA",

                modeOfEntries: [],
                autoScratchCards: []
            });
        }
    }, [applicationType, open, form]);

    // Separate effect to handle Programme Type ID mapping without resetting entire form
    useEffect(() => {
        if (applicationType && programmeTypes.length > 0) {
            const match = programmeTypes.find(p => p.name === applicationType.programmeType?.name);
            if (match) {
                // Only update this specific field
                const currentVal = form.getValues("programmeType");
                // Only update if it's currently 0 (default) to avoid overwriting user selection if they somehow changed it
                if (currentVal === 0) {
                    form.setValue("programmeType", match.id);
                }
            }
        }
    }, [programmeTypes, applicationType, form]);

    const onSubmit = async (data: FormValues) => {
        if (!applicationType) return;
        try {
            await admissionService.updateAdmission(applicationType.id, data as unknown as UpdateApplicationTypeRequest);
            toast({
                title: "Success",
                description: "Application type updated successfully",
            });
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            console.error(error);
            if (error.response?.status === 403) {
                toast({
                    title: "Permission Denied",
                    description: "You do not have permission to update this configuration. Please contact an administrator.",
                    variant: "destructive"
                });
            } else {
                toast({
                    title: "Error",
                    description: error.response?.data?.message || "Failed to update configuration",
                    variant: "destructive"
                });
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95%] max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden rounded-xl">
                <DialogHeader className="px-6 py-4 border-b border-border/40 shrink-0 bg-muted/5">
                    <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                        <Save className="h-5 w-5 text-primary" />
                        Edit Configuration
                    </DialogTitle>
                    <DialogDescription>
                        Update settings for <span className="font-bold text-foreground">{applicationType?.name}</span>
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
                    <div className="flex-1 overflow-hidden">
                        <Tabs defaultValue="general" className="h-full flex flex-col">
                            <div className="px-6 pt-4 shrink-0">
                                <TabsList className="flex w-full overflow-x-auto md:grid md:grid-cols-4 bg-muted/50 p-1 h-auto min-h-[3rem] rounded-xl gap-1 no-scrollbar">
                                    <TabsTrigger value="general" className="rounded-lg font-bold flex-1 md:flex-none data-[state=active]:shadow-sm">General</TabsTrigger>
                                    <TabsTrigger value="requirements" className="rounded-lg font-bold flex-1 md:flex-none data-[state=active]:shadow-sm">Requirements</TabsTrigger>
                                    <TabsTrigger value="fees" className="rounded-lg font-bold flex-1 md:flex-none data-[state=active]:shadow-sm whitespace-nowrap">Fees & Payments</TabsTrigger>
                                    <TabsTrigger value="automation" className="rounded-lg font-bold flex-1 md:flex-none data-[state=active]:shadow-sm">Automation</TabsTrigger>
                                </TabsList>
                            </div>

                            <ScrollArea className="flex-1">
                                <div className="p-6 space-y-6">
                                    {/* GENERAL TAB */}
                                    <TabsContent value="general" className="mt-0 space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Application Name</Label>
                                                <Input {...form.register("name")} className="font-bold" />
                                                <p className="text-[10px] text-muted-foreground">Internal name for this application category.</p>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Programme Type ID</Label>
                                                <Select
                                                    value={form.watch("programmeType")?.toString() || "0"}
                                                    onValueChange={(value) => form.setValue("programmeType", parseInt(value))}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select Programme Type" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {programmeTypes.map((type) => (
                                                            <SelectItem key={type.id} value={type.id.toString()}>
                                                                {type.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Max Qualifications</Label>
                                                <Input type="number" {...form.register("numberOfQualifications", { valueAsNumber: true })} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Max Sittings</Label>
                                                <Input type="number" {...form.register("numberOfSittings", { valueAsNumber: true })} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Screening Form ID</Label>
                                                <Input type="number" {...form.register("screeningForm", { valueAsNumber: true })} />
                                            </div>
                                        </div>
                                    </TabsContent>

                                    {/* REQUIREMENTS TAB */}
                                    <TabsContent value="requirements" className="mt-0">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                                            {[
                                                { id: "ssceDetailsEnabled", label: "SSCE Results" },
                                                { id: "utmeDetailsEnabled", label: "UTME Details" },
                                                { id: "screeningDetailsEnabled", label: "Screening Info" },
                                                { id: "nyscDetailsEnabled", label: "NYSC Certificate" },
                                                { id: "qualificationDetailsEnabled", label: "Educ. Qualifications" },
                                                { id: "qualificationDocumentEnabled", label: "Upload Documents" },
                                                { id: "nextOfKinDetailsEnabled", label: "Next of Kin" },
                                                { id: "refereeDetailsEnabled", label: "Referee Details" },
                                                { id: "contactDetailsEnabled", label: "Contact Info" },
                                                { id: "utmeRegEnabled", label: "External UTME Reg" },
                                                { id: "modeOfEntryEnabled", label: "Mode of Entry Selection" },
                                                { id: "transcriptRequestEnabled", label: "Transcript Request" },
                                                { id: "scratchCardDetailsEnabled", label: "Scratch Card Logic" },
                                                { id: "freshApplicationEnabled", label: "Allow Fresh Applications" },
                                            ].map((item) => (
                                                <div key={item.id} className="flex items-start space-x-3 p-3 rounded-xl border border-border/40 hover:bg-muted/10 transition-colors">
                                                    <Checkbox
                                                        id={item.id}
                                                        checked={form.watch(item.id as any)}
                                                        onCheckedChange={(checked) => form.setValue(item.id as any, checked === true)}
                                                    />
                                                    <div className="grid gap-1.5 leading-none">
                                                        <label htmlFor={item.id} className="text-sm font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                            {item.label}
                                                        </label>
                                                        <p className="text-[10px] text-muted-foreground">Enable this section for applicants.</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </TabsContent>

                                    {/* FEES TAB */}
                                    <TabsContent value="fees" className="mt-0 space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-4 p-4 rounded-xl border border-border/50 bg-primary/5">
                                                <h4 className="font-black text-xs uppercase tracking-widest text-primary mb-4 border-b border-primary/20 pb-2">Amounts</h4>
                                                <div className="space-y-3">
                                                    <div className="grid grid-cols-3 items-center gap-4">
                                                        <Label className="col-span-1 text-xs uppercase font-bold text-muted-foreground/80">Application</Label>
                                                        <Input type="number" className="col-span-2 bg-background font-mono" {...form.register("applicationFee", { valueAsNumber: true })} />
                                                    </div>
                                                    <div className="grid grid-cols-3 items-center gap-4">
                                                        <Label className="col-span-1 text-xs uppercase font-bold text-muted-foreground/80">Acceptance</Label>
                                                        <Input type="number" className="col-span-2 bg-background font-mono" {...form.register("admissionFee", { valueAsNumber: true })} />
                                                    </div>
                                                    <div className="grid grid-cols-3 items-center gap-4">
                                                        <Label className="col-span-1 text-xs uppercase font-bold text-muted-foreground/80">Screening</Label>
                                                        <Input type="number" className="col-span-2 bg-background font-mono" {...form.register("screeningFee", { valueAsNumber: true })} />
                                                    </div>
                                                    <div className="grid grid-cols-3 items-center gap-4">
                                                        <Label className="col-span-1 text-xs uppercase font-bold text-muted-foreground/80">Prog. Change</Label>
                                                        <Input type="number" className="col-span-2 bg-background font-mono" {...form.register("changeProgrammeFee", { valueAsNumber: true })} />
                                                    </div>
                                                    <div className="grid grid-cols-3 items-center gap-4">
                                                        <Label className="col-span-1 text-xs uppercase font-bold text-muted-foreground/80">Verification</Label>
                                                        <Input type="number" className="col-span-2 bg-background font-mono" {...form.register("verificationFee", { valueAsNumber: true })} />
                                                    </div>
                                                    <div className="flex items-center space-x-2 pt-2">
                                                        <Checkbox
                                                            id="requireVerificationPayment"
                                                            checked={form.watch("requireVerificationPayment")}
                                                            onCheckedChange={(checked) => form.setValue("requireVerificationPayment", checked === true)}
                                                        />
                                                        <label htmlFor="requireVerificationPayment" className="text-xs font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                            Require Verification Payment
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-4 p-4 rounded-xl border border-border/50 bg-muted/10">
                                                <h4 className="font-black text-xs uppercase tracking-widest text-muted-foreground mb-4 border-b border-border/50 pb-2">Service Codes</h4>
                                                <div className="space-y-3">
                                                    <div className="grid grid-cols-3 items-center gap-4">
                                                        <Label className="col-span-1 text-xs uppercase font-bold text-muted-foreground/80">App. Code</Label>
                                                        <Input className="col-span-2 bg-background font-mono text-xs" {...form.register("applicationFeeServiceCode")} />
                                                    </div>
                                                    <div className="grid grid-cols-3 items-center gap-4">
                                                        <Label className="col-span-1 text-xs uppercase font-bold text-muted-foreground/80">Acc. Code</Label>
                                                        <Input className="col-span-2 bg-background font-mono text-xs" {...form.register("acceptanceFeeServiceCode")} />
                                                    </div>
                                                    <div className="grid grid-cols-3 items-center gap-4">
                                                        <Label className="col-span-1 text-xs uppercase font-bold text-muted-foreground/80">Scr. Code</Label>
                                                        <Input className="col-span-2 bg-background font-mono text-xs" {...form.register("screeningFeeServiceCode")} />
                                                    </div>
                                                    <div className="grid grid-cols-3 items-center gap-4">
                                                        <Label className="col-span-1 text-xs uppercase font-bold text-muted-foreground/80">Chg. Prg. Code</Label>
                                                        <Input className="col-span-2 bg-background font-mono text-xs" {...form.register("changeOfProgrammeFeeServiceCode")} />
                                                    </div>
                                                    <div className="grid grid-cols-3 items-center gap-4">
                                                        <Label className="col-span-1 text-xs uppercase font-bold text-muted-foreground/80">Ver. Code</Label>
                                                        <Input className="col-span-2 bg-background font-mono text-xs" {...form.register("verificationFeeServiceCode")} />
                                                    </div>
                                                    <div className="grid grid-cols-3 items-center gap-4">
                                                        <Label className="col-span-1 text-xs uppercase font-bold text-muted-foreground/80">Ver. Platform</Label>
                                                        <Input className="col-span-2 bg-background font-mono text-xs" {...form.register("verificationPaymentPlatform")} placeholder="REMITA" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    {/* AUTOMATION TAB */}
                                    <TabsContent value="automation" className="mt-0">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                            {[
                                                { id: "autoLoadUtme", label: "Auto Load UTME Results", desc: "Fetch results directly from JAMB/Third-party" },
                                                { id: "autoClearApplicants", label: "Auto Clear Applicants", desc: "System decides admission based on thresholds" },
                                                { id: "processPostUtme", label: "Run Post-UTME Process", desc: "Enable internal examination workflow" },
                                                { id: "ssceVerification", label: "Verify SSCE Results", desc: "Connect to NECO/WAEC APIs for check" },
                                                { id: "manualScratchCard", label: "Manual Scratch Card", desc: "Allow applicants to type pin/serial manually" },
                                                { id: "collectNonAutomaticOrgs", label: "Non-Auto Organizations", desc: "Collect data for unverified bodies" },
                                            ].map((item) => (
                                                <div key={item.id} className="flex flex-row items-center justify-between rounded-xl border border-border/40 p-4 shadow-sm hover:shadow-md transition-all bg-card">
                                                    <div className="space-y-0.5">
                                                        <Label htmlFor={item.id} className="text-sm font-black text-foreground/90">{item.label}</Label>
                                                        <p className="text-[10px] text-muted-foreground font-medium">{item.desc}</p>
                                                    </div>
                                                    <Checkbox
                                                        id={item.id}
                                                        checked={form.watch(item.id as any)}
                                                        onCheckedChange={(checked) => form.setValue(item.id as any, checked === true)}
                                                        className="h-5 w-5"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </TabsContent>
                                </div>
                            </ScrollArea>
                        </Tabs>
                    </div>

                    <div className="p-4 border-t border-border/40 shrink-0 bg-muted/5 flex items-center justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl font-bold">Cancel</Button>
                        <Button type="submit" disabled={form.formState.isSubmitting} className="rounded-xl font-bold shadow-lg shadow-primary/20 px-8">
                            {form.formState.isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default UpdateApplicationTypeModal;
