import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { courseRegistrationService } from "@/features/admin/services/courseRegistrationService";
import { admissionService } from "@/features/admin/services/admissionService";
import { useToast } from "@/components/ui/use-toast";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, CheckCircle2, XCircle, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RegistrationDetails } from "@/features/admin/types/courseRegistration";

const PendingApprovals = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Filters
    const [semesterId, setSemesterId] = useState<string>("1"); // Default semester? Needs logic
    const [approvalStage, setApprovalStage] = useState<string>("1"); // Default stage?
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    // Fetch Sessions (to get active session maybe? or just hardcode semester for now/select)
    // The API requires semester and stage.

    const { data: pageData, isLoading, refetch } = useQuery({
        queryKey: ["pending-approvals", semesterId, approvalStage],
        queryFn: () => courseRegistrationService.findAllForApproval({
            semester: Number(semesterId),
            stage: Number(approvalStage),
            page: 0,
            size: 50
        }),
        enabled: !!semesterId && !!approvalStage
    });

    const approveMutation = useMutation({
        mutationFn: courseRegistrationService.approveRegistrations,
        onSuccess: () => {
            toast({ title: "Success", description: "Registrations approved successfully." });
            queryClient.invalidateQueries({ queryKey: ["pending-approvals"] });
            setSelectedIds([]);
        },
        onError: () => {
            toast({ variant: "destructive", title: "Error", description: "Failed to approve registrations." });
        }
    });

    const rejectMutation = useMutation({
        mutationFn: courseRegistrationService.rejectRegistrations,
        onSuccess: () => {
            toast({ title: "Success", description: "Registrations rejected successfully." });
            queryClient.invalidateQueries({ queryKey: ["pending-approvals"] });
            setSelectedIds([]);
        },
        onError: () => {
            toast({ variant: "destructive", title: "Error", description: "Failed to reject registrations." });
        }
    });

    const handleSelectAll = (checked: boolean) => {
        if (checked && pageData?.content) {
            setSelectedIds(pageData.content.map(r => r.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id: number, checked: boolean) => {
        if (checked) {
            setSelectedIds(prev => [...prev, id]);
        } else {
            setSelectedIds(prev => prev.filter(i => i !== id));
        }
    };

    const handleBulkApprove = () => {
        if (!selectedIds.length) return;
        if (confirm(`Approve ${selectedIds.length} registrations?`)) {
            approveMutation.mutate({ registrationIds: selectedIds });
        }
    };

    const handleBulkReject = () => {
        if (!selectedIds.length) return;
        if (confirm(`Reject ${selectedIds.length} registrations?`)) {
            rejectMutation.mutate({ registrationIds: selectedIds });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-end bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <div className="space-y-2 w-full md:w-48">
                    <label className="text-xs font-bold uppercase text-slate-500">Semester</label>
                    <Select value={semesterId} onValueChange={setSemesterId}>
                        <SelectTrigger><SelectValue placeholder="Select Semester" /></SelectTrigger>
                        <SelectContent>
                            {/* Needs dynamic semesters, defaulting for UI */}
                            <SelectItem value="1">First Semester</SelectItem>
                            <SelectItem value="2">Second Semester</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2 w-full md:w-48">
                    <label className="text-xs font-bold uppercase text-slate-500">Approval Stage</label>
                    <Select value={approvalStage} onValueChange={setApprovalStage}>
                        <SelectTrigger><SelectValue placeholder="Select Stage" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">Department</SelectItem>
                            <SelectItem value="2">Faculty</SelectItem>
                            <SelectItem value="3">Senate</SelectItem>
                            {/* Assuming stages from backend, might need fetching */}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex-1"></div>
                {selectedIds.length > 0 && (
                    <div className="flex gap-2 animate-in fade-in slide-in-from-right-4">
                        <Button
                            variant="destructive"
                            onClick={handleBulkReject}
                            disabled={rejectMutation.isPending}
                            className="gap-2"
                        >
                            <XCircle className="w-4 h-4" />
                            Reject ({selectedIds.length})
                        </Button>
                        <Button
                            onClick={handleBulkApprove}
                            disabled={approveMutation.isPending}
                            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            Approve ({selectedIds.length})
                        </Button>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="w-[50px]">
                                <Checkbox
                                    checked={selectedIds.length > 0 && pageData?.content?.length === selectedIds.length}
                                    onCheckedChange={handleSelectAll}
                                />
                            </TableHead>
                            <TableHead>Student</TableHead>
                            <TableHead>Course</TableHead>
                            <TableHead>Programme</TableHead>
                            <TableHead>Stage</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-48 text-center">
                                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                                    <p className="mt-2 text-slate-500 font-medium">Loading requests...</p>
                                </TableCell>
                            </TableRow>
                        ) : !pageData?.content?.length ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-48 text-center text-slate-500">
                                    No pending approvals found for this selection.
                                </TableCell>
                            </TableRow>
                        ) : (
                            pageData.content.map((reg: RegistrationDetails) => (
                                <TableRow key={reg.id} className="hover:bg-slate-50/50">
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedIds.includes(reg.id)}
                                            onCheckedChange={(checked) => handleSelectOne(reg.id, checked as boolean)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-bold text-slate-800">{reg.studentName}</div>
                                        <div className="text-xs text-slate-500">{reg.matric}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-bold text-slate-800">{reg.course.courseCode}</div>
                                        <div className="text-xs text-slate-500 truncate max-w-[200px]">{reg.course.title}</div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{reg.programme}</span>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">
                                            {reg.stage.name}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => rejectMutation.mutate({ registrationIds: [reg.id] })}
                                            >
                                                <XCircle className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 w-8 p-0 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50"
                                                onClick={() => approveMutation.mutate({ registrationIds: [reg.id] })}
                                            >
                                                <CheckCircle2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
            {/* Pagination Controls could be added here */}
        </div>
    );
};

export default PendingApprovals;
