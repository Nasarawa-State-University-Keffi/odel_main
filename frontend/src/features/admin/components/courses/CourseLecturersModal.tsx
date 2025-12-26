import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { courseService } from "@/features/admin/services/courseService";
import { staffService } from "@/features/admin/services/staffService";
import { Loader2, AlertCircle, UserX, CheckCircle2, Trash2, Star } from "lucide-react";
import { ProgrammeCourse } from "@/features/admin/types/course";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface CourseLecturersModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    course: ProgrammeCourse | null;
}

const CourseLecturersModal = ({ open, onOpenChange, course }: CourseLecturersModalProps) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { hasRole } = useAuth();
    const isHod = hasRole("HOD");

    const {
        data: lecturers = [],
        isLoading,
        isError,
        error
    } = useQuery({
        queryKey: ["course-lecturers", course?.id],
        queryFn: () => courseService.getLecturersByCourse(course!.id),
        enabled: !!course && open,
    });

    const getErrorMessage = (err: any) => {
        if (err?.response) {
            switch (err.response.status) {
                case 403: return "You do not have permission to view lecturers for this course.";
                case 404: return "Course not found.";
                case 500: return "System error. Please try again later.";
                default: return err.response?.data?.message || "Failed to load lecturers.";
            }
        }
        return "Failed to load lecturers. Please check your connection.";
    };

    const [isAssigning, setIsAssigning] = useState(false);
    const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    // Fetch All Staff for Selection
    const { data: allStaff = [] } = useQuery({
        queryKey: ["all-staff", searchQuery],
        queryFn: () => staffService.searchStaff(searchQuery),
        enabled: isAssigning,
    });

    const handleAssign = async () => {
        if (!course || selectedStaffIds.length === 0) return;
        try {
            await courseService.assignLecturers(course.id, selectedStaffIds.map(Number));
            toast({ title: "Success", description: "Lecturers assigned successfully." });
            setIsAssigning(false);
            setSelectedStaffIds([]);
            queryClient.invalidateQueries({ queryKey: ["course-lecturers", course.id] });
        } catch (error: any) {
            let message = "Failed to assign lecturers.";
            if (error.response) {
                switch (error.response.status) {
                    case 400:
                        message = "Operation failed. Please validate staff selection.";
                        break;
                    case 404:
                        message = "One or more selected lecturers could not be found.";
                        break;
                    case 422:
                        message = "Course does not exist or invalid data provided.";
                        break;
                    case 403:
                        message = "You do not have permission to perform this action.";
                        break;
                    default:
                        message = error.response.data?.message || message;
                }
            }
            toast({
                title: "Error",
                description: message,
                variant: "destructive"
            });
        }
    };

    const handleRemoveLecturer = async (staffId: string) => {
        if (!course || !staffId) return;
        if (!confirm("Are you sure you want to remove this lecturer from the course?")) return;

        try {
            await courseService.removeLecturer(course.id, staffId);
            toast({ title: "Success", description: "Lecturer removed from course successfully." });
            queryClient.invalidateQueries({ queryKey: ["course-lecturers", course.id] });
        } catch (error: any) {
            let message = "Failed to remove lecturer.";
            if (error.response) {
                switch (error.response.status) {
                    case 400:
                        message = "Operation failed. Staff validation failed or not allowed.";
                        break;
                    case 422:
                        message = "Lecturer or Course does not exist.";
                        break;
                    case 403:
                        message = "You do not have permission to perform this action.";
                        break;
                    default:
                        message = error.response.data?.message || message;
                }
            }
            toast({
                title: "Error",
                description: message,
                variant: "destructive"
            });
        }
    };

    const toggleStaffSelection = (staffId: string) => {
        setSelectedStaffIds(prev =>
            prev.includes(staffId)
                ? prev.filter(id => id !== staffId)
                : [...prev, staffId]
        );
    };

    return (
        <Dialog open={open} onOpenChange={(v) => {
            onOpenChange(v);
            if (!v) setIsAssigning(false);
        }}>
            <DialogContent className="max-w-3xl">
                <DialogHeader className="flex flex-row items-center justify-between">
                    <div>
                        <DialogTitle>Course Lecturers</DialogTitle>
                        <DialogDescription>
                            Manage lecturers for <span className="font-medium text-primary">{course?.courseCode}</span>
                        </DialogDescription>
                    </div>
                    {isHod && (
                        <Button onClick={() => setIsAssigning(!isAssigning)} variant={isAssigning ? "secondary" : "default"} size="sm">
                            {isAssigning ? "Cancel" : "Assign Lecturers"}
                        </Button>
                    )}
                </DialogHeader>

                {isAssigning ? (
                    <div className="space-y-4 animate-in fade-in zoom-in-95">
                        <div className="flex gap-2">
                            <input
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Search staff by name or ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="border rounded-md h-[300px] overflow-y-auto p-2 space-y-1">
                            {allStaff.map((rawStaff: any) => {
                                // Normalization logic from StaffList.tsx
                                const item = rawStaff;
                                let primaryObj = item.user || item.staff || item || {};
                                const user = primaryObj.user || primaryObj;

                                const titleObj = item.title || primaryObj.title || user.title;
                                const title = titleObj?.title || titleObj?.name || titleObj || "N/A"; // Added .name check just in case

                                const firstName = user.firstName || "";
                                const lastName = user.lastName || "";
                                const staffId = item.id || primaryObj.id || user.id;
                                const userId = user.userId || primaryObj.userId;
                                const departmentName = item.department?.name || primaryObj.department?.name || user.department?.name || "N/A";

                                return (
                                    <div
                                        key={staffId}
                                        className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${selectedStaffIds.includes(String(staffId)) ? 'bg-primary/10 border-primary/50 border' : 'hover:bg-muted'}`}
                                        onClick={() => toggleStaffSelection(String(staffId))}
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm">{title} {firstName} {lastName}</span>
                                            <span className="text-xs text-muted-foreground">{userId} • {departmentName}</span>
                                        </div>
                                        {selectedStaffIds.includes(String(staffId)) && <CheckCircle2 className="h-4 w-4 text-primary" />}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setIsAssigning(false)}>Cancel</Button>
                            <Button onClick={handleAssign} disabled={selectedStaffIds.length === 0}>
                                Assign Selected ({selectedStaffIds.length})
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="mt-4 border rounded-md overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Staff ID</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                                        </TableCell>
                                    </TableRow>
                                ) : isError ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-destructive">
                                            <div className="flex flex-col items-center gap-2">
                                                <AlertCircle className="h-5 w-5" />
                                                <span>{getErrorMessage(error)}</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : lecturers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center gap-2">
                                                <UserX className="h-8 w-8 opacity-20" />
                                                <p>No lecturers assigned to this course yet.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    lecturers.map((lecturer) => (
                                        <TableRow key={lecturer.id}>
                                            <TableCell className="font-medium">
                                                {lecturer.title.name} {lecturer.user.firstName} {lecturer.user.lastName}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs">{lecturer.user.userId}</TableCell>
                                            <TableCell>{lecturer.department.name}</TableCell>
                                            <TableCell>{lecturer.title.name}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    {isHod && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className={`h-8 w-8 hover:bg-yellow-100 dark:hover:bg-yellow-900/20 ${course?.mainLecturer?.user.userId === lecturer.user.userId ? "text-yellow-500" : "text-muted-foreground hover:text-yellow-500"}`}
                                                            onClick={async () => {
                                                                if (!course) return;
                                                                try {
                                                                    await courseService.setMainLecturer(course.id, lecturer.user.userId);
                                                                    toast({ title: "Success", description: "Main lecturer updated successfully." });
                                                                    // Invalidate both lecturers (re-order potentially) and courses (to show update in list if needed)
                                                                    queryClient.invalidateQueries({ queryKey: ["courses"] });
                                                                    // We also need to update the local 'course' object or refetch it. 
                                                                    // Since 'course' is passed as prop, the parent needs to update, or we rely on the parent refetching 'courses'. 
                                                                    // Ideally, we should also invalidate the query that provided the 'course' prop.
                                                                    // For now, let's assume invalidating "courses" is enough if the parent list listens to it.
                                                                    // AND we invalidate "course-lecturers" just in case.
                                                                    queryClient.invalidateQueries({ queryKey: ["course-lecturers", course.id] });
                                                                } catch (error: any) {
                                                                    let message = "Failed to set main lecturer.";
                                                                    const status = error.response?.status;
                                                                    if (status === 403) message = "Access denied. Only HODs can perform this action.";
                                                                    else if (status === 400) message = "Operation failed. Invalid request.";
                                                                    else if (status === 422) message = "Course or Lecturer not found.";

                                                                    toast({
                                                                        title: "Error",
                                                                        description: message,
                                                                        variant: "destructive"
                                                                    });
                                                                }
                                                            }}
                                                            title={course?.mainLecturer?.user.userId === lecturer.user.userId ? "Main Lecturer" : "Set as Main Lecturer"}
                                                        >
                                                            <Star className={`h-4 w-4 ${course?.mainLecturer?.user.userId === lecturer.user.userId ? "fill-current" : ""}`} />
                                                        </Button>
                                                    )}
                                                    {isHod && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                            onClick={() => handleRemoveLecturer(lecturer.user.userId)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default CourseLecturersModal;
