
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { FloatingInput } from "@/components/ui/floating-input";
import { FloatingSelect } from "@/components/ui/floating-select";
import { useToast } from "@/hooks/use-toast";
import { Staff } from "../../types/staff";
import { staffService } from "../../services/staffService";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

const updateStaffSchema = z.object({
    staffId: z.string(),
    gender: z.string().min(1, "Gender is required"),
    dob: z.string().min(1, "Date of Birth is required"),
    professionalTitle: z.string().min(1, "Professional Title is required"),
    phone: z.string().min(1, "Phone number is required"),
});

type UpdateStaffFormValues = z.infer<typeof updateStaffSchema>;

interface UpdateStaffModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    staff: Staff | null;
    onSuccess: () => void;
}

const UpdateStaffModal = ({
    open,
    onOpenChange,
    staff,
    onSuccess,
}: UpdateStaffModalProps) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const form = useForm<UpdateStaffFormValues>({
        resolver: zodResolver(updateStaffSchema),
        defaultValues: {
            staffId: "",
            gender: "",
            dob: "",
            professionalTitle: "",
            phone: "",
        },
    });

    const { formState: { errors } } = form;

    // HANDLES FORM RESETTING WHEN STAFF CHANGES
    useEffect(() => {
        if (open && staff) {
            form.reset({

                // THESE INFORMATIONS CAN BE PREPOPULATED IF AVAILABLE ELSE... LEMME JUST ALLOW USER INPUT IT MANUALLY
                staffId: staff.userId || "",
                gender: (staff as any).gender || "",
                dob: (staff as any).dob || "",
                professionalTitle: (staff as any).professionalTitle || "",
                phone: (staff as any).phone || "",
            });
        }
    }, [open, staff, form]);

    const { mutate: updateStaff, isPending } = useMutation({
        mutationFn: staffService.updateStaff,
        onSuccess: () => {
            toast({
                title: "Success",
                description: "Staff profile updated successfully",
            });
            onOpenChange(false);
            onSuccess();
            queryClient.invalidateQueries({ queryKey: ["staffs"] });
        },
        onError: (error: any) => {
            if (error.response?.status === 422) {
                form.setError("phone", {
                    type: "manual",
                    message: "Phone number already exists"
                });
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Phone number already exists",
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: error.response?.data?.message || "Failed to update staff profile",
                });
            }
        },
    });

    const onSubmit = (data: UpdateStaffFormValues) => {

        //EXPLICIT CAST TO UPDATESTAFFREQUEST TYPE COMPATIBILITY
        updateStaff(data as unknown as import("../../types/staff").UpdateStaffRequest);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Update Staff Profile</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                        <FormField
                            control={form.control}
                            name="gender"
                            render={({ field }) => (
                                <div className="space-y-1">
                                    <FloatingSelect
                                        label="Gender"
                                        options={[
                                            { value: "MALE", label: "Male" },
                                            { value: "FEMALE", label: "Female" }
                                        ]}
                                        value={field.value}
                                        onChange={(e) => field.onChange(e.target.value)}
                                        name="gender"
                                        disabled={isPending}
                                    />
                                    <FormMessage />
                                </div>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="dob"
                            render={({ field }) => (
                                <div className="space-y-1">
                                    <FloatingInput
                                        id="dob"
                                        type="date"
                                        label="Date of Birth"
                                        {...field}
                                        error={errors.dob?.message}
                                        disabled={isPending}
                                    />
                                    <FormMessage />
                                </div>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="professionalTitle"
                            render={({ field }) => (
                                <div className="space-y-1">
                                    <FloatingInput
                                        id="professionalTitle"
                                        label="Professional Title"
                                        {...field}
                                        error={errors.professionalTitle?.message}
                                        disabled={isPending}
                                    />
                                    <FormMessage />
                                </div>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <div className="space-y-1">
                                    <FloatingInput
                                        id="phone"
                                        label="Phone Number"
                                        {...field}
                                        error={errors.phone?.message}
                                        disabled={isPending}
                                    />
                                    <FormMessage />
                                </div>
                            )}
                        />

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isPending}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Update Staff
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default UpdateStaffModal;
