import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { keepPreviousData, useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { courseService } from "@/features/admin/services/courseService";
import { Loader2, AlertCircle, Users, GraduationCap, ChevronLeft, ChevronRight, Download, Trash2, Upload } from "lucide-react";
import { ProgrammeCourse } from "@/features/admin/types/course";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery as useMetadataQuery } from "@tanstack/react-query";
import { admissionService } from "@/features/admin/services/admissionService";
import { useAuth } from "@/contexts/AuthContext";

interface CourseStudentsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    course: ProgrammeCourse | null;
}

const CourseStudentsModal = ({ open, onOpenChange, course }: CourseStudentsModalProps) => {
    const { hasRole } = useAuth();
    const queryClient = useQueryClient();
    const [page, setPage] = useState(0);
    const [size] = useState(10);

    // Bulk Registration State
    const [isBulkRegMode, setIsBulkRegMode] = useState(false);
    const [bulkFile, setBulkFile] = useState<File | null>(null);
    const [includeUnpaid, setIncludeUnpaid] = useState(false);
    const [bulkResult, setBulkResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

    // We need session/semester to fetch students.
    // For now, let's allow user to select or maybe we can fetch active session?
    // Given the endpoint requires these, and they are usually context dependent.
    // Let's add selectors for Session/Semester inside the modal to filter.
    const [selectedSession, setSelectedSession] = useState<string>("");
    const [selectedSemester, setSelectedSemester] = useState<string>("");

    // Bulk Mutation
    const bulkMutation = useMutation({
        mutationFn: async () => {
            if (!bulkFile || !course?.id || !selectedSemester) throw new Error("Missing requirements");
            return await courseService.bulkRegisterStudents(
                bulkFile,
                course.id,
                Number(selectedSemester),
                includeUnpaid
            );
        },
        onSuccess: (data) => {
            setBulkResult(data);
            // Invalidate to refresh the list if user goes back
            queryClient.invalidateQueries({ queryKey: ["registered-students"] });
        },
        onError: (error: any) => {
            const status = error.response?.status;
            alert("Bulk Registration Failed. " + (error.response?.data?.message || "Status: " + status));
        }
    });

    // Fetch Sessions
    const { data: sessions = [] } = useQuery({
        queryKey: ["sessions"],
        queryFn: admissionService.getAllSessions,
    });

    // Auto-select active session
    useEffect(() => {
        if (sessions.length > 0 && !selectedSession) {
            const activeSession = sessions.find(s => s.isActive);
            if (activeSession) {
                setSelectedSession(activeSession.id.toString());
            } else {
                // Fallback to first if no active found
                setSelectedSession(sessions[0].id.toString());
            }
        }
    }, [sessions, selectedSession]);

    // Fetch Semesters for selected session
    const { data: semesters = [] } = useQuery({
        queryKey: ["semesters", selectedSession],
        queryFn: () => admissionService.getSemestersBySession(Number(selectedSession)),
        enabled: !!selectedSession,
    });

    // Auto-select first semester
    useEffect(() => {
        if (semesters.length > 0 && !selectedSemester) {
            setSelectedSemester(semesters[0].id.toString());
        }
    }, [semesters, selectedSemester]);


    const {
        data,
        isLoading,
        isError,
        error
    } = useQuery({
        queryKey: ["registered-students", course?.id, selectedSession, selectedSemester, page, size],
        queryFn: async () => {
            if (!course || !selectedSession || !selectedSemester) return null;
            return courseService.getRegisteredStudents(
                course.id,
                Number(selectedSession),
                Number(selectedSemester),
                page,
                size
            );
        },
        enabled: !!course && open && !!selectedSession && !!selectedSemester,
        placeholderData: keepPreviousData
    });

    const students = data?.content || [];
    const totalPages = data?.totalPages || 0;

    const getErrorMessage = (err: any) => {
        if (err?.response) {
            switch (err.response.status) {
                case 404: return "Semester or requested resource not found.";
                case 422: return "Course or Session does not exist.";
                case 403: return "Access denied.";
                default: return err.response?.data?.message || "Failed to load students.";
            }
        }
        return "Failed to load students. Please check your connection.";
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Registered Students</DialogTitle>
                    <DialogDescription className="flex items-center justify-between">
                        <span>Students registered for <span className="font-medium text-primary">{course?.courseCode}</span></span>
                        {hasRole("RESULT_ADMIN") && (
                            <Button variant="outline" size="sm" onClick={() => setIsBulkRegMode(!isBulkRegMode)}>
                                {isBulkRegMode ? "View List" : "Bulk Register"}
                            </Button>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex gap-4 my-2">
                    <div className="flex items-center gap-2">
                        <Select value={selectedSession} onValueChange={setSelectedSession}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select Session" />
                            </SelectTrigger>
                            <SelectContent>
                                {sessions.map((session) => (
                                    <SelectItem key={session.id} value={session.id.toString()}>
                                        {session.name} {session.isActive && "(Active)"}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center gap-2">
                        <Select value={selectedSemester} onValueChange={setSelectedSemester} disabled={!selectedSession}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select Semester" />
                            </SelectTrigger>
                            <SelectContent>
                                {semesters.map((semester) => (
                                    <SelectItem key={semester.id} value={semester.id.toString()}>
                                        {semester.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex-1 overflow-auto border rounded-md">
                    {isBulkRegMode ? (
                        <div className="p-4 space-y-4">
                            <div className="bg-muted/30 p-4 rounded-md border border-dashed">
                                <h3 className="font-semibold mb-2">Bulk Course Registration</h3>
                                <p className="text-sm text-muted-foreground mb-4">Upload an Excel file to register students for this course.</p>

                                <div className="space-y-4">
                                    <div className="grid w-full max-w-sm items-center gap-1.5">
                                        <Input
                                            type="file"
                                            accept=".xlsx,.xls"
                                            onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                                        />
                                        <p className="text-xs text-muted-foreground">Supported formats: .xlsx, .xls</p>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="includeUnpaid"
                                            checked={includeUnpaid}
                                            onCheckedChange={(c) => setIncludeUnpaid(!!c)}
                                        />
                                        <label
                                            htmlFor="includeUnpaid"
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            Include Unpaid Students
                                        </label>
                                    </div>

                                    <Button
                                        onClick={() => bulkMutation.mutate()}
                                        disabled={!bulkFile || !selectedSemester || bulkMutation.isPending}
                                    >
                                        {bulkMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Upload and Register
                                    </Button>
                                </div>
                            </div>

                            {bulkResult && (
                                <div className="space-y-2">
                                    <div className="flex gap-4 text-sm font-bold">
                                        <span className="text-green-600">Success: {bulkResult.success}</span>
                                        <span className="text-destructive">Failed: {bulkResult.failed}</span>
                                    </div>
                                    {bulkResult.errors.length > 0 && (
                                        <div className="bg-destructive/10 p-2 rounded text-xs text-destructive max-h-40 overflow-y-auto">
                                            <p className="font-bold underline mb-1">Error Log:</p>
                                            <ul className="list-disc pl-4 space-y-1">
                                                {bulkResult.errors.map((err, i) => (
                                                    <li key={i}>{err}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-muted/50 sticky top-0">
                                <TableRow>
                                    <TableHead className="w-[50px]">S/N</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Matric No.</TableHead> {/* Assuming userId is matric/student ID */}
                                    <TableHead>UserID</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-48 text-center">
                                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                                            <span className="text-muted-foreground mt-2 block">Loading students...</span>
                                        </TableCell>
                                    </TableRow>
                                ) : isError ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-48 text-center text-destructive">
                                            <div className="flex flex-col items-center gap-2">
                                                <AlertCircle className="h-6 w-6" />
                                                <span>{getErrorMessage(error)}</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : students.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-48 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center gap-2">
                                                <GraduationCap className="h-10 w-10 opacity-20" />
                                                <p>No students registered for this session/semester.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    students.map((item: any, index: number) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="text-muted-foreground">
                                                {page * size + index + 1}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {item.student.firstName} {item.student.lastName}
                                            </TableCell>
                                            <TableCell>{item.student.userId}</TableCell> {/* Assuming userId is displayed here */}
                                            <TableCell className="font-mono text-xs text-muted-foreground">{item.student.userId}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </div>



                {/* Footer / Pagination / Actions */}
                <div className="flex flex-col gap-4 pt-4 border-t">
                    {/* Admin Actions */}
                    {hasRole("RESULT_ADMIN") && (
                        <div className="flex justify-between items-center bg-destructive/10 p-3 rounded-md border border-destructive/20">
                            <div className="text-sm text-destructive font-medium flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" />
                                Danger Zone
                            </div>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={async () => {
                                    if (!course || !selectedSession || !selectedSemester) {
                                        alert("Please select a session and semester.");
                                        return;
                                    }

                                    // Use a strict confirmation flow
                                    const confirmMessage = `WARNING: You are about to deregister ALL students from ${course.courseCode} for the selected semester.\n\nType "CONFIRM" to proceed.`;
                                    const userInput = prompt(confirmMessage);

                                    if (userInput === "CONFIRM") {
                                        const removeResult = confirm("Do you want to also remove any existing results for these students? (Click OK for YES, Cancel for NO)");

                                        // We need programmeId. Course usually has it, otherwise we might need to ask user which programme context this is for?
                                        // Assuming course.programme?.id or similar exists. 
                                        // Based on ProgrammeCourse type, it has 'programme' or 'programmeType'. 
                                        // The API asks for `programmeId`. If the course is linked to a specific programme, use it.
                                        // If it's a general course (e.g., shared), this might be tricky without a selector.
                                        // Let's assume for now we use the course's primary programme ID if available. 
                                        // If not available, we might fail or need to add a selector.
                                        // Checking types... ProgrammeCourse has `programme?: { id, ... }`

                                        const programmeId = course.programme?.id;
                                        if (!programmeId) {
                                            alert("Cannot bulk deregister: This course is not linked to a generic programme context.");
                                            return;
                                        }

                                        try {
                                            await courseService.deregisterAllStudents(
                                                course.id,
                                                Number(selectedSemester),
                                                programmeId,
                                                removeResult
                                                // levelId is optional, omitting for now to target all levels in that programme/semester
                                            );
                                            alert("Success: All students have been deregistered.");
                                            // Refetch
                                            queryClient.invalidateQueries({ queryKey: ["registered-students"] });
                                        } catch (error: any) {
                                            const status = error.response?.status;
                                            if (status === 400) alert("Failed: Results exist for some students. Try checking 'Remove Results' option.");
                                            else if (status === 403) alert("Access Denied.");
                                            else alert("Operation failed. " + (error.response?.data?.message || ""));
                                        }
                                    }
                                }}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Deregister All
                            </Button>
                        </div>
                    )}

                    <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            Page {page + 1} of {totalPages || 1}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                disabled={isLoading || students.length === 0}
                                onClick={async () => {
                                    if (!course || !selectedSession || !selectedSemester) return;
                                    try {
                                        await courseService.downloadRegisteredStudents(course.id, Number(selectedSession), Number(selectedSemester));
                                    } catch (err: any) {
                                        let message = "Failed to download file.";
                                        if (err.response) {
                                            if (err.response.status === 404) message = "Semester not found.";
                                            if (err.response.status === 422) message = "Course or Session does not exist.";
                                        }
                                        alert(message);
                                    }
                                }}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Download List
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={page === 0 || isLoading}
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => p + 1)}
                                disabled={!data || data.last || isLoading}
                            >
                                Next
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                </div>

            </DialogContent>
        </Dialog >
    );
};

export default CourseStudentsModal;
