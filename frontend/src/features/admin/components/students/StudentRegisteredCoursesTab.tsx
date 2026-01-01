import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { BookOpen, Loader2, PlusCircle } from "lucide-react";
import { admissionService } from "@/features/admin/services/admissionService";
import { studentService } from "@/features/admin/services/studentService";
import { sessionService } from "@/features/admin/services/sessionService";
import RegisterCourseModal from "./RegisterCourseModal";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

interface StudentRegisteredCoursesTabProps {
    student: any;
    currentSessionId?: number;
}

export const StudentRegisteredCoursesTab = ({ student: s, currentSessionId }: StudentRegisteredCoursesTabProps) => {
    const { hasRole } = useAuth();
    const [activeSession, setActiveSession] = useState<string>("");
    const [activeSemester, setActiveSemester] = useState<string>("");
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

    useEffect(() => {
        if (currentSessionId) setActiveSession(currentSessionId.toString());
    }, [currentSessionId]);

    const { data: sessions = [] } = useQuery({
        queryKey: ["sessions"],
        queryFn: sessionService.getAllSessions,
    });

    const { data: semesters = [] } = useQuery({
        queryKey: ["semesters", activeSession],
        queryFn: () => sessionService.getSemestersBySession(Number(activeSession)),
        enabled: !!activeSession,
    });

    useEffect(() => {
        if (semesters.length > 0 && !activeSemester) setActiveSemester(semesters[0].id.toString());
    }, [semesters, activeSemester]);

    const { data: courses = [], isLoading: isLoadingCourses } = useQuery({
        queryKey: ["registered-courses", s?.userId, activeSession, activeSemester],
        queryFn: () =>
            studentService.getRegisteredCourses(
                s?.userId || "",
                Number(activeSession),
                Number(activeSemester)
            ),
        enabled: !!s?.userId && !!activeSession && !!activeSemester,
    });

    return (
        <Card className="border-border/50 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
            <CardHeader className="bg-muted/10 border-b border-border/40 py-2 flex flex-row items-center justify-between space-y-0 gap-4">
                <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground flex items-center gap-2 shrink-0">
                    <BookOpen className="h-3.5 w-3.5" />
                    Registered Courses
                </CardTitle>
                <div className="flex items-center gap-2 flex-1 justify-end">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsRegisterModalOpen(true)}
                        className="h-7 text-xs font-bold gap-1.5 mr-2"
                    >
                        <PlusCircle className="h-3.5 w-3.5" />
                        Register Course
                    </Button>
                    <Select value={activeSession} onValueChange={setActiveSession}>
                        <SelectTrigger className="h-7 min-w-[120px] w-auto text-xs bg-background/50">
                            <SelectValue placeholder="Session" />
                        </SelectTrigger>
                        <SelectContent>
                            {sessions.map((s: any) => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={activeSemester} onValueChange={setActiveSemester}>
                        <SelectTrigger className="h-7 min-w-[100px] w-auto text-xs bg-background/50">
                            <SelectValue placeholder="Semester" />
                        </SelectTrigger>
                        <SelectContent>
                            {semesters.map((s: any) => <SelectItem key={s.id} value={s.id.toString()}>{s.title || s.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <TableHead className="h-9 text-[10px] uppercase font-bold pl-6">Code</TableHead>
                            <TableHead className="h-9 text-[10px] uppercase font-bold">Title</TableHead>
                            <TableHead className="h-9 text-[10px] uppercase font-bold text-right pr-6">Units</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoadingCourses ? (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">
                                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                                </TableCell>
                            </TableRow>
                        ) : courses.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center text-xs text-muted-foreground font-medium">
                                    {activeSession && activeSemester ? "No courses registered for this session/semester." : "Select session and semester to view courses."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            courses.map((course: any) => (
                                <TableRow key={course.id || course.course?.id}>
                                    <TableCell className="font-mono text-xs font-bold py-3 pl-6">{course.courseCode || course.course?.code}</TableCell>
                                    <TableCell className="text-xs font-medium py-3">{course.title || course.course?.title}</TableCell>
                                    <TableCell className="text-xs font-bold py-3 text-right pr-6">{course.creditUnit || course.course?.unit}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
            <RegisterCourseModal
                open={isRegisterModalOpen}
                onOpenChange={setIsRegisterModalOpen}
                student={s}
            />
        </Card>
    );
};
