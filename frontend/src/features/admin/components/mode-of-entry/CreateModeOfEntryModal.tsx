import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { modeOfEntryService } from "../../services/modeOfEntryService";
import { levelService } from "../../services/levelService";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";

interface CreateModeOfEntryModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    programmeTypeId: string;
}

const createModeOfEntrySchema = z.object({
    title: z.string().min(1, "Title is required"),
    value: z.string().min(1, "Value is required"),
    levelId: z.string().min(1, "Level is required"),
    numberOfSemesters: z.coerce.number().min(1, "Must be at least 1 semester"),
    requireUtmeScores: z.boolean().default(false),
    requireScreeningDocuments: z.boolean().default(false),
    useOnMatriculation: z.boolean().default(false),
});

const CreateModeOfEntryModal = ({ open, onOpenChange, programmeTypeId }: CreateModeOfEntryModalProps) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const form = useForm<z.infer<typeof createModeOfEntrySchema>>({
        resolver: zodResolver(createModeOfEntrySchema),
        defaultValues: {
            title: "",
            value: "",
            levelId: "",
            numberOfSemesters: 2,
            requireUtmeScores: false,
            requireScreeningDocuments: false,
            useOnMatriculation: false,
        },
    });

    // Fetch Levels for dropdown (dependant on programmeTypeId)
    const { data: levels, isLoading: isLoadingLevels } = useQuery({
        queryKey: ["levels", programmeTypeId],
        queryFn: () => levelService.getAllLevels(Number(programmeTypeId)),
        enabled: !!programmeTypeId && open,
    });

    const createMutation = useMutation({
        mutationFn: (values: z.infer<typeof createModeOfEntrySchema>) => {
            return modeOfEntryService.createModeOfEntry({
                ...values,
                levelId: Number(values.levelId),
                programmeTypeId: Number(programmeTypeId),
            });
        },
        onSuccess: () => {
            toast({
                title: "Success",
                description: "Mode of entry created successfully.",
            });
            queryClient.invalidateQueries({ queryKey: ["modeOfEntries"] });
            form.reset();
            onOpenChange(false);
        },
        onError: (error: any) => {
            const status = error.response?.status;
            let message = "Failed to create mode of entry.";

            if (status === 404) message = "Programme Type or Level not found.";
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

    const onSubmit = (values: z.infer<typeof createModeOfEntrySchema>) => {
        if (!programmeTypeId) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Please select a programme type first.",
            });
            return;
        }
        createMutation.mutate(values);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create Mode of Entry</DialogTitle>
                    <DialogDescription>
                        Define a new entry mode for the selected programme.
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
                            <Button type="submit" disabled={createMutation.isPending}>
                                {createMutation.isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Create Mode of Entry
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default CreateModeOfEntryModal;
