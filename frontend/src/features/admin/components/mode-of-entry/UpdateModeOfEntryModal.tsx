import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { modeOfEntryService } from "../../services/modeOfEntryService";
import { levelService } from "../../services/levelService";
import { ModeOfEntry } from "../../types/modeOfEntry";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/features/admin/components/admission/components/ui/dialog";
import { Button } from "@/features/admin/components/admission/components/ui/button";
import { Input } from "@/features/admin/components/admission/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/features/admin/components/admission/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/features/admin/components/admission/components/ui/form";
import { Switch } from "@/features/admin/components/admission/components/ui/switch";

interface UpdateModeOfEntryModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    modeOfEntry: ModeOfEntry | null;
    programmeTypeId: string;
}

const updateModeOfEntrySchema = z.object({
    title: z.string().min(1, "Title is required"),
    value: z.string().min(1, "Value is required"),
    levelId: z.string().min(1, "Level is required"),
    numberOfSemesters: z.coerce.number().min(1, "Must be at least 1 semester"),
    requireUtmeScores: z.boolean(),
    requireScreeningDocuments: z.boolean(),
    useOnMatriculation: z.boolean(),
});

const UpdateModeOfEntryModal = ({ open, onOpenChange, modeOfEntry, programmeTypeId }: UpdateModeOfEntryModalProps) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const form = useForm<z.infer<typeof updateModeOfEntrySchema>>({
        resolver: zodResolver(updateModeOfEntrySchema),
        defaultValues: {
            title: "",
            value: "",
            levelId: "",
            numberOfSemesters: 0,
            requireUtmeScores: false,
            requireScreeningDocuments: false,
            useOnMatriculation: false,
        },
    });

    useEffect(() => {
        if (modeOfEntry) {
            form.reset({
                title: modeOfEntry.title,
                value: modeOfEntry.value,
                levelId: modeOfEntry.level?.id.toString() || "",
                numberOfSemesters: modeOfEntry.numberOfSemesters,
                requireUtmeScores: modeOfEntry.requireUtmeScores,
                requireScreeningDocuments: modeOfEntry.requireScreeningDocuments,
                useOnMatriculation: modeOfEntry.useOnMatriculation,
            });
        }
    }, [modeOfEntry, form]);

    // Fetch Levels for dropdown (dependant on programmeTypeId)
    const { data: levels, isLoading: isLoadingLevels } = useQuery({
        queryKey: ["levels", programmeTypeId],
        queryFn: () => levelService.getAllLevels(Number(programmeTypeId)),
        enabled: !!programmeTypeId,
    });

    const updateMutation = useMutation({
        mutationFn: (values: z.infer<typeof updateModeOfEntrySchema>) => {
            if (!modeOfEntry) throw new Error("No mode selected");
            return modeOfEntryService.updateModeOfEntry(modeOfEntry.id, {
                ...values,
                levelId: Number(values.levelId),
                programmeTypeId: Number(programmeTypeId),
            });
        },
        onSuccess: () => {
            toast({
                title: "Success",
                description: "Mode of entry updated successfully.",
            });
            queryClient.invalidateQueries({ queryKey: ["modeOfEntries"] });
            onOpenChange(false);
        },
        onError: (error: any) => {
            const status = error.response?.status;
            let message = "Failed to update mode of entry.";

            if (status === 404) message = "Mode, Programme Type or Level not found.";
            else if (status === 422) message = error.response?.data?.message || "Value already exists or invalid configuration.";
            else if (status === 400) message = "Validation error.";
            else if (status === 403) message = "Access denied.";

            toast({
                variant: "destructive",
                title: "Error",
                description: message,
            });
        },
    });

    const onSubmit = (values: z.infer<typeof updateModeOfEntrySchema>) => {
        updateMutation.mutate(values);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Update Mode of Entry</DialogTitle>
                    <DialogDescription>
                        Modify the entry mode details.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Title</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. UTME" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="value"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Value (Code)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. utme" {...field} />
                                        </FormControl>
                                        <FormDescription className="text-[10px]">Unique identifier code</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="levelId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Entry Level</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={isLoadingLevels ? "Loading..." : "Select Level"} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {levels?.map((level) => (
                                                    <SelectItem key={level.id} value={level.id.toString()}>
                                                        {level.title}
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
                                name="numberOfSemesters"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Duration (Semesters)</FormLabel>
                                        <FormControl>
                                            <Input type="number" min="1" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="space-y-3 border rounded-lg p-4 bg-muted/20">
                            <FormField
                                control={form.control}
                                name="requireUtmeScores"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-background">
                                        <div className="space-y-0.5">
                                            <FormLabel>Require UTME Scores</FormLabel>
                                            <FormDescription className="text-[10px]">
                                                Does this mode require a JAMB/UTME score?
                                            </FormDescription>
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

                            <FormField
                                control={form.control}
                                name="requireScreeningDocuments"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-background">
                                        <div className="space-y-0.5">
                                            <FormLabel>Require Screening Docs</FormLabel>
                                            <FormDescription className="text-[10px]">
                                                Require O'Level/Certificate uploads?
                                            </FormDescription>
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

                            <FormField
                                control={form.control}
                                name="useOnMatriculation"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-background">
                                        <div className="space-y-0.5">
                                            <FormLabel>Use on Matriculation</FormLabel>
                                            <FormDescription className="text-[10px]">
                                                Valid for matriculation number generation?
                                            </FormDescription>
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
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={updateMutation.isPending}>
                                {updateMutation.isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Update Mode of Entry
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default UpdateModeOfEntryModal;
