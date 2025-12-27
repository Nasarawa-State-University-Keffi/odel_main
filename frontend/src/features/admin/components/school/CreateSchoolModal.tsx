import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { schoolService } from "../../services/schoolService";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Building2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { CreateSchoolRequest } from "../../types/school";

const schema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    shortName: z.string().min(2, "Short name must be at least 2 characters"),
    preSenateCommitteeLabel: z.string().min(3, "Label is required"),
    dominant: z.boolean(),
    crossProgrammeTypeChange: z.boolean(),
    maintainFeeForRepeating: z.boolean(),
});

interface CreateSchoolModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const CreateSchoolModal = ({ open, onOpenChange }: CreateSchoolModalProps) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const form = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: "",
            shortName: "",
            preSenateCommitteeLabel: "Senate Committee on Results",
            dominant: false,
            crossProgrammeTypeChange: false,
            maintainFeeForRepeating: false,
        },
    });

    const mutation = useMutation({
        mutationFn: (data: CreateSchoolRequest) => schoolService.createSchool(data),
        onSuccess: () => {
            toast({ title: "Success", description: "School created successfully." });
            queryClient.invalidateQueries({ queryKey: ["schools"] });
            queryClient.invalidateQueries({ queryKey: ["dominantSchool"] });
            form.reset();
            onOpenChange(false);
        },
        onError: (error: any) => {
            toast({ variant: "destructive", title: "Error", description: error?.response?.data?.message || "Failed to create school." });
        },
    });

    const onSubmit = (values: z.infer<typeof schema>) => {
        const payload: CreateSchoolRequest = {
            name: values.name,
            shortName: values.shortName,
            preSenateCommitteeLabel: values.preSenateCommitteeLabel,
            dominant: values.dominant,
            crossProgrammeTypeChange: values.crossProgrammeTypeChange,
            maintainFeeForRepeating: values.maintainFeeForRepeating,
        };
        mutation.mutate(payload);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] bg-slate-50 border-0 shadow-2xl rounded-3xl overflow-hidden p-0">
                <DialogHeader className="p-6 bg-white border-b border-slate-100">
                    <DialogTitle className="flex items-center gap-2 text-xl font-black text-[#01402c]">
                        <Building2 className="h-6 w-6 text-primary" />
                        Create New School
                    </DialogTitle>
                    <DialogDescription>
                        Define a new institution within the system.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6 max-h-[80vh] overflow-y-auto">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold text-slate-700">School Name</FormLabel>
                                        <FormControl><Input {...field} className="bg-white" placeholder="e.g. Federal University of Lafia" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="shortName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-bold text-slate-700">Short Name</FormLabel>
                                            <FormControl><Input {...field} className="bg-white" placeholder="e.g. FULAFIA" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="preSenateCommitteeLabel"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-bold text-slate-700">Senate Label</FormLabel>
                                            <FormControl><Input {...field} className="bg-white" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="space-y-4 pt-4 border-t border-slate-200">
                                <h3 className="font-black text-xs uppercase tracking-wider text-slate-500">Configuration</h3>
                                <div className="grid grid-cols-1 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="dominant"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="font-bold text-slate-700">Dominant School</FormLabel>
                                                    <FormDescription>Set as primary institution</FormDescription>
                                                </div>
                                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="maintainFeeForRepeating"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="font-bold text-slate-700">Maintain Fees (Repeating)</FormLabel>
                                                    <FormDescription>Repeaters pay confirmed previous fees</FormDescription>
                                                </div>
                                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="crossProgrammeTypeChange"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="font-bold text-slate-700">Cross-Programme Change</FormLabel>
                                                    <FormDescription>Allow changing across programme types</FormDescription>
                                                </div>
                                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button type="submit" disabled={mutation.isPending} className="font-bold bg-primary hover:bg-primary/90 text-white w-full md:w-auto">
                                    {mutation.isPending ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Create School
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default CreateSchoolModal;
