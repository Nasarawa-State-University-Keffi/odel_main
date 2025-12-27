import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { studentService } from "@/features/admin/services/studentService";
import { admissionService } from "@/features/admin/services/admissionService";
import { courseService } from "@/features/admin/services/courseService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Search, BookOpen, UserCircle, AlertCircle, CheckCircle2, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";

const ManualRegistration = () => {
    const { toast } = useToast();
    const { hasRole } = useAuth();

    // State
    const [matricNumber, setMatricNumber] = useState("");
    const [searchedMatric, setSearchedMatric] = useState("");
    const [selectedSession, setSelectedSession] = useState<string>("");
    const [selectedSemester, setSelectedSemester] = useState<string>("");
    const [selectedCourse, setSelectedCourse] = useState<string>("");

    // 1. Fetch Student Details
    const {
        data: student,
        isLoading: isStudentLoading,
        isError: isStudentError,
        refetch: searchStudent
    } = useQuery({
        queryKey: ["student", searchedMatric],
        queryFn: () => studentService.getStudentByMatric(searchedMatric),
        enabled: !!searchedMatric,
        retry: false
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (matricNumber.trim()) {
            setSearchedMatric(matricNumber.trim());
            setSelectedCourse("");
        }
    };

    // 2. Fetch Sessions
    const { data: sessions = [] } = useQuery({
        queryKey: ["sessions"],
        queryFn: admissionService.getAllSessions,
    });

    // 3. Fetch Courses (Dependent on Student)
    const { data: courses = [], isLoading: isCoursesLoading } = useQuery({
        queryKey: ["courses", student?.programme?.id],
        queryFn: () => studentService.getCoursesByProgramme(student?.programme?.id!),
        enabled: !!student?.programme?.id,
    });

    // 4. Mutation to Register Course
    const registerMutation = useMutation({
        mutationFn: courseService.registerCourse,
        onSuccess: () => {
            toast({ title: "Success", description: "Course registered successfully." });
            setSelectedCourse("");
        },
        onError: (error: any) => {
            let message = "Failed to register course.";
            const status = error.response?.status;
            const data = error.response?.data;
            if (status === 400) message = data?.message || "Invalid request. Check prerequisites or fees.";
            else if (status === 403) message = "Access denied.";
            else if (status === 422) message = data?.message || "Registration failed.";

            toast({ title: "Registration Failed", description: message, variant: "destructive" });
        }
    });

    const handleRegister = () => {
        if (!student || !selectedSession || !selectedSemester || !selectedCourse) {
            toast({ description: "Please fill in all fields.", variant: "destructive" });
            return;
        }
        registerMutation.mutate({
            studentMatric: student.matricNumber,
            sessionId: Number(selectedSession),
            semesterId: Number(selectedSemester),
            course: Number(selectedCourse)
        });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Student Search & Details */}
            <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-6 h-fit">
                <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Search className="h-5 w-5 text-primary" />
                            Find Student
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <Input
                                placeholder="Enter Matric Number"
                                value={matricNumber}
                                onChange={(e) => setMatricNumber(e.target.value)}
                                className="h-11 bg-muted/30"
                            />
                            <Button type="submit" disabled={isStudentLoading} className="h-11 w-11 p-0 shrink-0">
                                {isStudentLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            </Button>
                        </form>

                        {isStudentError && (
                            <Alert variant="destructive" className="animate-in zoom-in-95 duration-200">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>Student not found or valid.</AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>

                {student && (
                    <Card className="border-primary/20 shadow-xl bg-primary/5 animate-in slide-in-from-left-4 duration-500">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-primary">
                                <UserCircle className="h-5 w-5" />
                                Student Profile
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label className="text-xs font-bold uppercase text-muted-foreground">Full Name</Label>
                                <p className="font-bold text-lg">{student.firstName} {student.lastName}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs font-bold uppercase text-muted-foreground">Matric No</Label>
                                    <p className="font-medium text-sm">{student.matricNumber}</p>
                                </div>
                                <div>
                                    <Label className="text-xs font-bold uppercase text-muted-foreground">Level</Label>
                                    <p className="font-medium text-sm">{student.level?.title || "N/A"}</p>
                                </div>
                            </div>
                            <div>
                                <Label className="text-xs font-bold uppercase text-muted-foreground">Programme</Label>
                                <p className="font-medium text-sm">{student.programme?.name || "N/A"}</p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Right Column: Registration Form */}
            <div className="lg:col-span-2 space-y-6">
                <Card className="border-none shadow-xl relative overflow-hidden">
                    {!student && (
                        <div className="absolute inset-0 bg-background/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
                            <div className="text-center p-6 bg-background/90 rounded-2xl shadow-lg border max-w-sm mx-auto">
                                <UserCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                                <p className="text-muted-foreground font-medium">Please search and select a student first.</p>
                            </div>
                        </div>
                    )}
                    <CardHeader className="bg-muted/30 pb-4">
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-primary" />
                            Register Course
                        </CardTitle>
                        <CardDescription>Select the academic session and course using <strong>student ID</strong>.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Academic Session</Label>
                                <Select value={selectedSession} onValueChange={setSelectedSession}>
                                    <SelectTrigger className="h-11"><SelectValue placeholder="Select Session" /></SelectTrigger>
                                    <SelectContent className="max-h-[300px]">
                                        {sessions.map((session: any) => (
                                            <SelectItem key={session.id} value={session.id.toString()}>{session.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Semester</Label>
                                <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                                    <SelectTrigger className="h-11"><SelectValue placeholder="Select Semester" /></SelectTrigger>
                                    <SelectContent className="max-h-[300px]">
                                        <SelectItem value="1">First Semester</SelectItem>
                                        <SelectItem value="2">Second Semester</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Select Course</Label>
                            <Select value={selectedCourse} onValueChange={setSelectedCourse} disabled={isCoursesLoading}>
                                <SelectTrigger className="h-11"><SelectValue placeholder={isCoursesLoading ? "Loading..." : "Select Course"} /></SelectTrigger>
                                <SelectContent>
                                    {courses.map((course: any) => (
                                        <SelectItem key={course.id} value={course.id.toString()}>
                                            <span className="font-bold mr-2">{course.code}</span>
                                            {course.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="pt-4 flex justify-end">
                            <Button size="lg" className="font-bold px-8" onClick={handleRegister} disabled={registerMutation.isPending || !selectedCourse}>
                                {registerMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
                                Register Course
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {student && selectedSession && selectedSemester && (
                    <RegisteredCoursesList
                        studentMatric={student.userId}
                        sessionId={Number(selectedSession)}
                        semesterId={Number(selectedSemester)}
                        isResultAdmin={hasRole('RESULT_ADMIN')}
                    />
                )}
            </div>
        </div>
    );
};

const RegisteredCoursesList = ({ studentMatric, sessionId, semesterId, isResultAdmin }: any) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data, isLoading, isError, error } = useQuery({
        queryKey: isResultAdmin
            ? ["student-courses-admin", studentMatric, semesterId]
            : ["student-courses", studentMatric, sessionId, semesterId],
        queryFn: () => isResultAdmin
            ? courseService.getStudentRegisteredCoursesAdministrative(studentMatric, semesterId)
            : courseService.getStudentRegisteredCourses(studentMatric, sessionId, semesterId),
        retry: false
    });

    const unregisterMutation = useMutation({
        mutationFn: (id: number) => courseService.unregisterCourseAdministrative(studentMatric, id),
        onSuccess: () => {
            toast({ title: "Success", description: "Unregistered successfully." });
            queryClient.invalidateQueries({ queryKey: ["student-courses"] });
            queryClient.invalidateQueries({ queryKey: ["student-courses-admin"] });
        },
        onError: () => toast({ title: "Error", description: "Failed to unregister.", variant: "destructive" })
    });

    const registeredCourses = Array.isArray(data) ? data : (data?.registeredCourses || []);

    // Helper to normalize course data structure
    const getCourseData = (item: any) => item.course || (item.courseCode ? item : null);

    if (isLoading) return <Loader2 className="h-8 w-8 animate-spin mx-auto mt-12 text-primary" />;
    if (isError) return <div className="text-center mt-12 text-red-500">Failed to load courses.</div>;

    return (
        <Card className="border-none shadow-xl overflow-hidden">
            <CardHeader className="bg-muted/30 pb-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Registered Courses</CardTitle>
                    <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">{registeredCourses.length} Courses</div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {registeredCourses.length === 0 ? <p className="p-8 text-center text-muted-foreground">No courses registered.</p> : (
                    <div className="divide-y">
                        {registeredCourses.map((item: any, idx: number) => {
                            const course = getCourseData(item);
                            if (!course) return null;
                            return (
                                <div key={item.id || idx} className="flex items-center justify-between p-4 hover:bg-muted/30">
                                    <div className="flex gap-4 items-center">
                                        <span className="text-xs font-bold bg-primary/10 w-6 h-6 rounded-full flex items-center justify-center text-primary">{idx + 1}</span>
                                        <div>
                                            <p className="font-bold text-sm">{course.courseCode}</p>
                                            <p className="text-xs text-muted-foreground">{course.title}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs bg-secondary px-2 py-1 rounded">{course.unit || course.creditUnit || '-'} Units</span>
                                        {isResultAdmin && <Button variant="ghost" size="sm" onClick={() => {
                                            if (confirm("Unregister?")) unregisterMutation.mutate(item.id);
                                        }} disabled={unregisterMutation.isPending}><Trash2 className="h-4 w-4 text-red-500" /></Button>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default ManualRegistration;
