import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/features/admin/components/admission/components/ui/dialog";
import { Button } from "@/features/admin/components/admission/components/ui/button";
import {
    FloatingInput,
} from "@/features/admin/components/admission/components/ui/floating-input";
import { FloatingSelect } from "@/features/admin/components/admission/components/ui/floating-select";
import { FloatingMultiSelect } from "@/features/admin/components/admission/components/ui/floating-multi-select";
import { Checkbox } from "@/features/admin/components/admission/components/ui/checkbox";
import { Label } from "@/features/admin/components/admission/components/ui/label";
import { useToast } from "@/features/admin/components/admission/components/ui/use-toast";
import { staffService } from "../../services/staffService";
import { commonService } from "../../services/commonService";
import { departmentService } from "../../services/departmentService";
import { facultyService } from "../../services/facultyService";
import { programmeTypeService } from "../../services/programmeTypeService";
import { Staff, Title, Department, Faculty, ProgrammeType, Role } from "../../types/staff";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

// Schema matching UpdateStaffFromAdminRequest
const updateStaffAdminSchema = z.object({
    titleId: z.string().or(z.number()).transform(val => Number(val)),
    userId: z.string().min(1, "User ID is required"),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    middleName: z.string().optional(),
    email: z.string().email("Invalid email address"),
    departmentId: z.string().or(z.number()).transform(val => Number(val)),
    academic: z.boolean(),
    roles: z.array(z.string()).min(1, "At least one role is required"),
    faculties: z.array(z.number()).default([]),
    departments: z.array(z.number()).default([]),
    programmeTypeId: z.string().or(z.number()).optional().transform(val => val ? Number(val) : 0),
});

type UpdateStaffAdminFormValues = z.infer<typeof updateStaffAdminSchema>;

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
    const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);

    // Metadata States
    const [titles, setTitles] = useState<Title[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [faculties, setFaculties] = useState<Faculty[]>([]);
    const [programmeTypes, setProgrammeTypes] = useState<ProgrammeType[]>([]);
    const [rolesList, setRolesList] = useState<Role[]>([]);

    const form = useForm<UpdateStaffAdminFormValues>({
        resolver: zodResolver(updateStaffAdminSchema),
        defaultValues: {
            academic: false,
            roles: [],
            faculties: [],
            departments: [],
            middleName: "",
            titleId: 0,
            departmentId: 0,
            programmeTypeId: 0,
        },
    });

    // Fetch Metadata
    useEffect(() => {
        if (!open) return;

        const fetchMetadata = async () => {
            setIsLoadingMetadata(true);
            try {
                const [titlesData, deptsData, facultiesData, progsData, rolesData] = await Promise.all([
                    commonService.getAllTitles(),
                    departmentService.getAllDepartments(),
                    facultyService.getAllFaculties(),
                    programmeTypeService.getAllProgrammeTypes(),
                    commonService.getAllRoles(),
                ]);

                setTitles(titlesData);
                setDepartments(deptsData);
                setFaculties(facultiesData);
                setProgrammeTypes(progsData);
                setRolesList(rolesData);
            } catch (error) {
                console.error("Failed to fetch metadata", error);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to load form options.",
                });
            } finally {
                setIsLoadingMetadata(false);
            }
        };

        fetchMetadata();
    }, [open, toast]);

    // Populate Form
    useEffect(() => {
        if (open && staff && titles.length > 0) {
            // Attempt to infer IDs from staff object or names if IDs are missing
            const staffAny = staff as any; // Access potential hidden fields

            // Infer Title ID
            const foundTitle = titles.find(t => t.title === staff.title || t.id === staffAny.titleId);
            const titleId = foundTitle ? foundTitle.id : (staffAny.titleId || 0);

            // Infer Department ID
            // If staff has department object or departmentId
            const deptId = staffAny.departmentId || staffAny.department?.id || 0;

            // Infer Programme Type ID
            const progTypeId = staffAny.programmeTypeId || staffAny.programmeType?.id || 0;

            form.reset({
                userId: staff.userId || "",
                firstName: staff.firstName || "",
                lastName: staff.lastName || "",
                middleName: staff.middleName || "",
                email: staff.email || "",
                academic: staffAny.academic || false,
                roles: staff.roles || [],
                titleId: titleId,
                departmentId: deptId,
                programmeTypeId: progTypeId,
                faculties: staffAny.faculties || [], // These might not exist on staff object, defaulting to empty
                departments: staffAny.departments || (deptId ? [deptId] : []),
            });
        }
    }, [open, staff, titles, form]);

    const { mutate: updateStaff, isPending } = useMutation({
        mutationFn: (data: UpdateStaffAdminFormValues) => {
            if (!staff) throw new Error("No staff selected");

            // Explicitly cast to prevent type issues, matching the interface exactly
            const payload = {
                titleId: Number(data.titleId),
                userId: data.userId,
                firstName: data.firstName,
                lastName: data.lastName,
                middleName: data.middleName || "",
                email: data.email,
                departmentId: Number(data.departmentId),
                academic: data.academic,
                roles: data.roles,
                faculties: data.faculties,
                departments: data.departments,
                programmeTypeId: Number(data.programmeTypeId || 0),
            };

            return staffService.updateStaffFromAdmin(staff.id, payload);
        },
        onSuccess: () => {
            toast({
                title: "Success",
                description: "Staff profile updated successfully",
            });
            onOpenChange(false);
            onSuccess();
            // Invalidate queries to refresh the list
            queryClient.invalidateQueries({ queryKey: ["staffs"] });
        },
        onError: (error: any) => {
            console.error("Update failed", error);
            const message = error.message || "Failed to update staff profile";

            if (message.includes("Email already taken")) {
                form.setError("email", { type: "manual", message });
            }

            toast({
                variant: "destructive",
                title: "Update Failed",
                description: message,
            });
        },
    });

    const onSubmit = (data: UpdateStaffAdminFormValues) => {
        updateStaff(data);
    };

    const isLoading = isLoadingMetadata || isPending;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Update Staff Profile (Admin)</DialogTitle>
                    <DialogDescription>
                        Modify staff details, roles, and assignments.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                        {/* Row 1: Academic Checkbox, Staff ID, Title, Role */}
                        <div className="md:col-span-3 flex items-center space-x-2 h-12">
                            <Checkbox
                                id="academic"
                                checked={form.watch("academic")}
                                onCheckedChange={(checked) => form.setValue("academic", checked as boolean)}
                                disabled={isLoading}
                            />
                            <Label htmlFor="academic" className="cursor-pointer">Academic Staff?</Label>
                        </div>

                        <div className="md:col-span-3 space-y-2">
                            <FloatingInput
                                id="userId"
                                label="Staff ID"
                                {...form.register("userId")}
                                error={form.formState.errors.userId?.message}
                                disabled={isLoading}
                            />
                        </div>

                        <div className="md:col-span-3 space-y-2">
                            <FloatingSelect
                                label="Title"
                                options={titles.map(t => ({ value: t.id.toString(), label: t.title || t.value }))}
                                value={form.watch("titleId")?.toString() || ""}
                                onChange={(e) => form.setValue("titleId", Number(e.target.value))}
                                name="titleId"
                                disabled={isLoading}
                            />
                        </div>

                        <div className="md:col-span-3 space-y-2">
                            <FloatingSelect
                                label="Role"
                                options={rolesList.map(r => ({ value: r.value, label: r.name || r.value }))}
                                value={form.watch("roles")?.[0] || ""}
                                onChange={(e) => form.setValue("roles", [e.target.value])}
                                name="roles"
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    {/* Row 2: Names */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FloatingInput
                            id="firstName"
                            label="First Name"
                            {...form.register("firstName")}
                            error={form.formState.errors.firstName?.message}
                            disabled={isLoading}
                        />
                        <FloatingInput
                            id="middleName"
                            label="Middle Name"
                            {...form.register("middleName")}
                            disabled={isLoading}
                        />
                        <FloatingInput
                            id="lastName"
                            label="Last Name"
                            {...form.register("lastName")}
                            error={form.formState.errors.lastName?.message}
                            disabled={isLoading}
                        />
                    </div>

                    {/* Row 3: Email & Dept */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FloatingInput
                            id="email"
                            label="Email"
                            type="email"
                            {...form.register("email")}
                            error={form.formState.errors.email?.message}
                            disabled={isLoading}
                        />

                        <div className="space-y-2">
                            {form.watch("academic") ? (
                                <FloatingSelect
                                    label="Primary Department"
                                    options={departments.map(d => ({ value: d.id.toString(), label: d.name }))}
                                    value={form.watch("departmentId")?.toString() || ""}
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        form.setValue("departmentId", val);
                                        form.setValue("departments", [val]);
                                    }}
                                    name="departmentId"
                                    disabled={isLoading}
                                />
                            ) : (
                                <FloatingMultiSelect
                                    label="Departments"
                                    options={departments.map(d => ({ value: d.id.toString(), label: d.name }))}
                                    selected={form.watch("departments")?.map(String) || []}
                                    onChange={(vals) => {
                                        const numVals = vals.map(Number);
                                        form.setValue("departments", numVals);
                                        if (numVals.length > 0) form.setValue("departmentId", numVals[0]);
                                    }}
                                    disabled={isLoading}
                                />
                            )}
                        </div>
                    </div>

                    {/* Row 4: Programme Type */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FloatingSelect
                            label="Programme Type"
                            options={programmeTypes.map(p => ({ value: p.id.toString(), label: p.name }))}
                            value={form.watch("programmeTypeId")?.toString() || ""}
                            onChange={(e) => form.setValue("programmeTypeId", Number(e.target.value))}
                            name="programmeTypeId"
                            disabled={isLoading}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update Staff
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default UpdateStaffModal;
