import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { levelService } from "../../services/levelService";
import { programmeTypeService } from "../../services/programmeTypeService";
import { staffService } from "../../services/staffService";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/features/admin/components/admission/components/ui/dialog";
import { Button } from "@/features/admin/components/admission/components/ui/button";
import { Input } from "@/features/admin/components/admission/components/ui/input";
import { Label } from "@/features/admin/components/admission/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/features/admin/components/admission/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/features/admin/components/admission/components/ui/form";

interface CreateLevelModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

const createLevelSchema = z.object({
    title: z.string().min(1, "Title is required"),
    order: z.coerce.number().min(1, "Order must be at least 1"),
    programmeTypeId: z.string().min(1, "Programme Type is required"),
});

const CreateLevelModal = ({ open, onOpenChange, onSuccess }: CreateLevelModalProps) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const form = useForm<z.infer<typeof createLevelSchema>>({
        resolver: zodResolver(createLevelSchema),
        defaultValues: {
            title: "",
            order: 1,
            programmeTypeId: "",
        },
    });

    // Fetch Programme Types
    const { data: programmeTypes } = useQuery({
        queryKey: ["programmeTypes"],
        queryFn: programmeTypeService.getAllProgrammeTypes,
    });

    const createLevelMutation = useMutation({
        mutationFn: (values: z.infer<typeof createLevelSchema>) => {
            return levelService.createLevel({
                title: values.title,
                order: values.order,
                programmeTypeId: Number(values.programmeTypeId),
            });
        },
        onSuccess: () => {
            toast({
                title: "Success",
                description: "Level created successfully.",
            });
            queryClient.invalidateQueries({ queryKey: ["levels"] });
            form.reset();
            onOpenChange(false);
            if (onSuccess) onSuccess();
        },
        onError: (error: any) => {
            const status = error.response?.status;
            let message = "Failed to create level.";

            if (status === 404) message = "Programme Type not found.";
            else if (status === 422) message = "Level already exists.";
            else if (status === 400) message = "Validation error.";
            else if (status === 403) message = "Access denied.";

            toast({
                variant: "destructive",
                title: "Error",
                description: message,
            });
        },
    });

    const onSubmit = (values: z.infer<typeof createLevelSchema>) => {
        createLevelMutation.mutate(values);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create New Level</DialogTitle>
                    <DialogDescription>
                        Add a new academic level to a programme type.
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
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                            <Button type="submit" disabled={createLevelMutation.isPending}>
                                {createLevelMutation.isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Create Level
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default CreateLevelModal;
