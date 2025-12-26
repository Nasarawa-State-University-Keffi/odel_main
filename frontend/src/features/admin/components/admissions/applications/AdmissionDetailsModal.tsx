import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle, XCircle, BookOpen, Hash, Clock } from "lucide-react";
import { format } from "date-fns";

import { Admission } from "@/features/admin/types/admission";

interface AdmissionDetailsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    admission: Admission | null;
}

const AdmissionDetailsModal = ({ open, onOpenChange, admission }: AdmissionDetailsModalProps) => {
    if (!admission) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="text-xl">{admission.name || "Admission Details"}</DialogTitle>
                    <DialogDescription>
                        Complete information about this admission cycle.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Status Section */}
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div className="space-y-1">
                            <span className="text-sm font-medium text-muted-foreground">Status</span>
                            <div className="flex items-center gap-2">
                                {admission.open ? (
                                    <>
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                        <span className="font-medium text-green-600">Open for Applications</span>
                                    </>
                                ) : (
                                    <>
                                        <XCircle className="h-4 w-4 text-red-600" />
                                        <span className="font-medium text-red-600">Closed</span>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="text-right space-y-1">
                            <span className="text-sm font-medium text-muted-foreground">Admission ID</span>
                            <div className="flex items-center justify-end gap-2 font-mono">
                                <Hash className="h-4 w-4 text-muted-foreground" />
                                {admission.id}
                            </div>
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1 p-3 border rounded-md">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <BookOpen className="h-4 w-4" />
                                <span className="text-xs font-medium uppercase tracking-wide">Mode</span>
                            </div>
                            <p className="font-medium">{admission.admissionMode || "-"}</p>
                        </div>

                        <div className="space-y-1 p-3 border rounded-md">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <Clock className="h-4 w-4" />
                                <span className="text-xs font-medium uppercase tracking-wide">Semester</span>
                            </div>
                            <p className="font-medium">{admission.semester?.title || "-"}</p>
                        </div>

                        <div className="space-y-1 p-3 border rounded-md">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <Calendar className="h-4 w-4" />
                                <span className="text-xs font-medium uppercase tracking-wide">Start Date</span>
                            </div>
                            <p className="font-medium">
                                {admission.startDate ? format(new Date(admission.startDate), "PPP") : "-"}
                            </p>
                        </div>

                        <div className="space-y-1 p-3 border rounded-md">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <Calendar className="h-4 w-4" />
                                <span className="text-xs font-medium uppercase tracking-wide">End Date</span>
                            </div>
                            <p className="font-medium">
                                {admission.endDate ? format(new Date(admission.endDate), "PPP") : "-"}
                            </p>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default AdmissionDetailsModal;
