import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { programmeTypeService } from "../../services/programmeTypeService";
import { staffService } from "../../services/staffService";
import { commonService } from "../../services/commonService";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { ProgrammeType, UpdateProgrammeTypeRequest, PaymentSettingReqObject } from "../../types/programmeType";

const generalSchema = z.object({
    schoolId: z.string().min(1, "School is required"),
    name: z.string().min(3, "Name must be at least 3 characters"),
    code: z.string().min(2, "Code must be at least 2 characters"),
    modeOfStudy: z.string(),
    admissionType: z.string(),
    admissionRole: z.string().min(1, "Admission Role is required"),
    statementCode: z.string().min(2, "Statement Code is required"),
    modeOfEntryEnabled: z.boolean(),
    modeOfStudyEnabled: z.boolean(),
    enableProgressStatus: z.boolean(),
    onlineResult: z.boolean(),
    certificateRequireResults: z.boolean(),
});

const paymentSchema = z.object({
    partPayment: z.boolean(),
    partPaymentForNewStudent: z.boolean(),
    firstPaymentPercentage: z.coerce.number().min(0).max(100),
    serviceCode: z.string().min(1, "Service Code is required"),
    maintainFeesForRepeating: z.boolean(),
});

interface EditProgrammeTypeModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    programmeType: ProgrammeType | null;
}

const EditProgrammeTypeModal = ({ open, onOpenChange, programmeType }: EditProgrammeTypeModalProps) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState("general");

    const generalForm = useForm<z.infer<typeof generalSchema>>({
        resolver: zodResolver(generalSchema),
        defaultValues: {
            schoolId: "",
            name: "",
            code: "",
            modeOfStudy: "0",
            admissionType: "1",
            admissionRole: "",
            statementCode: "",
            modeOfEntryEnabled: true,
            modeOfStudyEnabled: true,
            enableProgressStatus: true,
            onlineResult: true,
            certificateRequireResults: false,
        },
    });

    const paymentForm = useForm<z.infer<typeof paymentSchema>>({
        resolver: zodResolver(paymentSchema),
        defaultValues: {
            partPayment: false,
            partPaymentForNewStudent: false,
            firstPaymentPercentage: 60,
            serviceCode: "",
            maintainFeesForRepeating: false,
        },
    });

    useEffect(() => {
        if (programmeType) {
            const modeOfStudyVal = programmeType.modeOfStudy === 'PART_TIME' ? "1" : "0";
            const admTypeMap: Record<string, string> = { "ONE": "1", "TWO": "2", "THREE": "3", "FOUR": "4", "FIVE": "5", "ODEL": "6" };
            const admTypeVal = admTypeMap[programmeType.admissionType] || "1";

            generalForm.reset({
                schoolId: programmeType.school?.id?.toString() || "",
                name: programmeType.name || "",
                code: programmeType.code || "",
                modeOfStudy: modeOfStudyVal,
                admissionType: admTypeVal,
                admissionRole: programmeType.admissionRole || "",
                statementCode: programmeType.statementCode || "",
                modeOfEntryEnabled: programmeType.modeOfEntryEnabled || false,
                modeOfStudyEnabled: programmeType.modeOfStudyEnabled || false,
                enableProgressStatus: programmeType.enableProgressStatus || false,
                onlineResult: programmeType.onlineResult || false,
                certificateRequireResults: programmeType.certificateRequireResults || false,
            });

            paymentForm.reset({
                partPayment: programmeType.partPayment || false,
                partPaymentForNewStudent: programmeType.partPaymentForNewStudent || false,
                firstPaymentPercentage: programmeType.firstPaymentPercentage ?? 60,
                serviceCode: programmeType.serviceCode || "",
                maintainFeesForRepeating: programmeType.maintainFeesForRepeating || false,
            });
        }
    }, [programmeType, generalForm, paymentForm, open]);

    const { data: schools } = useQuery({
        queryKey: ["schools"],
        queryFn: programmeTypeService.getAllSchools,
    });

    const { data: roles } = useQuery({
        queryKey: ["roles"],
        queryFn: commonService.getAllRoles,
    });

    const updateGeneralMutation = useMutation({
        mutationFn: (data: UpdateProgrammeTypeRequest) => programmeTypeService.updateProgrammeType(programmeType!.id, data),
        onSuccess: () => {
            toast({ title: "Updated", description: "General settings updated successfully." });
            queryClient.invalidateQueries({ queryKey: ["programmeTypes"] });
            onOpenChange(false);
        },
        onError: (error: any) => {
            toast({ variant: "destructive", title: "Update Failed", description: error?.response?.data?.message || "Failed to update settings." });
        },
    });

    const updatePaymentMutation = useMutation({
        mutationFn: (data: PaymentSettingReqObject) => programmeTypeService.updatePaymentDetails(programmeType!.id, data),
        onSuccess: () => {
            toast({ title: "Updated", description: "Payment settings updated successfully." });
            queryClient.invalidateQueries({ queryKey: ["programmeTypes"] });
            onOpenChange(false);
        },
        onError: (error: any) => {
            toast({ variant: "destructive", title: "Update Failed", description: error?.response?.data?.message || "Failed to update payment settings." });
        },
    });

    const onGeneralSubmit = (values: z.infer<typeof generalSchema>) => {
        if (!programmeType) return;
        const payload: UpdateProgrammeTypeRequest = {
            schoolId: Number(values.schoolId),
            name: values.name,
            code: values.code,
            modeOfStudy: Number(values.modeOfStudy),
            admissionType: Number(values.admissionType),
            admissionRole: values.admissionRole,
            statementCode: values.statementCode,
            modeOfEntryEnabled: values.modeOfEntryEnabled,
            modeOfStudyEnabled: values.modeOfStudyEnabled,
            enableProgressStatus: values.enableProgressStatus,
            onlineResult: values.onlineResult,
            certificateRequireResults: values.certificateRequireResults,
        };
        updateGeneralMutation.mutate(payload);
    };

    const onPaymentSubmit = (values: z.infer<typeof paymentSchema>) => {
        if (!programmeType) return;
        const payload: PaymentSettingReqObject = {
            partPayment: values.partPayment,
            partPaymentForNewStudent: values.partPaymentForNewStudent,
            firstPaymentPercentage: values.firstPaymentPercentage,
            serviceCode: values.serviceCode,
            maintainFeesForRepeating: values.maintainFeesForRepeating,
        };
        updatePaymentMutation.mutate(payload);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] bg-slate-50 border-0 shadow-2xl rounded-3xl overflow-hidden p-0">
                <DialogHeader className="p-6 bg-white border-b border-slate-100">
                    <DialogTitle className="flex items-center gap-2 text-xl font-black text-[#01402c]">
                        <Settings className="h-6 w-6 text-primary" />
                        Edit Programme Type
                    </DialogTitle>
                    <DialogDescription>
                        Update configuration and payment settings.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6 max-h-[80vh] overflow-y-auto">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-6">
                            <TabsTrigger value="general" className="font-bold">General Settings</TabsTrigger>
                            <TabsTrigger value="payment" className="font-bold">Payment Configuration</TabsTrigger>
                        </TabsList>

                        <TabsContent value="general">
                            <Form {...generalForm}>
                                <form onSubmit={generalForm.handleSubmit(onGeneralSubmit)} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField
                                            control={generalForm.control}
                                            name="schoolId"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-bold text-slate-700">School</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="bg-white"><SelectValue placeholder="Select School" /></SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {schools?.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={generalForm.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-bold text-slate-700">Name</FormLabel>
                                                    <FormControl><Input {...field} className="bg-white" /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={generalForm.control}
                                            name="code"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-bold text-slate-700">Code</FormLabel>
                                                    <FormControl><Input {...field} className="bg-white" /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={generalForm.control}
                                            name="admissionRole"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-bold text-slate-700">Admission Role</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="bg-white"><SelectValue placeholder="Select Role" /></SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {roles?.map(r => <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={generalForm.control}
                                            name="statementCode"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-bold text-slate-700">Statement Code</FormLabel>
                                                    <FormControl><Input {...field} className="bg-white" /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={generalForm.control}
                                            name="modeOfStudy"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-bold text-slate-700">Mode of Study</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl><SelectTrigger className="bg-white"><SelectValue /></SelectTrigger></FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="0">FULL TIME</SelectItem>
                                                            <SelectItem value="1">PART TIME</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={generalForm.control}
                                            name="admissionType"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-bold text-slate-700">Admission Type</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl><SelectTrigger className="bg-white"><SelectValue /></SelectTrigger></FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="1">ONE (UTME)</SelectItem>
                                                            <SelectItem value="2">TWO (DE)</SelectItem>
                                                            <SelectItem value="3">THREE</SelectItem>
                                                            <SelectItem value="4">FOUR</SelectItem>
                                                            <SelectItem value="5">FIVE</SelectItem>
                                                            <SelectItem value="6">ODEL</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="space-y-4 pt-4 border-t border-slate-200">
                                        <h3 className="font-black text-xs uppercase tracking-wider text-slate-500">Toggles</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {[
                                                { name: "modeOfEntryEnabled", label: "Mode of Entry" },
                                                { name: "modeOfStudyEnabled", label: "Mode of Study" },
                                                { name: "enableProgressStatus", label: "Progress Status" },
                                                { name: "onlineResult", label: "Online Result" },
                                                { name: "certificateRequireResults", label: "Cert. Req. Results" }
                                            ].map((toggle) => (
                                                <FormField
                                                    key={toggle.name}
                                                    control={generalForm.control}
                                                    name={toggle.name as any}
                                                    render={({ field }) => (
                                                        <FormItem className="flex flex-row items-center justify-between rounded-xl border border-slate-200 bg-white p-3">
                                                            <FormLabel className="font-bold text-slate-700 text-sm">{toggle.label}</FormLabel>
                                                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex justify-end pt-4">
                                        <Button type="submit" disabled={updateGeneralMutation.isPending} className="font-bold">
                                            {updateGeneralMutation.isPending ? "Saving..." : "Save General Settings"}
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </TabsContent>

                        <TabsContent value="payment">
                            <Form {...paymentForm}>
                                <form onSubmit={paymentForm.handleSubmit(onPaymentSubmit)} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField
                                            control={paymentForm.control}
                                            name="serviceCode"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-bold text-slate-700">Service Code</FormLabel>
                                                    <FormControl><Input {...field} className="bg-white" placeholder="PAY-001" /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={paymentForm.control}
                                            name="firstPaymentPercentage"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-bold text-slate-700">First Payment %</FormLabel>
                                                    <FormControl><Input type="number" step="0.1" {...field} className="bg-white" /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="space-y-4 pt-4 border-t border-slate-200">
                                        <h3 className="font-black text-xs uppercase tracking-wider text-slate-500">Payment Toggles</h3>
                                        <div className="grid grid-cols-1 gap-4">
                                            <FormField
                                                control={paymentForm.control}
                                                name="partPayment"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-row items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
                                                        <div className="space-y-0.5">
                                                            <FormLabel className="font-bold text-slate-700">Part Payment</FormLabel>
                                                            <FormDescription>Allow installment payments</FormDescription>
                                                        </div>
                                                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={paymentForm.control}
                                                name="partPaymentForNewStudent"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-row items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
                                                        <div className="space-y-0.5">
                                                            <FormLabel className="font-bold text-slate-700">Part Payment (New Students)</FormLabel>
                                                            <FormDescription>Allow installments for new students</FormDescription>
                                                        </div>
                                                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={paymentForm.control}
                                                name="maintainFeesForRepeating"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-row items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
                                                        <div className="space-y-0.5">
                                                            <FormLabel className="font-bold text-slate-700">Maintain Fees (Repeating)</FormLabel>
                                                            <FormDescription>Repeating students pay same stored fee</FormDescription>
                                                        </div>
                                                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end pt-4">
                                        <Button type="submit" disabled={updatePaymentMutation.isPending} className="font-bold">
                                            {updatePaymentMutation.isPending ? "Saving..." : "Save Payment Settings"}
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </TabsContent>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default EditProgrammeTypeModal;
