import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Save, FileEdit } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { programmeSettingsService } from "../../services/programmeSettingsService";
import { admissionService } from "../../services/admissionService";
import { modeOfEntryService } from "../../services/modeOfEntryService";
import { ProgrammeSettingsCourse, EditProgrammeCourseRequest } from "../../types/programmeSettings";

const formSchema = z.object({
    creditUnit: z.coerce.number().min(0, "Credit unit is required"),
    category: z.enum(["COMPULSORY", "REQUIRED", "ELECTIVE"]),
    alias: z.string().optional().nullable(), // We'll handle number conversion on submit
    aliasSession: z.string().optional().nullable(),
    effectiveSessionId: z.string().optional().nullable(),
    modeOfEntries: z.array(z.number()).min(1, "Select at least one mode of entry"),
});

interface EditCourseModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    course: ProgrammeSettingsCourse | null;
    programmeTypeId: number;
    availableAliases?: ProgrammeSettingsCourse[]; // List of other courses in same context to potentially alias
    onSuccess?: () => void;
}

const EditCourseModal = ({ open, onOpenChange, course, programmeTypeId, availableAliases, onSuccess }: EditCourseModalProps) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            creditUnit: 0,
            category: "COMPULSORY",
            alias: null,
            aliasSession: null,
            effectiveSessionId: null,
            modeOfEntries: [],
        },
    });

    // Fetch Sessions
    const { data: sessions } = useQuery({
        queryKey: ["sessions"],
        queryFn: admissionService.getAllSessions,
        enabled: open
    });

    // Fetch Modes of Entry
    const { data: modes } = useQuery({
        queryKey: ["mode-of-entries", programmeTypeId],
        queryFn: () => modeOfEntryService.getAllModeOfEntries(programmeTypeId),
        enabled: open && !!programmeTypeId
    });

    useEffect(() => {
        if (course) {
            form.reset({
                creditUnit: course.creditUnit,
                category: course.courseType,
                alias: course.alias ? String(availableAliases?.find(c => c.course.courseCode === course.alias)?.course.id || "") : "null",
                aliasSession: course.aliasSession ? String(course.aliasSession.id) : "null",
                effectiveSessionId: course.effectiveSession ? String(course.effectiveSession.id) : "null",
                modeOfEntries: course.modeOfEntries?.map(m => m.id) || [],
            });
        }
    }, [course, form, availableAliases]);

    const mutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: EditProgrammeCourseRequest }) =>
            programmeSettingsService.editProgrammeCourse(id, data),
        onSuccess: () => {
            toast({
                title: "Course Updated",
                description: "Course configuration saved successfully.",
            });
            queryClient.invalidateQueries({ queryKey: ["programme-settings"] });
            if (onSuccess) onSuccess();
            onOpenChange(false);
        },
        onError: (error: any) => {
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: error?.response?.data?.message || "Failed to update course settings.",
            });
        },
    });

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        if (!course?.id) return;

        const payload: EditProgrammeCourseRequest = {
            creditUnit: values.creditUnit,
            category: values.category,
            alias: values.alias && values.alias !== "null" ? Number(values.alias) : null,
            aliasSession: values.aliasSession && values.aliasSession !== "null" ? Number(values.aliasSession) : null,
            effectiveSessionId: values.effectiveSessionId && values.effectiveSessionId !== "null" ? Number(values.effectiveSessionId) : undefined,
            modeOfEntries: values.modeOfEntries,
        };

        mutation.mutate({ id: course.id, data: payload });
    };

    const toggleMode = (id: number) => {
        const current = form.getValues("modeOfEntries");
        const updated = current.includes(id)
            ? current.filter(m => m !== id)
            : [...current, id];
        form.setValue("modeOfEntries", updated);
    };

    // Filter aliases to exclude self
    const validAliases = availableAliases?.filter(c => c.id !== course?.id) || [];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] rounded-3xl p-0 overflow-hidden bg-slate-50 border-0 shadow-2xl">
                <DialogHeader className="p-6 bg-white border-b border-slate-100">
                    <DialogTitle className="flex items-center gap-2 text-xl font-black text-slate-800">
                        <FileEdit className="h-5 w-5 text-primary" />
                        Edit Course Configuration
                    </DialogTitle>
                    <DialogDescription>
                        Modify settings for <span className="font-bold text-foreground">{course?.course.courseCode}</span>.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6 bg-slate-50 max-h-[70vh] overflow-y-auto">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                            {/* Basic Settings */}
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="creditUnit"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold uppercase text-slate-500">Units</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} className="bg-white font-bold" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="category"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold uppercase text-slate-500">Category</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="bg-white font-bold">
                                                        <SelectValue placeholder="Select category" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="COMPULSORY">Compulsory</SelectItem>
                                                    <SelectItem value="REQUIRED">Required</SelectItem>
                                                    <SelectItem value="ELECTIVE">Elective</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Alias Settings */}
                            <div className="space-y-4 p-4 bg-white rounded-xl border border-slate-200">
                                <h4 className="text-sm font-black text-slate-700">Alias Configuration</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="alias"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-bold uppercase text-slate-500">Alias Course</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value || "null"}>
                                                    <FormControl>
                                                        <SelectTrigger className="bg-slate-50">
                                                            <SelectValue placeholder="None" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="null">None</SelectItem>
                                                        {validAliases.map(c => (
                                                            <SelectItem key={c.course.id} value={c.course.id.toString()}>
                                                                {c.course.courseCode}
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
                                        name="aliasSession"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-bold uppercase text-slate-500">Effective Session (Alias)</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value || "null"}>
                                                    <FormControl>
                                                        <SelectTrigger className="bg-slate-50">
                                                            <SelectValue placeholder="None" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="null">None</SelectItem>
                                                        {sessions?.map(s => (
                                                            <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Mode of Entry */}
                            <div className="space-y-3">
                                <FormLabel className="text-xs font-bold uppercase text-slate-500">Allowed Modes of Entry</FormLabel>
                                <div className="grid grid-cols-2 gap-2">
                                    {modes?.map(mode => (
                                        <div key={mode.id} className="flex items-center space-x-2 bg-white p-3 rounded-lg border border-slate-200">
                                            <Checkbox
                                                checked={form.watch("modeOfEntries").includes(mode.id)}
                                                onCheckedChange={() => toggleMode(mode.id)}
                                            />
                                            <span className="text-sm font-medium text-slate-700">{mode.title}</span>
                                        </div>
                                    ))}
                                </div>
                                {form.formState.errors.modeOfEntries && (
                                    <p className="text-destructive text-xs font-medium">{form.formState.errors.modeOfEntries.message}</p>
                                )}
                            </div>

                            {/* Effective Session */}
                            <FormField
                                control={form.control}
                                name="effectiveSessionId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold uppercase text-slate-500">Effective For Session</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || "null"}>
                                            <FormControl>
                                                <SelectTrigger className="bg-white">
                                                    <SelectValue placeholder="None (All Sessions)" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="null">None (All Sessions)</SelectItem>
                                                {sessions?.map(s => (
                                                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <DialogFooter className="pt-4">
                                <Button variant="ghost" type="button" onClick={() => onOpenChange(false)} className="font-bold text-slate-500">Cancel</Button>
                                <Button type="submit" disabled={mutation.isPending} className="font-bold bg-primary text-primary-foreground">
                                    {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Changes
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default EditCourseModal;
