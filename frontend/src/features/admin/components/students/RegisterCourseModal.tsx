import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, BookOpen, Save } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { admissionService } from "@/features/admin/services/admissionService";
import { studentService } from "@/features/admin/services/studentService";
import { Student } from "@/features/admin/types/student";
import { toast } from "@/components/ui/use-toast";

interface RegisterCourseModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    student: Student | null;
}

const RegisterCourseModal = ({ open, onOpenChange, student }: RegisterCourseModalProps) => {
    const queryClient = useQueryClient();
    const [selectedSession, setSelectedSession] = useState<string>("");
    const [selectedSemester, setSelectedSemester] = useState<string>("");
    const [selectedCourse, setSelectedCourse] = useState<string>("");

    // Fetch Sessions
    const { data: sessions = [] } = useQuery({
        queryKey: ["sessions"],
        queryFn: admissionService.getAllSessions,
        enabled: open,
    });

    // Fetch Semesters when Session is selected
    const { data: semesters = [] } = useQuery({
        queryKey: ["semesters", selectedSession],
        queryFn: () => admissionService.getSemestersBySession(Number(selectedSession)),
        enabled: !!selectedSession,
    });

    // Fetch Courses by Student's Programme
    const { data: courses = [], isLoading: isLoadingCourses } = useQuery({
        queryKey: ["courses-by-programme", student?.programme?.id],
        queryFn: () => studentService.getCoursesByProgramme(Number(student?.programme?.id)),
        enabled: open && !!student?.programme?.id,
    });

    // Reset form when modal closes
    useEffect(() => {
        if (!open) {
            setSelectedSession("");
            setSelectedSemester("");
            setSelectedCourse("");
        }
    }, [open]);

    // Mutation for Register Course
    const registerCourseMutation = useMutation({
        mutationFn: studentService.registerCourse,
        onSuccess: () => {
            toast({
                title: "Success",
                description: "Course registered successfully."
            });
            queryClient.invalidateQueries({ queryKey: ["registered-courses"] });
            onOpenChange(false);
        },
        onError: (error: any) => {
            let title = error.response?.statusText || "Error";
            let description = error.response?.data?.message || "Failed to register course.";

            if (error.response) {
                switch (error.response.status) {
                    case 404:
                        title = "Not Found";
                        description = "Student, Course, Session or Semester not found.";
                        break;
                    case 400:
                        title = "Bad Request";
                        description = error.response.data?.message || "Invalid request parameters.";
                        break;
                    case 409:
                        title = "Conflict";
                        description = "Student already registered for this course.";
                        break;
                    case 500:
                        title = "Server Error";
                        description = "An internal server error occurred.";
                        break;
                    case 422:
                        title = "Unprocessable Entity";
                        description = error.response.data?.message || "Validation failed.";
                        break;
                    case 401:
                        title = "Unauthorized";
                        description = "Please log in to continue.";
                        break;
                    case 403:
                        title = "Forbidden";
                        description = error.response.data?.message || "You do not have permission to perform this action.";
                        break;
                }
            }

            toast({
                variant: "destructive",
                title,
                description
            });
        }
    });

    const handleRegister = () => {
        if (!student || !selectedSession || !selectedSemester || !selectedCourse) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "All fields are required."
            });
            return;
        }

        registerCourseMutation.mutate({
            course: Number(selectedCourse),
            studentMatric: student.matricNumber || student.userId, // Fallback to userId if matricNumber is missing, assuming they are similar or userId is matric
            sessionId: Number(selectedSession),
            semesterId: Number(selectedSemester)
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] border-border/50 shadow-2xl bg-background/95 backdrop-blur-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-black tracking-tight">
                        <BookOpen className="h-5 w-5 text-primary" />
                        Register Course
                    </DialogTitle>
                    <DialogDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
                        Manually register a course for {student?.firstName} {student?.lastName}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Session</Label>
                            <Select value={selectedSession} onValueChange={setSelectedSession}>
                                <SelectTrigger className="h-10 bg-muted/50 border-border/50 focus:ring-primary/20 rounded-lg text-xs font-bold">
                                    <SelectValue placeholder="Select Session" />
                                </SelectTrigger>
                                <SelectContent>
                                    {sessions.map((s: any) => (
                                        <SelectItem key={s.id} value={s.id.toString()} className="text-xs font-bold">
                                            {s.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Semester</Label>
                            <Select value={selectedSemester} onValueChange={setSelectedSemester} disabled={!selectedSession}>
                                <SelectTrigger className="h-10 bg-muted/50 border-border/50 focus:ring-primary/20 rounded-lg text-xs font-bold">
                                    <SelectValue placeholder="Select Semester" />
                                </SelectTrigger>
                                <SelectContent>
                                    {semesters.map((s: any) => (
                                        <SelectItem key={s.id} value={s.id.toString()} className="text-xs font-bold">
                                            {s.title || s.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Course</Label>
                        <Select value={selectedCourse} onValueChange={setSelectedCourse} disabled={isLoadingCourses}>
                            <SelectTrigger className="h-10 bg-muted/50 border-border/50 focus:ring-primary/20 rounded-lg text-xs font-bold">
                                <SelectValue placeholder={isLoadingCourses ? "Loading Courses..." : "Select Course"} />
                            </SelectTrigger>
                            <SelectContent className="max-h-[15rem] overflow-y-auto">
                                {courses.map((c: any) => (
                                    <SelectItem key={c.id} value={c.id.toString()} className="text-xs font-bold">
                                        <span className="font-mono mr-2">{c.code}</span>
                                        {c.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter className="border-t border-border/50 pt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="h-9 gap-2 text-xs font-bold rounded-lg" disabled={registerCourseMutation.isPending}>
                        Cancel
                    </Button>
                    <Button onClick={handleRegister} className="h-9 gap-2 text-xs font-bold rounded-lg" disabled={registerCourseMutation.isPending}>
                        {registerCourseMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        {!registerCourseMutation.isPending && <Save className="h-3.5 w-3.5" />}
                        Register Course
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default RegisterCourseModal;
