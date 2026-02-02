import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { programmeTypeService } from "../../services/programmeTypeService";
import { staffService } from "../../services/staffService";
import { commonService } from "../../services/commonService";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/features/admin/components/admission/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/features/admin/components/admission/components/ui/form";
import { Input } from "@/features/admin/components/admission/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/features/admin/components/admission/components/ui/select";
import { Button } from "@/features/admin/components/admission/components/ui/button";
import { Switch } from "@/features/admin/components/admission/components/ui/switch";
import { Loader2, Plus, Save } from "lucide-react";
import { useToast } from "@/features/admin/components/admission/components/ui/use-toast";
import { CreateProgrammeTypeRequest } from "../../types/programmeType";

const formSchema = z.object({
    schoolId: z.string().min(1, "School is required"),
    name: z.string().min(3, "Name must be at least 3 characters"),
    code: z.string().min(2, "Code must be at least 2 characters"),
    modeOfStudy: z.string(),
    admissionType: z.string(),
    admissionRole: z.string().min(1, "Admission Role is required"),
    statementCode: z.string().min(2, "Statement Code is required"),
    modeOfEntryEnabled: z.boolean().default(true),
    modeOfStudyEnabled: z.boolean().default(true),
    enableProgressStatus: z.boolean().default(true),
    onlineResult: z.boolean().default(true),
    certificateRequireResults: z.boolean().default(true),
});

interface CreateProgrammeTypeModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const CreateProgrammeTypeModal = ({ open, onOpenChange }: CreateProgrammeTypeModalProps) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
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
            certificateRequireResults: true,
        },
    });

    const { data: schools } = useQuery({
        queryKey: ["schools"],
        queryFn: programmeTypeService.getAllSchools,
    });

    const { data: roles } = useQuery({
        queryKey: ["roles"],
        queryFn: commonService.getAllRoles,
    });

    const createMutation = useMutation({
        mutationFn: (data: CreateProgrammeTypeRequest) => programmeTypeService.createProgrammeType(data),
        onSuccess: () => {
            toast({
                title: "Programme Type Created",
                description: "The new programme type has been successfully created.",
            });
            queryClient.invalidateQueries({ queryKey: ["programmeTypes"] });
            onOpenChange(false);
            form.reset();
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || "Failed to create programme type.";
            toast({
                variant: "destructive",
                title: "Creation Failed",
                description: message,
            });
        },
    });

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        const payload: CreateProgrammeTypeRequest = {
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
        createMutation.mutate(payload);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] bg-slate-50 border-0 shadow-2xl rounded-3xl overflow-hidden p-0">
                <DialogHeader className="p-6 bg-white border-b border-slate-100">
                    <DialogTitle className="flex items-center gap-2 text-xl font-black text-[#01402c]">
                        <Plus className="h-6 w-6 text-primary" />
                        Create Programme Type
                    </DialogTitle>
                    <DialogDescription>
                        Define a new programme type configuration.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6 max-h-[80vh] overflow-y-auto">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="schoolId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-bold text-slate-700">School</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-11 rounded-xl bg-white border-slate-200">
                                                        <SelectValue placeholder="Select School" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {schools?.map((school) => (
                                                        <SelectItem key={school.id} value={school.id.toString()}>
                                                            {school.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="admissionRole"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-bold text-slate-700">Admission Role</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-11 rounded-xl bg-white border-slate-200">
                                                        <SelectValue placeholder="Select Role" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {roles?.map((role) => (
                                                        <SelectItem key={role.id} value={role.name}>
                                                            {role.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-bold text-slate-700">Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Undergraduate" {...field} className="h-11 rounded-xl bg-white border-slate-200" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="code"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-bold text-slate-700">Code</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. UG" {...field} className="h-11 rounded-xl bg-white border-slate-200" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="statementCode"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-bold text-slate-700">Statement Code</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. UG-STMT" {...field} className="h-11 rounded-xl bg-white border-slate-200" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="modeOfStudy"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-bold text-slate-700">Mode of Study</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-11 rounded-xl bg-white border-slate-200">
                                                        <SelectValue placeholder="Select Mode" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="0">FULL TIME</SelectItem>
                                                    <SelectItem value="1">PART TIME</SelectItem>
                                                    <SelectItem value="2">SANDWICH</SelectItem>
                                                    <SelectItem value="3">DISTANCE LEARNING</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="admissionType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-bold text-slate-700">Admission Type</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-11 rounded-xl bg-white border-slate-200">
                                                        <SelectValue placeholder="Select Type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="1">ONE (UTME)</SelectItem>
                                                    <SelectItem value="2">TWO (DE)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="space-y-4 pt-4 border-t border-slate-200">
                                <h3 className="font-black text-sm uppercase tracking-wider text-slate-500">Configuration</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="modeOfEntryEnabled"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="font-bold text-slate-700">Mode of Entry</FormLabel>
                                                    <FormDescription>Enable mode of entry selection</FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="modeOfStudyEnabled"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="font-bold text-slate-700">Mode of Study</FormLabel>
                                                    <FormDescription>Enable mode of study selection</FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="enableProgressStatus"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="font-bold text-slate-700">Progress Status</FormLabel>
                                                    <FormDescription>Enable student progress tracking</FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="onlineResult"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="font-bold text-slate-700">Online Results</FormLabel>
                                                    <FormDescription>Enable online result checking</FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="certificateRequireResults"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="font-bold text-slate-700">Cert. Result Req.</FormLabel>
                                                    <FormDescription>Certificate requires all results</FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <DialogFooter className="pt-6">
                                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="font-bold text-slate-500">
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={createMutation.isPending} className="gap-2 font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                                    {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {createMutation.isPending ? "Creating..." : "Create Programme Type"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default CreateProgrammeTypeModal;
