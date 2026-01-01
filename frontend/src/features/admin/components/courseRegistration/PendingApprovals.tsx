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
    const [semesterId, setSemesterId] = useState<string>("1");
    const [approvalStage, setApprovalStage] = useState<string>("1");
    const [courseId, setCourseId] = useState<string>(""); // New Filter
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const { data: pageData, isLoading, refetch } = useQuery({
        queryKey: ["pending-approvals", semesterId, approvalStage, courseId],
        queryFn: () => courseRegistrationService.findAllForApproval({
            semester: Number(semesterId),
            stage: Number(approvalStage),
            course: courseId ? Number(courseId) : undefined,
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

    // New Mutation: Approve By Course
    const approveByCourseMutation = useMutation({
        mutationFn: courseRegistrationService.approveByCourse,
        onSuccess: () => {
            toast({ title: "Success", description: "All registrations for course approved." });
            queryClient.invalidateQueries({ queryKey: ["pending-approvals"] });
        },
        onError: () => {
            toast({ variant: "destructive", title: "Error", description: "Failed to approve by course." });
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

    // New Mutation: Reject By Course
    const rejectByCourseMutation = useMutation({
        mutationFn: courseRegistrationService.rejectByCourse,
        onSuccess: () => {
            toast({ title: "Success", description: "All registrations for course rejected." });
            queryClient.invalidateQueries({ queryKey: ["pending-approvals"] });
        },
        onError: () => {
            toast({ variant: "destructive", title: "Error", description: "Failed to reject by course." });
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
                        </SelectContent>
                    </Select>
                </div>

                {/* Course ID Input for Filtering/Bulk Action */}
                <div className="space-y-2 w-full md:w-48">
                    <label className="text-xs font-bold uppercase text-slate-500">Course ID</label>
                    {/* Using Input for simplicity as fetching courses requires more context */}
                    <input
                        type="number"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Course ID"
                        value={courseId}
                        onChange={(e) => setCourseId(e.target.value)}
                    />
                </div>

                <div className="flex-1"></div>

                {/* Bulk Approve By Course (Mocking Programme ID = 1 for now or asking user) */}
                {/* Note: In a real scenario, we'd need a Programme Selector too. Using 0 or 1 as fallback/placeholder if logic permits */}
                {courseId && (
                    <div className="flex gap-2 mr-4">
                        <Button
                            variant="outline"
                            onClick={() => {
                                const progId = prompt("Enter Programme ID for Bulk Action:", "1");
                                if (progId && confirm(`Approve ALL for Course ${courseId} / Programme ${progId}?`)) {
                                    approveByCourseMutation.mutate({
                                        courseId: Number(courseId),
                                        programmeId: Number(progId),
                                        semesterId: Number(semesterId),
                                        approvalStage: Number(approvalStage)
                                    });
                                }
                            }}
                            className="gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            By Course
                        </Button>
                    </div>
                )}

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
