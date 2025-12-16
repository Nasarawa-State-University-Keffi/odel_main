import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FloatingInput } from "@/components/ui/floating-input";
import { FloatingSelect } from "@/components/ui/floating-select";
import { FloatingMultiSelect } from "@/components/ui/floating-multi-select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { staffService, Title, Department, Faculty, ProgrammeType, Role } from "../../services/staffService";
import { CreateStaffRequest } from "../../types/staff";
import { useState, useEffect } from "react";

const staffSchema = z.object({
    titleId: z.string().or(z.number()).transform(val => Number(val)),
    userId: z.string().min(1, "User ID is required"),
    firstName: z.string().min(2, "First name is required"),
    middleName: z.string().optional(),
    lastName: z.string().min(2, "Last name is required"),
    email: z.string().email("Invalid email address"),
    departmentId: z.string().or(z.number()).transform(val => Number(val)),
    academic: z.boolean().default(false),
    roles: z.array(z.string()).min(1, "At least one role is required"),
    faculties: z.array(z.number()).default([]),
    departments: z.array(z.number()).default([]),
    programmeTypeId: z.union([z.string(), z.number()]).optional().transform(val => val ? Number(val) : undefined),
});

type StaffFormValues = z.infer<typeof staffSchema>;

interface CreateStaffModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

const CreateStaffModal = ({ open, onOpenChange, onSuccess }: CreateStaffModalProps) => {

    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    // Metadata States
    const [titles, setTitles] = useState<Title[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [faculties, setFaculties] = useState<Faculty[]>([]);

    const [programmeTypes, setProgrammeTypes] = useState<ProgrammeType[]>([]);
    const [rolesList, setRolesList] = useState<Role[]>([]);

    const { register, handleSubmit, formState: { errors }, reset, setValue, watch, setError } = useForm<StaffFormValues>({
        resolver: zodResolver(staffSchema),
        defaultValues: {
            academic: false,
            roles: ["ADMIN"],
            faculties: [],
            departments: [],
            middleName: "",
        }
    });


    // FETCHING METADATA ONCE THE COMPONENTS LOADS
    useEffect(() => {
        const fetchData = async () => {
            try {
                const results = await Promise.allSettled([
                    staffService.getAllTitles(),
                    staffService.getAllDepartments(),
                    staffService.getAllFaculties(),

                    staffService.getAllProgrammeTypes(),
                    staffService.getAllRoles()
                ]);

                const [titlesResult, deptsResult, facultiesResult, progsResult, rolesResult] = results;

                if (titlesResult.status === 'fulfilled') {
                    setTitles(titlesResult.value);
                }

                if (deptsResult.status === 'fulfilled') {
                    setDepartments(deptsResult.value);
                }

                if (facultiesResult.status === 'fulfilled') {
                    setFaculties(facultiesResult.value);
                }

                if (progsResult.status === 'fulfilled') {
                    const progsData = progsResult.value;
                    setProgrammeTypes(progsData);
                }

                if (rolesResult.status === 'fulfilled') {
                    setRolesList(rolesResult.value);

                }
            } catch (error) {
                // Silent fail or minimal toast, as individual failures are handled above if needed
                console.error("Unexpected error loading metadata", error);
            }
        };
        fetchData();
    }, [toast, setValue]);

    const onSubmit = async (data: StaffFormValues) => {
        setIsLoading(true);
        try {

            // IF DEPARTMENT ID IS SELECTED, WE SHOULD IDEALLY KNOW ITS FACULTY ID TOO.
            // FOR NOW, WE WILL TRY TO FIND THE DEPARMENT OBJECT TO GET THE FACULTY ID IF AVAILABLE IN THE FETCHED DATA

            const selectedDept = departments.find(d => d.id === Number(data.departmentId));
            const inferredFacultyId = selectedDept?.faculty?.id || (faculties.length > 0 ? faculties[0].id : 0);

            const formattedData: CreateStaffRequest = {
                titleId: data.titleId,
                userId: data.userId,
                firstName: data.firstName,
                lastName: data.lastName,
                middleName: data.middleName,
                email: data.email,
                departmentId: data.departmentId,
                academic: data.academic,
                roles: data.roles,
                faculties: data.faculties.length > 0 ? data.faculties : [inferredFacultyId],
                departments: data.departments.length > 0 ? data.departments : [data.departmentId],
                programmeTypeId: data.programmeTypeId
            };

            await staffService.createStaff(formattedData);
            toast({
                title: "Success",
                description: "Staff member created successfully",
            });
            reset();
            onSuccess();
            onOpenChange(false);
        } catch (error: unknown) {
            console.error(error);
            const err = error as any;
            const status = err.response?.status;
            let title = "Error";
            let description = err.response?.data?.message || "Failed to create staff member";

            if (status === 400) {
                title = "Invalid Configuration";
                description = "Invalid role or academic staff configuration.";
            } else if (status === 403) {
                title = "Access Denied";
                description = "You do not have permission to perform this action.";
            } else if (status === 404) {
                title = "Not Found";
                description = "Title, Department, or Programme type not found.";
            } else if (status === 422) {
                title = "Duplicate Entry";

                // CATCH SOME FORM ERRORS
                if (description.toLowerCase().includes("email")) {
                    setError("email", { type: "manual", message: "Email already exists" });
                }
                if (description.toLowerCase().includes("id")) {
                    setError("userId", { type: "manual", message: "Staff ID already exists" });
                }
            }

            toast({
                title: title,
                description: description,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add New Staff</DialogTitle>
                    <DialogDescription>
                        Create a new staff profile.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                        {/* Row 1: 4 items, 3 cols each */}
                        <div className="md:col-span-3 flex items-center space-x-2 h-12">
                            <Checkbox
                                id="academic"
                                checked={watch("academic")}
                                onCheckedChange={(checked) => setValue("academic", checked as boolean)}
                                disabled={isLoading}
                            />
                            <Label htmlFor="academic" className="cursor-pointer">Academic Staff?</Label>
                        </div>

                        <div className="md:col-span-3 space-y-2">
                            <FloatingInput
                                id="userId"
                                label="Staff ID"
                                {...register("userId")}
                                error={errors.userId?.message}
                                disabled={isLoading}
                            />
                        </div>

                        <div className="md:col-span-3 space-y-2">
                            <FloatingSelect
                                label="Title"
                                options={titles.map(t => ({ value: t.id.toString(), label: t.title || t.id.toString() }))}
                                value={watch("titleId") ? watch("titleId").toString() : ""}
                                onChange={(e) => setValue("titleId", Number(e.target.value))}
                                name="titleId"
                                disabled={isLoading}
                            />
                            {errors.titleId && <p className="text-sm text-destructive">{errors.titleId.message}</p>}
                        </div>

                        <div className="md:col-span-3 space-y-2">
                            <FloatingSelect
                                label="Role"
                                options={rolesList.map(r => ({ value: r.value, label: r.value }))}
                                value={watch("roles") && watch("roles")[0] ? watch("roles")[0] : ""}
                                onChange={(e) => setValue("roles", [e.target.value])}
                                name="roles"
                                disabled={isLoading}
                            />
                            {errors.roles && <p className="text-sm text-destructive">{errors.roles.message}</p>}
                        </div>
                    </div>

                    {/* Row 3: Names */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <FloatingInput
                                id="firstName"
                                label="First Name"
                                {...register("firstName")}
                                error={errors.firstName?.message}
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <FloatingInput
                                id="middleName"
                                label="Middle Name"
                                {...register("middleName")}
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <FloatingInput
                                id="lastName"
                                label="Last Name"
                                {...register("lastName")}
                                error={errors.lastName?.message}
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    {/* Row 4: Email & Dept */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <FloatingInput
                                id="email"
                                label="Email"
                                type="email"
                                {...register("email")}
                                error={errors.email?.message}
                                disabled={isLoading}
                            />
                        </div>

                        <div className="space-y-2">
                            {watch("academic") ? (
                                <FloatingSelect
                                    label="Primary Department"
                                    options={departments.map(d => ({ value: d.id.toString(), label: d.name }))}
                                    value={watch("departmentId") ? watch("departmentId").toString() : ""}
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        setValue("departmentId", val);
                                        setValue("departments", [val]);
                                    }}
                                    name="departmentId"
                                    disabled={isLoading}
                                />
                            ) : (
                                <FloatingMultiSelect
                                    label="Departments"
                                    options={departments.map(d => ({ value: d.id.toString(), label: d.name }))}
                                    selected={watch("departments").map(String)}
                                    onChange={(vals) => {
                                        const numVals = vals.map(Number);
                                        setValue("departments", numVals);
                                        if (numVals.length > 0) {
                                            setValue("departmentId", numVals[0]);
                                        }
                                    }}
                                    disabled={isLoading}
                                />
                            )}
                            {errors.departmentId && <p className="text-sm text-destructive">{errors.departmentId.message}</p>}
                        </div>
                    </div>

                    {/* Row 5: Programme Type */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <FloatingSelect
                                label="Programme Type"
                                options={programmeTypes.map(p => ({ value: p.id.toString(), label: p.name }))}
                                value={watch("programmeTypeId") ? watch("programmeTypeId").toString() : ""}
                                onChange={(e) => setValue("programmeTypeId", Number(e.target.value))}
                                name="programmeTypeId"
                                disabled={isLoading}
                            />
                            {errors.programmeTypeId && <p className="text-sm text-destructive">{errors.programmeTypeId.message}</p>}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="link" onClick={() => reset()} disabled={isLoading} className="text-muted-foreground">
                            Clear
                        </Button>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isLoading ? "Creating Staff..." : "Create Staff"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default CreateStaffModal;
