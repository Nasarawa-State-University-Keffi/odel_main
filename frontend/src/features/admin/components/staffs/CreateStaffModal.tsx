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
import { Loader } from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { staffService, Title, Department, Faculty, ProgrammeType } from "../../services/staffService";
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
    programmeTypeId: z.string().or(z.number()).transform(val => Number(val)),
});

type StaffFormValues = z.infer<typeof staffSchema>;

interface CreateStaffModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

const CreateStaffModal = ({ open, onOpenChange, onSuccess }: CreateStaffModalProps) => {
    console.log("CreateStaffModal rendered. Open:", open);
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    // Metadata States
    const [titles, setTitles] = useState<Title[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [faculties, setFaculties] = useState<Faculty[]>([]);
    const [programmeTypes, setProgrammeTypes] = useState<ProgrammeType[]>([]);

    const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<StaffFormValues>({
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
                    staffService.getAllProgrammeTypes()
                ]);

                const [titlesResult, deptsResult, facultiesResult, progsResult] = results;

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

                    // Set default programme type if available
                    if (progsData.length > 0) {
                        setValue("programmeTypeId", progsData[0].id);
                    }
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
        } catch (error: any) {
            console.error(error);
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to create staff member",
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
                            />
                            <Label htmlFor="academic" className="cursor-pointer">Academic Staff?</Label>
                        </div>

                        <div className="md:col-span-3 space-y-2">
                            <FloatingInput
                                id="userId"
                                label="Staff ID / User ID"
                                {...register("userId")}
                                error={errors.userId?.message}
                            />
                        </div>

                        <div className="md:col-span-3 space-y-2">
                            <FloatingSelect
                                label="Title"
                                options={titles.map(t => ({ value: t.id.toString(), label: t.title || t.id.toString() }))}
                                value={watch("titleId") ? watch("titleId").toString() : ""}
                                onChange={(e) => setValue("titleId", Number(e.target.value))}
                                name="titleId"
                            />
                            {errors.titleId && <p className="text-sm text-destructive">{errors.titleId.message}</p>}
                        </div>

                        <div className="md:col-span-3 space-y-2">
                            <FloatingSelect
                                label="Role"
                                options={[
                                    { value: "ADMIN", label: "Admin" },
                                    { value: "SUPER_ADMIN", label: "Super Admin" },
                                    { value: "SUPPORT", label: "Support" },
                                ]}
                                value={watch("roles") && watch("roles")[0] ? watch("roles")[0] : ""}
                                onChange={(e) => setValue("roles", [e.target.value])}
                                name="roles"
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
                            />
                        </div>
                        <div className="space-y-2">
                            <FloatingInput
                                id="middleName"
                                label="Middle Name"
                                {...register("middleName")}
                            />
                        </div>
                        <div className="space-y-2">
                            <FloatingInput
                                id="lastName"
                                label="Last Name"
                                {...register("lastName")}
                                error={errors.lastName?.message}
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
                            />
                            {errors.programmeTypeId && <p className="text-sm text-destructive">{errors.programmeTypeId.message}</p>}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                            Create Staff
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default CreateStaffModal;
