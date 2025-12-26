import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { departmentService } from "@/features/admin/services/departmentService";
import { admissionService } from "@/features/admin/services/admissionService";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CalendarClock } from "lucide-react";
import { ScheduleUploadClosingModalProps } from "@/features/admin/types/department";

const ScheduleUploadClosingModal = ({ isOpen, onClose, departmentId }: ScheduleUploadClosingModalProps) => {
    const { toast } = useToast();
    const [semester, setSemester] = useState<string>("");
    const [date, setDate] = useState<string>("");

    const { data: activeAdmission } = useQuery({
        queryKey: ["activeAdmission"],
        queryFn: admissionService.getActiveAdmission,
    });

    useEffect(() => {
        if (activeAdmission?.semester?.id) {
            setSemester(activeAdmission.semester.id.toString());
        }
    }, [activeAdmission]);

    const scheduleMutation = useMutation({
        mutationFn: async () => {
            if (!departmentId || !semester || !date) return;
            await departmentService.scheduleResultUploadClosing(departmentId, parseInt(semester), date);
        },
        onSuccess: () => {
            toast({
                title: "Scheduled Successfully",
                description: `Result upload closing scheduled for ${date}.`,
            });
            onClose();
            setSemester("");
            setDate("");
        },
        onError: (error: any) => {
            const status = error?.response?.status;
            if (status === 403) {
                toast({
                    variant: "destructive",
                    title: "Access Denied",
                    description: "You do not have permission to perform this action. Only HODs can schedule this.",
                });
            } else if (status === 404) {
                toast({
                    variant: "destructive",
                    title: "Not Found",
                    description: "Department or Semester not found.",
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to schedule closing. Please try again.",
                });
            }
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        scheduleMutation.mutate();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CalendarClock className="h-5 w-5 text-primary" />
                        Schedule Result Upload Closing
                    </DialogTitle>
                    <DialogDescription>
                        Set a date to automatically close result uploads for a specific semester.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="semester">Semester ID</Label>
                        <Input
                            id="semester"
                            type="number"
                            placeholder="Loading active semester..."
                            value={semester}
                            readOnly
                            disabled
                            className="bg-slate-100 cursor-not-allowed"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="date">Closing Date</Label>
                        <Input
                            id="date"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={scheduleMutation.isPending || !departmentId}>
                            {scheduleMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Schedule Closing
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default ScheduleUploadClosingModal;
