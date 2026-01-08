import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Save, Settings2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/features/admin/components/admission/components/ui/dialog";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/features/admin/components/admission/components/ui/form";
import { Input } from "@/features/admin/components/admission/components/ui/input";
import { Checkbox } from "@/features/admin/components/admission/components/ui/checkbox";
import { Button } from "@/features/admin/components/admission/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { programmeSettingsService } from "../../services/programmeSettingsService";
import { SemesterSettings, UpdateSemesterSettingsRequest } from "../../types/programmeSettings";

const formSchema = z.object({
    totalCreditUnit: z.coerce.number().min(1, "Maximum credit unit is required"),
    minimumCreditUnit: z.coerce.number().min(1, "Minimum credit unit is required"),
    numberOfElectives: z.coerce.number().min(0, "Number of electives cannot be negative"),
    passMark: z.coerce.number().min(0).max(100, "Pass mark must be between 0 and 100"),
    isSiwes: z.boolean().default(false),
});

interface EditSemesterSettingsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    settings: SemesterSettings | null;
    onSuccess?: () => void;
}

const EditSemesterSettingsModal = ({ open, onOpenChange, settings, onSuccess }: EditSemesterSettingsModalProps) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            totalCreditUnit: 24,
            minimumCreditUnit: 15,
            numberOfElectives: 2,
            passMark: 40,
            isSiwes: false,
        },
    });

    useEffect(() => {
        if (settings) {
            form.reset({
                totalCreditUnit: settings.totalCreditUnit,
                minimumCreditUnit: settings.minimumCreditUnit,
                numberOfElectives: settings.numberOfElectives,
                passMark: settings.passMark,
                isSiwes: settings.isSiwes,
            });
        }
    }, [settings, form]);

    const mutation = useMutation({
        mutationFn: (values: UpdateSemesterSettingsRequest) =>
            programmeSettingsService.updateSemesterSettings(settings!.id, values),
        onSuccess: () => {
            toast({
                title: "Settings Updated",
                description: "Semester configuration has been updated successfully.",
            });
            queryClient.invalidateQueries({ queryKey: ["programme-settings"] });
            if (onSuccess) onSuccess();
            onOpenChange(false);
        },
        onError: (error: any) => {
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: error?.response?.data?.message || "Failed to update semester settings.",
            });
        },
    });

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        if (!settings?.id) return;
        // Ensure values strictly match the expected interface, though Zod schema enforces this runtime-wise
        const payload: UpdateSemesterSettingsRequest = {
            totalCreditUnit: values.totalCreditUnit,
            minimumCreditUnit: values.minimumCreditUnit,
            numberOfElectives: values.numberOfElectives,
            passMark: values.passMark,
            isSiwes: values.isSiwes
        };
        mutation.mutate(payload);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] rounded-3xl p-0 overflow-hidden bg-slate-50 border-0 shadow-2xl">
                <DialogHeader className="p-6 bg-white border-b border-slate-100">
                    <DialogTitle className="flex items-center gap-2 text-xl font-black text-slate-800">
                        <Settings2 className="h-5 w-5 text-primary" />
                        Edit Configuration
                    </DialogTitle>
                    <DialogDescription>
                        Update credit limits and requirements for this semester.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6 bg-slate-50">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="totalCreditUnit"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1">
                                            <FormLabel className="text-xs font-bold uppercase text-slate-500">Max Units</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} className="bg-white font-bold" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="minimumCreditUnit"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1">
                                            <FormLabel className="text-xs font-bold uppercase text-slate-500">Min Units</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} className="bg-white font-bold" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="numberOfElectives"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1">
                                            <FormLabel className="text-xs font-bold uppercase text-slate-500">Electives Req.</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} className="bg-white font-bold" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="passMark"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1">
                                            <FormLabel className="text-xs font-bold uppercase text-slate-500">Pass Mark (%)</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} className="bg-white font-bold" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="isSiwes"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-2xl border bg-white p-4">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel className="text-sm font-bold text-slate-700">
                                                SIWES Semester
                                            </FormLabel>
                                            <FormDescription className="text-xs">
                                                Mark this semester for industrial training.
                                            </FormDescription>
                                        </div>
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

export default EditSemesterSettingsModal;
