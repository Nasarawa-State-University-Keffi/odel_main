import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { staffService } from "../../services/staffService";
import { staffRoleService } from "../../services/staffRoleService";
import { programmeTypeService } from "../../services/programmeTypeService";
import { Staff } from "../../types/staff";
import { Loader2 } from "lucide-react";

interface MakeDepartmentExamOfficerModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    staff: Staff | null;
}

const MakeDepartmentExamOfficerModal = ({ open, onOpenChange, staff }: MakeDepartmentExamOfficerModalProps) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [selectedProgrammeId, setSelectedProgrammeId] = useState<string>("");

    // Reset state when modal opens/closes or staff changes
    useEffect(() => {
        if (open) {
            setSelectedProgrammeId("");
        }
    }, [open, staff]);

    // Fetch Programme Types
    const { data: programmeTypes = [], isLoading: isLoadingProgrammeTypes } = useQuery({
        queryKey: ["programmeTypes"],
        queryFn: programmeTypeService.getAllProgrammeTypes,
        enabled: open,
    });

    const mutation = useMutation({
        mutationFn: (data: { staffId: string; programmeTypeId?: number }) =>
            staffRoleService.makeDepartmentExamOfficer(data.staffId, { programmeTypeId: data.programmeTypeId }),
        onSuccess: () => {
            toast({
                title: "Success",
                description: "Staff member has been successfully assigned as a department exam officer.",
            });
            onOpenChange(false);
            queryClient.invalidateQueries({ queryKey: ["staffs"] });
        },
        onError: (error: any) => {
            console.error("Failed to make department exam officer", error);
            const message = error.message || "Failed to assign. Please try again.";
            toast({
                variant: "destructive",
                title: "Error",
                description: message,
            });
        },
    });

    const handleSubmit = () => {
        if (!staff) return;
        // Programme Type is optional
        const progId = selectedProgrammeId ? Number(selectedProgrammeId) : undefined;

        mutation.mutate({
            staffId: staff.userId,
            programmeTypeId: progId,
        });
    };

    if (!staff) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Make Department Exam Officer</DialogTitle>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    <div className="space-y-2">
                        <Label>Staff Member</Label>
                        <div className="p-3 border rounded-md bg-muted/50 text-sm font-medium">
                            {staff.title} {staff.firstName} {staff.lastName}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Programme Type</Label>
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
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={mutation.isPending}>
                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Assign Officer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default MakeDepartmentExamOfficerModal;
