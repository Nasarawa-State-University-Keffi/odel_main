import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { levelService } from "../../services/levelService";
import { staffService } from "../../services/staffService"; // Reuse for programme types
import { Level } from "../../types/level";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; // Keep explicit Label import if needed, though form handles it
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface UpdateLevelModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    level: Level | null;
    onSuccess?: () => void;
}

const updateLevelSchema = z.object({
    title: z.string().min(1, "Title is required"),
    order: z.coerce.number().min(1, "Order must be at least 1"),
    programmeTypeId: z.string().min(1, "Programme Type is required"),
});

const UpdateLevelModal = ({ open, onOpenChange, level, onSuccess }: UpdateLevelModalProps) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const form = useForm<z.infer<typeof updateLevelSchema>>({
        resolver: zodResolver(updateLevelSchema),
        defaultValues: {
            title: "",
            order: 1,
            programmeTypeId: "",
        },
    });

    // Reset form when level changes
    useEffect(() => {
        if (level) {
            form.reset({
                title: level.title,
                order: level.levelOrder, // Map levelOrder to order
                programmeTypeId: level.programmeType.id.toString(),
            });
        }
    }, [level, form]);

    // Fetch Programme Types for dropdown
    const { data: programmeTypes } = useQuery({
        queryKey: ["programmeTypes"],
        queryFn: staffService.getAllProgrammeTypes,
    });

    const updateLevelMutation = useMutation({
        mutationFn: (values: z.infer<typeof updateLevelSchema>) => {
            if (!level) throw new Error("No level selected");
            return levelService.updateLevel(level.id, {
                title: values.title,
                order: values.order,
                programmeTypeId: Number(values.programmeTypeId),
            });
        },
        onSuccess: () => {
            toast({
                title: "Success",
                description: "Level updated successfully.",
            });
            queryClient.invalidateQueries({ queryKey: ["levels"] });
            onOpenChange(false);
            if (onSuccess) onSuccess();
        },
        onError: (error: any) => {
            const status = error.response?.status;
            let message = "Failed to update level.";

            if (status === 404) message = "Level or Programme Type not found.";
            else if (status === 422) message = "Level with this title already exists.";
            else if (status === 400) message = "Validation error.";
            else if (status === 403) message = "Access denied.";

            toast({
                variant: "destructive",
                title: "Error",
                description: message,
            });
        },
    });

    const onSubmit = (values: z.infer<typeof updateLevelSchema>) => {
        updateLevelMutation.mutate(values);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Update Level</DialogTitle>
                    <DialogDescription>
                        Modify the details of the selected academic level.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Title</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. 100 Level" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="order"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Order</FormLabel>
                                    <FormControl>
                                        <Input type="number" min="1" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="programmeTypeId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Programme Type</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Programme Type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {programmeTypes?.map((pt: any) => (
                                                <SelectItem key={pt.id} value={pt.id.toString()}>
                                                    {pt.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={updateLevelMutation.isPending}>
                                {updateLevelMutation.isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Update Level
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default UpdateLevelModal;
