import { useState, useMemo } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { courseService } from "@/features/admin/services/courseService";
import { Loader2, AlertCircle, Info, BookOpen, Plus, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ProgrammeCourse } from "@/features/admin/types/course";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface CoursePrerequisitesModalProps {
    isOpen: boolean;
    onClose: () => void;
    courseId: number | null;
    courseCode: string;
}

export const CoursePrerequisitesModal = ({ isOpen, onClose, courseId, courseCode }: CoursePrerequisitesModalProps) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { hasRole } = useAuth();
    const isHod = hasRole("HOD");

    // State for adding prerequisite
    const [selectedPrereqId, setSelectedPrereqId] = useState<string>("");
    const [isAddMode, setIsAddMode] = useState(false);

    // Fetch prerequisites logic
    const {
        data: prerequisites,
        isLoading,
        isError,
        error
    } = useQuery({
        queryKey: ["course-prerequisites", courseId],
        queryFn: () => {
            if (!courseId) throw new Error("Course ID is required");
            return courseService.getCoursePrerequisites(courseId);
        },
        enabled: !!courseId && isOpen,
        retry: false
    });

    // Fetch All Courses for Selection (Optimized to fetch only when adding)
    // NOTE: Ideally we should filter by programme, but for now we fetch all to ensure flexibility
    // Using a broad search or programme specific fetch would be better if we had the programme ID handy
    const { data: availableCourses = [] } = useQuery({
        queryKey: ["all-courses-for-prereq"],
        queryFn: () => courseService.getAllCourses({ strict: false, programme_type: 1 }), // Defaulting params for now
        enabled: isAddMode && isOpen
    });

    // Filter out courses that are already prerequisites or the course itself
    const filteredAvailableCourses = useMemo(() => {
        if (!availableCourses) return [];
        const existingIds = new Set((prerequisites || []).map((p: any) => p.id));
        existingIds.add(courseId); // Exclude self
        return availableCourses.filter((c: any) => !existingIds.has(c.id));
    }, [availableCourses, prerequisites, courseId]);


    // Add Prerequisite Mutation
    const addPrereqMutation = useMutation({
        mutationFn: ({ cId, pId }: { cId: number, pId: number }) =>
            courseService.addCoursePrerequisite(cId, pId),
        onSuccess: () => {
            toast({
                title: "Success",
                description: "Prerequisite added successfully.",
                variant: "default",
            });
            queryClient.invalidateQueries({ queryKey: ["course-prerequisites", courseId] });
            setIsAddMode(false);
            setSelectedPrereqId("");
        },
        onError: (error: any) => {
            let message = "Failed to add prerequisite.";
            const status = error.response?.status;
            const data = error.response?.data;

            if (status === 422) {
                message = data?.message || "Invalid request. Circular dependency or course not found.";
            } else if (status === 403) {
                message = "Access denied. Only HODs can perform this action.";
            }

            toast({
                title: "Operation Failed",
                description: message,
                variant: "destructive",
            });
        }
    });

    const handleAddPrerequisite = () => {
        if (!selectedPrereqId || !courseId) return;
        addPrereqMutation.mutate({ cId: courseId, pId: Number(selectedPrereqId) });
    };

    // Remove Prerequisite Mutation
    const removePrereqMutation = useMutation({
        mutationFn: ({ cId, pId }: { cId: number, pId: number }) =>
            courseService.removeCoursePrerequisite(cId, pId),
        onSuccess: () => {
            toast({
                title: "Success",
                description: "Prerequisite removed successfully.",
                variant: "default",
            });
            queryClient.invalidateQueries({ queryKey: ["course-prerequisites", courseId] });
        },
        onError: (error: any) => {
            let message = "Failed to remove prerequisite.";
            const status = error.response?.status;
            if (status === 403) {
                message = "Access denied. Only HODs can perform this action.";
            } else if (status === 422) {
                message = "Invalid request. Course or prerequisite not found.";
            }
            toast({
                title: "Operation Failed",
                description: message,
                variant: "destructive",
            });
        }
    });

    // Handle specific error codes if needed, though useQuery handles general errors well
    const status = (error as any)?.response?.status;
    const isCourseNotFound = status === 422;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-primary" />
                        Prerequisites for {courseCode}
                    </DialogTitle>
                    <DialogDescription>
                        List of courses that must be completed before taking {courseCode}.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-6">
                    {/* List Section */}
                    <div>
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center p-8 text-muted-foreground gap-2">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <p>Loading prerequisites...</p>
                            </div>
                        ) : isError ? (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Error Loading Data</AlertTitle>
                                <AlertDescription>
                                    {isCourseNotFound
                                        ? "This course does not exist or has invalid data."
                                        : "Failed to load prerequisites. Please try again."}
                                </AlertDescription>
                            </Alert>
                        ) : !prerequisites || prerequisites.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-8 bg-muted/10 rounded-lg border border-dashed text-muted-foreground text-center gap-2">
                                <Info className="h-8 w-8 opacity-20" />
                                <div>
                                    <p className="font-medium text-foreground">No Prerequisites</p>
                                    <p className="text-sm">This course has no prerequisite requirements.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="border rounded-md divide-y max-h-[300px] overflow-y-auto">
                                {prerequisites.map((req: ProgrammeCourse, index: number) => (
                                    <div key={req.id} className="flex items-center gap-4 p-3 hover:bg-muted/50 transition-colors group">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm">{req.courseCode}</p>
                                            <p className="text-xs text-muted-foreground">{req.title}</p>
                                        </div>
                                        <div className="ml-auto flex items-center gap-2">
                                            {!req.compulsory && (
                                                <span className="text-[10px] font-bold bg-secondary px-2 py-0.5 rounded-full text-secondary-foreground">
                                                    Elective
                                                </span>
                                            )}
                                            {isHod && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                    disabled={removePrereqMutation.isPending}
                                                    onClick={() => {
                                                        if (courseId) {
                                                            removePrereqMutation.mutate({ cId: courseId, pId: req.id });
                                                        }
                                                    }}
                                                    title="Remove Prerequisite"
                                                >
                                                    {removePrereqMutation.isPending ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Add Section */}
                    {isHod && (
                        <div className="pt-4 border-t">
                            {!isAddMode ? (
                                <Button
                                    onClick={() => setIsAddMode(true)}
                                    className="w-full" variant="outline"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Prerequisite
                                </Button>
                            ) : (
                                <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-semibold">Add New Prerequisite</h4>
                                        <Select value={selectedPrereqId} onValueChange={setSelectedPrereqId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select course..." />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-[200px]">
                                                {filteredAvailableCourses.map((course: any) => (
                                                    <SelectItem key={course.id} value={course.id.toString()}>
                                                        <span className="font-bold mr-2">{course.courseCode}</span>
                                                        <span className="text-muted-foreground truncate max-w-[200px]">{course.title}</span>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                        <Button
                                            variant="ghost"
                                            onClick={() => {
                                                setIsAddMode(false);
                                                setSelectedPrereqId("");
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleAddPrerequisite}
                                            disabled={!selectedPrereqId || addPrereqMutation.isPending}
                                        >
                                            {addPrereqMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Add Course
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
