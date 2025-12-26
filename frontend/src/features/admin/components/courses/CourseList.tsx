import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { courseService } from "@/features/admin/services/courseService";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, AlertCircle, RefreshCcw, ChevronLeft, ChevronRight, Book, Edit, Users, GraduationCap, ClipboardList, MoreHorizontal, Trash2 } from "lucide-react";
import { ProgrammeCourse, CourseQueryParams } from "@/features/admin/types/course";
import CourseStudentsModal from "./CourseStudentsModal";
import { CoursePrerequisitesModal } from "./CoursePrerequisitesModal";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { LoadingSpinner } from "@/components/ui/loading-spinner"; // Assuming this exists or using Loader2
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface CourseListProps {
    selectedProgramme?: string;
    filterParams?: CourseQueryParams | null;
    onEditCourse: (course: ProgrammeCourse) => void;
    onViewLecturers: (course: ProgrammeCourse) => void;
}

const CourseList = ({ selectedProgramme, filterParams, onEditCourse, onViewLecturers }: CourseListProps) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { hasRole } = useAuth();
    const isHod = hasRole("HOD");
    const isDap = hasRole("DAP");

    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Students Modal State
    const [isStudentsModalOpen, setIsStudentsModalOpen] = useState(false);
    const [selectedCourseForStudents, setSelectedCourseForStudents] = useState<ProgrammeCourse | null>(null);

    // Prerequisites Modal State
    const [isPrereqModalOpen, setIsPrereqModalOpen] = useState(false);
    const [selectedCourseForPrereq, setSelectedCourseForPrereq] = useState<ProgrammeCourse | null>(null);

    // Delete Course Mutation
    const deleteCourseMutation = useMutation({
        mutationFn: (courseId: number) => courseService.deleteCourse(courseId),
        onSuccess: () => {
            toast({
                title: "Success",
                description: "Course deleted successfully.",
                variant: "default",
            });
            queryClient.invalidateQueries({ queryKey: ["courses"] });
        },
        onError: (error: any) => {
            let message = "Failed to delete course.";
            const status = error.response?.status;
            if (status === 403) message = "Access denied. Only HODs can perform this action.";
            else if (status === 404) message = "Course not found.";

            toast({
                title: "Operation Failed",
                description: message,
                variant: "destructive",
            });
        }
    });

    // Fetch Courses
    const {
        data: courses = [],
        isLoading: isCoursesLoading,
        isError: isCoursesError,
        error: coursesError,
        refetch
    } = useQuery({
        queryKey: ["courses", selectedProgramme, filterParams],
        queryFn: () => {
            if (filterParams) {
                return courseService.getAllCourses(filterParams);
            }
            if (selectedProgramme) {
                return courseService.getAllCoursesByProgramme(Number(selectedProgramme));
            }
            return [];
        },
        enabled: !!selectedProgramme || !!filterParams,
    });

    // Filtering
    const filteredCourses = useMemo(() => {
        let result = courses;
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            result = courses.filter(c =>
                c.title.toLowerCase().includes(lowerQuery) ||
                c.courseCode.toLowerCase().includes(lowerQuery)
            );
        }
        return result;
    }, [courses, searchQuery]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
    const paginatedCourses = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredCourses.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredCourses, currentPage]);

    // Reset pagination when search changes
    useMemo(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedProgramme]);

    if (!selectedProgramme && !filterParams) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-12 opacity-50 border rounded-lg border-dashed">
                <Book className="h-16 w-16 mb-4 text-muted-foreground" />
                <p className="text-lg font-medium text-muted-foreground">Select a programme or use filters to view courses.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-in slide-in-from-right-4 duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    Available Courses
                    <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                        {filteredCourses.length}
                    </span>
                </h2>
                <div className="relative w-full max-w-xs">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search courses..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <Card className="border-none shadow-xl overflow-hidden">
                <div className="rounded-md border">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="w-[50px]">S/N</TableHead>
                                <TableHead className="w-[100px]">Code</TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead>Units</TableHead>
                                <TableHead>Span</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isCoursesLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                                    </TableCell>
                                </TableRow>
                            ) : isCoursesError ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        <div className="flex flex-col items-center gap-2 text-destructive">
                                            <AlertCircle className="h-6 w-6" />
                                            <p>{(coursesError as any)?.response?.data?.message || "Failed to fetch courses. Please try again."}</p>
                                            <Button variant="outline" size="sm" onClick={() => refetch()}>
                                                <RefreshCcw className="h-3 w-3 mr-2" />
                                                Retry
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredCourses.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        No courses found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedCourses.map((course, index) => (
                                    <TableRow key={course.id} className="group hover:bg-primary/5 transition-colors border-b-border/30">
                                        <TableCell className="font-medium text-muted-foreground">
                                            {(currentPage - 1) * itemsPerPage + index + 1}
                                        </TableCell>
                                        <TableCell className="font-bold font-mono">{course.courseCode}</TableCell>
                                        <TableCell className="font-medium">{course.title}</TableCell>
                                        <TableCell>{course.creditUnit}</TableCell>
                                        <TableCell>{course.courseSpan}</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setSelectedCourseForPrereq(course);
                                                            setIsPrereqModalOpen(true);
                                                        }}
                                                    >
                                                        <ClipboardList className="mr-2 h-4 w-4" />
                                                        View Prerequisites
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setSelectedCourseForStudents(course);
                                                            setIsStudentsModalOpen(true);
                                                        }}
                                                    >
                                                        <GraduationCap className="mr-2 h-4 w-4" />
                                                        View Students
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => onViewLecturers(course)}
                                                    >
                                                        <Users className="mr-2 h-4 w-4" />
                                                        View Lecturers
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    {isDap && (
                                                        <DropdownMenuItem
                                                            onClick={() => onEditCourse(course)}
                                                        >
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Edit Course
                                                        </DropdownMenuItem>
                                                    )}
                                                    {isHod && (
                                                        <DropdownMenuItem
                                                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                                            onClick={() => {
                                                                if (confirm(`Are you sure you want to delete course ${course.courseCode}? This action cannot be undone.`)) {
                                                                    deleteCourseMutation.mutate(course.id);
                                                                }
                                                            }}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete Course
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {/* Pagination Controls */}
            {filteredCourses.length > itemsPerPage && (
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

            <CourseStudentsModal
                open={isStudentsModalOpen}
                onOpenChange={setIsStudentsModalOpen}
                course={selectedCourseForStudents}
            />

            <CoursePrerequisitesModal
                isOpen={isPrereqModalOpen}
                onClose={() => setIsPrereqModalOpen(false)}
                courseId={selectedCourseForPrereq?.id || null}
                courseCode={selectedCourseForPrereq?.courseCode || ""}
                programmeTypeId={selectedCourseForPrereq?.programmeType?.id || null}
            />
        </div>
    );
};

export default CourseList;
