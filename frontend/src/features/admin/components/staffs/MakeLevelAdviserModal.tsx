import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/features/admin/components/admission/components/ui/dialog";
import { Button } from "@/features/admin/components/admission/components/ui/button";
import { Label } from "@/features/admin/components/admission/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/features/admin/components/admission/components/ui/select";
import { FloatingMultiSelect } from "@/features/admin/components/admission/components/ui/floating-multi-select";
import { useToast } from "@/features/admin/components/admission/components/ui/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { staffService } from "../../services/staffService";
import { staffRoleService } from "../../services/staffRoleService";
import { departmentService } from "../../services/departmentService";
import { programmeTypeService } from "../../services/programmeTypeService";
import { levelService } from "../../services/levelService";
import { Staff, Department, Level } from "../../types/staff";
import { ProgrammeType } from "../../types/programmeType";
import { Loader2 } from "lucide-react";

interface MakeLevelAdviserModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    staff: Staff | null;
}

const MakeLevelAdviserModal = ({ open, onOpenChange, staff }: MakeLevelAdviserModalProps) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Form State
    const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");
    const [selectedProgrammeId, setSelectedProgrammeId] = useState<string>("");
    const [selectedLevelIds, setSelectedLevelIds] = useState<string[]>([]);

    // Reset state when modal opens/closes or staff changes
    useEffect(() => {
        if (open) {
            setSelectedDepartmentId("");
            setSelectedProgrammeId("");
            setSelectedLevelIds([]);
        }
    }, [open, staff]);

    // Fetch Departments
    const { data: departments = [], isLoading: isLoadingDepartments } = useQuery({
        queryKey: ["departments"],
        queryFn: departmentService.getAllDepartments,
        enabled: open,
    });

    // Fetch Programme Types
    const { data: programmeTypes = [], isLoading: isLoadingProgrammeTypes } = useQuery<ProgrammeType[]>({
        queryKey: ["programmeTypes"],
        queryFn: programmeTypeService.getAllProgrammeTypes,
        enabled: open,
    });

    // Fetch Levels based on selected Programme Type
    const { data: levels = [], isLoading: isLoadingLevels } = useQuery({
        queryKey: ["levels", selectedProgrammeId],
        queryFn: async () => {
            if (!selectedProgrammeId) return [];
            return await levelService.getAllLevels(Number(selectedProgrammeId));
        },
        enabled: !!selectedProgrammeId,
    });

    // Mutation for making level adviser
    const mutation = useMutation({
        mutationFn: staffRoleService.makeLevelAdviser,
        onSuccess: () => {
            toast({
                title: "Success",
                description: "Staff member has been successfully assigned as a level adviser.",
            });
            onOpenChange(false);
            // Optionally invalidate queries to refresh lists if needed
            queryClient.invalidateQueries({ queryKey: ["levelAdvisers"] });
        },
        onError: (error: any) => {
            console.error("Failed to make level adviser", error);
            const errorMessage = error?.response?.data?.message || "Failed to assign level adviser. Please try again.";
            toast({
                variant: "destructive",
                title: "Error",
                description: errorMessage,
            });
        },
    });

    const handleSubmit = () => {
        if (!staff) return;
        if (!selectedDepartmentId) {
            toast({
                variant: "destructive",
                title: "Validation Error",
                description: "Please select a department.",
            });
            return;
        }
        if (selectedLevelIds.length === 0) {
            toast({
                variant: "destructive",
                title: "Validation Error",
                description: "Please select at least one level.",
            });
            return;
        }

        mutation.mutate({
            userId: staff.userId, // Using userId as requested by the service signature
            departmentId: Number(selectedDepartmentId),
            levelId: selectedLevelIds.map(id => Number(id)),
        });
    };

    if (!staff) return null;

    // Transform Levels for MultiSelect
    const levelOptions = levels.map((lvl: any) => ({
        label: lvl.title || `Level ${lvl.id}`, // Fallback label
        value: lvl.id.toString(),
    }));

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Make Level Adviser</DialogTitle>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    <div className="space-y-2">
                        <Label>Staff Member</Label>
                        <div className="p-3 border rounded-md bg-muted/50 text-sm font-medium">
                            {staff.title} {staff.firstName} {staff.lastName}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Department</Label>
                        <Select onValueChange={setSelectedDepartmentId} value={selectedDepartmentId}>
                            <SelectTrigger disabled={isLoadingDepartments}>
                                <SelectValue placeholder="Select Department" />
                            </SelectTrigger>
                            <SelectContent>
                                {departments.map((dept) => (
                                    <SelectItem key={dept.id} value={dept.id.toString()}>
                                        {dept.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Programme Type (for filtering levels)</Label>
                        <Select onValueChange={setSelectedProgrammeId} value={selectedProgrammeId}>
                            <SelectTrigger disabled={isLoadingProgrammeTypes}>
                                <SelectValue placeholder="Select Programme Type" />
                            </SelectTrigger>
                            <SelectContent>
                                {programmeTypes.map((prog) => (
                                    <SelectItem key={prog.id} value={prog.id.toString()}>
                                        {prog.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Levels</Label>
                        <FloatingMultiSelect
                            label="Select Levels"
                            options={levelOptions}
                            selected={selectedLevelIds}
                            onChange={setSelectedLevelIds}
                            disabled={!selectedProgrammeId || isLoadingLevels}
                        />
                        {!selectedProgrammeId && (
                            <p className="text-[0.8rem] text-muted-foreground">Select a programme type to see available levels.</p>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={mutation.isPending}>
                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Assign Adviser
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default MakeLevelAdviserModal;
