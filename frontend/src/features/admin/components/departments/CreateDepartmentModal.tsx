import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { departmentService } from "@/features/admin/services/departmentService";
import { facultyService } from "@/features/admin/services/facultyService";
import { staffService } from "@/features/admin/services/staffService";
import { Loader2 } from "lucide-react";
import { CreateDepartmentModalProps } from "@/features/admin/types/department";


const CreateDepartmentModal = ({ open, onOpenChange, departmentToEdit }: CreateDepartmentModalProps) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const isEditMode = !!departmentToEdit;

    const [form, setForm] = useState({
        name: "",
        code: "",
        facultyId: undefined as number | undefined
    });

    // Populate form on edit mode
    useEffect(() => {
        if (open) {
            if (departmentToEdit) {
                setForm({
                    name: departmentToEdit.name,
                    code: departmentToEdit.code,
                    facultyId: departmentToEdit.faculty?.id || departmentToEdit.facultyId
                });
            } else {
                setForm({ name: "", code: "", facultyId: undefined });
            }
        }
    }, [open, departmentToEdit]);

    // Fetch Faculties
    const { data: faculties = [] } = useQuery({
        queryKey: ["faculties"],
        queryFn: facultyService.getAllFaculties
    });

    // Auto-select ODEL faculty (Only if NOT in edit mode)
    useEffect(() => {
        if (!isEditMode && !form.facultyId && faculties.length > 0 && open) {
            const odelFaculty = faculties.find((f: any) =>
                f?.name?.toLowerCase().includes("odel") ||
                f?.name?.toLowerCase().includes("distance")
            );
            if (odelFaculty) {
                setForm(prev => ({ ...prev, facultyId: odelFaculty.id }));
            }
        }
    }, [faculties, form.facultyId, isEditMode, open]);


    // HANDLE ALL ERRORS VIA STATUS CODES
    const handleErrors = (error: any) => {
        const status = error?.response?.status;
        if (status === 422) {
            const msg = error.response.data?.message || "Department with name or code might already exist, or invalid faculty.";
            toast({ variant: "destructive", title: "Validation Error", description: msg });
        } else if (status === 403) {
            toast({ variant: "destructive", title: "Access Denied", description: "You do not have permission to perform this action." });
        } else if (status === 404) {
            toast({ variant: "destructive", title: "Not Found", description: "Department not found." });
        } else {
            toast({ variant: "destructive", title: "Error", description: "Operation failed. Please try again." });
        }
    };

    const createMutation = useMutation({
        mutationFn: departmentService.createDepartment,
        onSuccess: () => {
            toast({ title: "Success", description: "Department created successfully." });
            onOpenChange(false);
            setForm({ name: "", code: "", facultyId: undefined });
            queryClient.invalidateQueries({ queryKey: ["departments"] });
        },
        onError: handleErrors
    });

    const updateMutation = useMutation({
        mutationFn: (data: any) => departmentService.updateDepartment({ ...data, id: departmentToEdit.id }),
        onSuccess: () => {
            toast({ title: "Success", description: "Department updated successfully." });
            onOpenChange(false);
            setForm({ name: "", code: "", facultyId: undefined });
            queryClient.invalidateQueries({ queryKey: ["departments"] });
        },
        onError: handleErrors
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.code || !form.facultyId) {
            toast({ variant: "destructive", title: "Validation Error", description: "Please fill all fields." });
            return;
        }

        const payload = {
            name: form.name,
            code: form.code,
            facultyId: form.facultyId
        };

        if (isEditMode) {
            updateMutation.mutate(payload);
        } else {
            createMutation.mutate(payload);
        }
    };

    const isPending = createMutation.isPending || updateMutation.isPending;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? "Update Department" : "Create Department"}</DialogTitle>
                    <DialogDescription>{isEditMode ? "Modify existing department details." : "Add a new academic department to a faculty."}</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label>Department Name</Label>
                        <Input
                            placeholder="e.g. Computer Science"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Code</Label>
                        <Input
                            placeholder="e.g. CSC"
                            value={form.code}
                            onChange={(e) => setForm({ ...form, code: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Faculty</Label>
                        <Select
                            value={form.facultyId?.toString()}
                            onValueChange={(val) => setForm({ ...form, facultyId: parseInt(val) })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Faculty" />
                            </SelectTrigger>
                            <SelectContent>
                                {faculties.map((f: any) => (
                                    <SelectItem key={f.id} value={f.id.toString()}>{f.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="pt-4 flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEditMode ? "Update Department" : "Create Department"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default CreateDepartmentModal;
