import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { programmeService } from "../../services/programmeService";
import { departmentService } from "../../services/departmentService";
import { levelService } from "../../services/levelService";
import { staffService } from "../../services/staffService";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CreateProgrammeModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    programmeTypeId: string;
}

const baseSchema = z.object({
    departmentId: z.string().min(1, "Department is required"),
    programmeTypeId: z.string().min(1, "Programme Type is required"),
    name: z.string().min(1, "Name is required"),
    code: z.string().min(1, "Code is required"),
    programmeDuration: z.coerce.number().min(1, "Duration must be at least 1"),
    minimumSemesters: z.coerce.number().min(1, "Minimum semesters must be at least 1"),
    maximumSemesters: z.coerce.number().min(1, "Maximum semesters must be at least 1"),
    maximumCapacity: z.coerce.number().min(1, "Capacity must be at least 1"),
    revenueCode: z.string().min(1, "Revenue Code is required"),
    levelId: z.string().optional(),
    availableOnline: z.boolean(),
    awardId: z.string().min(1, "Award is required"),
    awardName: z.string().min(1, "Award Name is required"),
});

const CreateProgrammeModal = ({ open, onOpenChange, programmeTypeId }: CreateProgrammeModalProps) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Fetch Programme Types to check modeOfEntryEnabled
    const { data: programmeTypes } = useQuery({
        queryKey: ["programmeTypes"],
        queryFn: () => staffService.getAllProgrammeTypes(),
    });

    const selectedType = programmeTypes?.find(pt => pt.id.toString() === programmeTypeId);
    const isLevelRequired = selectedType && !selectedType.modeOfEntryEnabled;

    const schema = baseSchema.superRefine((data, ctx) => {
        if (isLevelRequired && !data.levelId) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Starting Level is required for this programme type",
                path: ["levelId"],
            });
        }
    });

    const form = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema),
        defaultValues: {
            departmentId: "",
            programmeTypeId: programmeTypeId || "",
            name: "",
            code: "",
            programmeDuration: 4,
            minimumSemesters: 8,
            maximumSemesters: 12,
            maximumCapacity: 100,
            revenueCode: "",
            levelId: "",
            availableOnline: true,
            awardId: "",
            awardName: "",
        },
    });

    // Update programme type if prop changes
    useEffect(() => {
        if (programmeTypeId) {
            form.setValue("programmeTypeId", programmeTypeId);
        }
    }, [programmeTypeId, form]);

    // Force re-validation when programmeTypeId changes (as it affects schema)
    useEffect(() => {
        form.trigger("levelId");
    }, [programmeTypeId, form, isLevelRequired]);


    // Fetch Departments
    const { data: departments, isLoading: isLoadingDepartments } = useQuery({
        queryKey: ["departments"],
        queryFn: () => departmentService.getAllDepartments(),
    });

    // Fetch Levels (Dependent on Programme Type)
    const { data: levels, isLoading: isLoadingLevels } = useQuery({
        queryKey: ["levels", programmeTypeId],
        queryFn: () => levelService.getAllLevels(Number(programmeTypeId)),
        enabled: !!programmeTypeId,
    });

    // Fetch Awards
    const { data: awards, isLoading: isLoadingAwards } = useQuery({
        queryKey: ["awards"],
        queryFn: () => programmeService.getAllAwards(),
    });

    const createMutation = useMutation({
        mutationFn: (values: z.infer<typeof schema>) => {
            return programmeService.createProgramme({
                ...values,
                departmentId: Number(values.departmentId),
                programmeTypeId: Number(values.programmeTypeId),
                levelId: values.levelId ? Number(values.levelId) : 0, // Handle optional levelId
                awardId: Number(values.awardId),
                // Ensure name matches typescript interface requirements if it was optional in previous steps
                name: values.name || "",
            } as any); // Cast to any to bypass strict type check for now if interface mismatch persists
        },
        onSuccess: () => {
            toast({
                title: "Success",
                description: "Programme created successfully.",
            });
            queryClient.invalidateQueries({ queryKey: ["programmes"] });
            onOpenChange(false);
            form.reset();
        },
        onError: (error: any) => {
            const status = error.response?.status;
            let message = "Failed to create programme.";

            if (status === 404) message = "Invalid Department, Programme Type, Award or Level.";
            else if (status === 422) message = error.response?.data?.message || "Programme or Code already exists.";
            else if (status === 400) message = "Validation Error or Starting Level required.";
            else if (status === 403) message = "Access denied.";

            toast({
                variant: "destructive",
                title: "Error",
                description: message,
            });
        },
    });

    const onSubmit = (values: z.infer<typeof schema>) => {
        createMutation.mutate(values);
    };

    const handleAwardChange = (awardId: string) => {
        const selectedAward = awards?.find(a => a.id.toString() === awardId);
        form.setValue("awardId", awardId);
        if (selectedAward) {
            form.setValue("awardName", selectedAward.name);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create New Programme</DialogTitle>
                    <DialogDescription>
                        Fill in the details to create a new academic programme.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel>Programme Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. B.Sc. Computer Science" {...field} />
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
                                        <FormLabel>Programme Code</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. CSC" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="revenueCode"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Revenue Code</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. REV-CSC-001" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="departmentId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Department</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={isLoadingDepartments ? "Loading..." : "Select Department"} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {departments?.map((dept) => (
                                                    <SelectItem key={dept.id} value={dept.id.toString()}>
                                                        {dept.name}
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
                                name="levelId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Starting Level {isLevelRequired && <span className="text-destructive">*</span>}</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={isLoadingLevels ? "Loading..." : "Select Level"} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {levels?.map((lvl) => (
                                                    <SelectItem key={lvl.id} value={lvl.id.toString()}>
                                                        {lvl.title}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="awardId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Award</FormLabel>
                                        <Select onValueChange={handleAwardChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={isLoadingAwards ? "Loading..." : "Select Award"} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {awards?.map((award) => (
                                                    <SelectItem key={award.id} value={award.id.toString()}>
                                                        {award.name}
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
                                name="maximumCapacity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Maximum Capacity</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="programmeDuration"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Duration (Yrs)</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="minimumSemesters"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Min Semesters</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="maximumSemesters"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Max Semesters</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="availableOnline"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <div className="space-y-0.5">
                                        <FormLabel>Available Online</FormLabel>
                                        <FormDescription>
                                            Is this programme available for online application?
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

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={createMutation.isPending}>
                                {createMutation.isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Create Programme
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default CreateProgrammeModal;
