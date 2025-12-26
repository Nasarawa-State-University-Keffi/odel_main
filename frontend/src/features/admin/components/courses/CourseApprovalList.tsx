import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { courseService } from "@/features/admin/services/courseService";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, RefreshCcw, CheckCircle2, Circle, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CourseApprovalListProps {
    filters: {
        sessionId: number;
        semesterId: number;
        departmentId?: number;
        programmeTypeId?: number; // Added to match state
        programmeId?: number;     // Added to match state
        approvalLevel: string
    } | null;
}

const CourseApprovalList = ({ filters }: CourseApprovalListProps) => {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const {
        data: courses = [],
        isLoading,
        isError,
        error,
        refetch
    } = useQuery({
        queryKey: ["approval-courses", filters?.sessionId, filters?.semesterId, filters?.departmentId, filters?.approvalLevel],
        queryFn: () => {
            if (filters) {
                if (filters.approvalLevel === 'faculty') {
                    return courseService.getCoursesForFacultyApproval(filters.sessionId, filters.semesterId, filters.departmentId);
                }
                return courseService.getCoursesForDepartmentApproval(filters.sessionId, filters.semesterId, filters.departmentId);
            }
            return [];
        },
        enabled: !!filters,
    });

    // Reset page when filters change/new data loads
    useMemo(() => {
        setCurrentPage(1);
    }, [filters]);

    // Pagination Logic
    const totalPages = Math.ceil(courses.length / itemsPerPage);
    const paginatedCourses = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return courses.slice(startIndex, startIndex + itemsPerPage);
    }, [courses, currentPage]);

    if (!filters) {
        return (
            <div className="h-64 flex flex-col items-center justify-center p-12 opacity-50 border rounded-lg border-dashed bg-muted/20">
                <AlertCircle className="h-12 w-12 mb-4 text-muted-foreground" />
                <p className="text-lg font-medium text-muted-foreground">Select Session, Semester, and Department to view approvals.</p>
            </div>
        );
    }

    const StatusBadge = ({ approved }: { approved: boolean }) => (
        <Badge variant={approved ? "default" : "outline"} className={`gap-1 ${approved ? "bg-green-600 hover:bg-green-700" : "text-muted-foreground"}`}>
            {approved ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
            {approved ? "Approved" : "Pending"}
        </Badge>
    );

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-none shadow-xl overflow-hidden">
                <div className="rounded-md border overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="w-[50px] min-w-[50px]">S/N</TableHead>
                                <TableHead className="w-[100px] min-w-[100px]">Code</TableHead>
                                <TableHead className="min-w-[150px]">Title</TableHead>
                                <TableHead className="min-w-[60px]">Units</TableHead>
                                <TableHead className="text-center min-w-[120px]">Dept. Status</TableHead>
                                <TableHead className="text-center min-w-[120px]">Faculty Status</TableHead>
                                <TableHead className="text-center min-w-[120px]">Senate Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-32 text-center">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                                        <p className="text-muted-foreground mt-2 text-sm">Loading courses...</p>
                                    </TableCell>
                                </TableRow>
                            ) : isError ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-32 text-center">
                                        <div className="flex flex-col items-center gap-2 text-destructive">
                                            <AlertCircle className="h-8 w-8" />
                                            <p>
                                                {(error as any)?.response?.status === 404
                                                    ? "Session not found."
                                                    : (error as any)?.response?.status === 422
                                                        ? "Invalid department or semester."
                                                        : (error as any)?.response?.data?.message || "Failed to fetch courses. Please try again."}
                                            </p>
                                            <Button variant="outline" size="sm" onClick={() => refetch()}>
                                                <RefreshCcw className="h-3 w-3 mr-2" />
                                                Retry
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : courses.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                                        No courses found for the selected criteria.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedCourses.map((course, index) => (
                                    <TableRow key={course.id} className="hover:bg-muted/5">
                                        <TableCell className="font-medium text-muted-foreground">
                                            {(currentPage - 1) * itemsPerPage + index + 1}
                                        </TableCell>
                                        <TableCell className="font-bold font-mono">{course.courseCode}</TableCell>
                                        <TableCell className="font-medium">{course.title}</TableCell>
                                        <TableCell>{course.creditUnit}</TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex justify-center whitespace-nowrap">
                                                <StatusBadge approved={course.currentApprovalInformation?.departmentApproved} />
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex justify-center whitespace-nowrap">
                                                <StatusBadge approved={course.currentApprovalInformation?.facultyApproved} />
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex justify-center whitespace-nowrap">
                                                <StatusBadge approved={course.currentApprovalInformation?.senateApproved} />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {/* Pagination Controls */}
            {courses.length > itemsPerPage && (
                <div className="flex justify-between items-center pt-2">
                    <div className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CourseApprovalList;
