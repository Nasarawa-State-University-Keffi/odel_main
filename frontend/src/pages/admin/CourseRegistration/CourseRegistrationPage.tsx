import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { studentService } from "@/features/admin/services/studentService";
import { admissionService } from "@/features/admin/services/admissionService";
import { courseService } from "@/features/admin/services/courseService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Search, BookOpen, UserCircle, Calendar, AlertCircle, CheckCircle2, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Student } from "@/features/admin/types/student";
import { useAuth } from "@/contexts/AuthContext";

const CourseRegistrationPage = () => {
    const { toast } = useToast();
    const { hasRole } = useAuth();

    // State
    const [matricNumber, setMatricNumber] = useState("");
    const [searchedMatric, setSearchedMatric] = useState("");
    const [selectedSession, setSelectedSession] = useState<string>("");
    const [selectedSemester, setSelectedSemester] = useState<string>("");
    const [selectedCourse, setSelectedCourse] = useState<string>("");

    // Derived State
    const isStudentLoaded = !!searchedMatric;

    // 1. Fetch Student Details
    const {
        data: student,
        isLoading: isStudentLoading,
        isError: isStudentError,
        error: studentError,
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
            // HANDLES RESETTING WHEN WE ENTER ANOTHER MATRIC NUMBER
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
            toast({
                title: "Success",
                description: "Course registered successfully.",
                variant: "default",
            });
            // THIS IS OPTIONAL AS IT HANDLES THE RESET OF THE FORM
            setSelectedCourse("");
        },
        onError: (error: any) => {
            let message = "Failed to register course.";
            const status = error.response?.status;
            const data = error.response?.data;

            if (status === 400) {
                message = data?.message || "Invalid request. Check prerequisites or fees.";
            } else if (status === 403) {
                message = "Access denied. You don't have permission.";
            } else if (status === 422) {
                // Specific business logic errors
                message = data?.message || "Registration failed. Check deferment or semester status.";
            }

            toast({
                title: "Registration Failed",
                description: message,
                variant: "destructive",
            });
        }
    });

    const handleRegister = () => {
        if (!student || !selectedSession || !selectedSemester || !selectedCourse) {
            toast({
                description: "Please fill in all fields.",
                variant: "destructive"
            });
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
        <div className="p-6 space-y-8 max-w-[1200px] mx-auto animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black tracking-tighter text-[#01402c]">Course Registration</h1>
                <p className="text-muted-foreground font-medium">Manually register courses for students.</p>
            </div>

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
                                    <AlertDescription>
                                        Student not found or valid.
                                    </AlertDescription>
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
                                <div>
                                    <Label className="text-xs font-bold uppercase text-muted-foreground">Department</Label>
                                    <p className="font-medium text-sm">{student.department?.name || student.programme?.department?.name || "N/A"}</p>
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
                                <div className="text-center p-6 bg-background/90 rounded-2xl shadow-lg border max-w-sm mx-auto animate-in zoom-in-95 duration-300">
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
                            <CardDescription>Select the academic session and course to register.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Academic Session</Label>
                                    <Select value={selectedSession} onValueChange={setSelectedSession}>
                                        <SelectTrigger className="h-11 bg-background hover:bg-muted/50 transition-colors">
                                            <SelectValue placeholder="Select Session" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[300px]">
                                            {sessions.map((session: any) => (
                                                <SelectItem key={session.id} value={session.id.toString()}>
                                                    {session.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Semester</Label>
                                    <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                                        <SelectTrigger className="h-11 bg-background hover:bg-muted/50 transition-colors">
                                            <SelectValue placeholder="Select Semester" />
                                        </SelectTrigger>
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
                                    <SelectTrigger className="h-11 bg-background hover:bg-muted/50 transition-colors">
                                        <SelectValue placeholder={isCoursesLoading ? "Loading Courses..." : "Select Course"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {courses.map((course: any) => (
                                            <SelectItem key={course.id} value={course.id.toString()}>
                                                <span className="font-bold mr-2">{course.code}</span>
                                                <span className="text-muted-foreground">{course.title}</span>
                                                <span className="ml-2 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{course.unit} Units</span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <Button
                                    size="lg"
                                    className="font-bold px-8 shadow-xl shadow-primary/20 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary"
                                    onClick={handleRegister}
                                    disabled={registerMutation.isPending || !selectedCourse}
                                >
                                    {registerMutation.isPending ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Registering...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="mr-2 h-5 w-5" />
                                            Register Course
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>


                    {/* Registered Courses List */}
                    {student && selectedSession && selectedSemester && (
                        <div className="animate-in slide-in-from-bottom-4 duration-500">
                            <RegisteredCoursesList
                                studentMatric={student.userId}
                                sessionId={Number(selectedSession)}
                                semesterId={Number(selectedSemester)}
                                isResultAdmin={hasRole('RESULT_ADMIN')}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
};

const RegisteredCoursesList = ({ studentMatric, sessionId, semesterId, isResultAdmin }: { studentMatric: string, sessionId: number, semesterId: number, isResultAdmin: boolean }) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Debugging Logs
    useEffect(() => {
        console.log("RegisteredCoursesList Params:", { studentMatric, sessionId, semesterId, isResultAdmin });
    }, [studentMatric, sessionId, semesterId, isResultAdmin]);

    const {
        data,
        isLoading,
        isError,
        error
    } = useQuery({
        queryKey: isResultAdmin
            ? ["student-courses-admin", studentMatric, semesterId]
            : ["student-courses", studentMatric, sessionId, semesterId],
        queryFn: () => isResultAdmin
            ? courseService.getStudentRegisteredCoursesAdministrative(studentMatric, semesterId)
            : courseService.getStudentRegisteredCourses(studentMatric, sessionId, semesterId),
        retry: false
    });

    // Unregister Mutation
    const unregisterMutation = useMutation({
        mutationFn: (registeredCourseId: number) =>
            courseService.unregisterCourseAdministrative(studentMatric, registeredCourseId),
        onSuccess: () => {
            toast({
                title: "Success",
                description: "Course unregistered successfully.",
                variant: "default",
            });
            // Invalidate queries to refresh the list
            queryClient.invalidateQueries({ queryKey: ["student-courses-admin"] });
            queryClient.invalidateQueries({ queryKey: ["student-courses"] });
        },
        onError: (error: any) => {
            let message = "Failed to unregister course.";
            const status = error.response?.status;
            const data = error.response?.data;

            if (status === 400) {
                message = data?.message || "Invalid request. Check student or course validity.";
            } else if (status === 422) {
                message = data?.message || "Unprocessable Entity. Course may not belong to student.";
            } else if (status === 403) {
                message = "Access denied. You don't have permission to perform this action.";
            }

            toast({
                title: "Unregistration Failed",
                description: message,
                variant: "destructive",
            });
        }
    });

    const handleUnregister = (registeredCourseId: number) => {
        if (confirm("Are you sure you want to unregister this course? This action cannot be undone.")) {
            unregisterMutation.mutate(registeredCourseId);
        }
    };

    // Supports both direct array return or { registeredCourses: [...] } wrapper
    const registeredCourses = Array.isArray(data) ? data : (data?.registeredCourses || []);

    // Safety check for data format
    const getCourseData = (item: any) => {
        if (item.course) return item.course; // New nested format
        if (item.courseCode) return item;     // Old flat format fallback
        return null;
    };

    if (isLoading) {
        return (
            <Card className="border-none shadow-md bg-muted/10">
                <CardContent className="p-6 flex justify-center items-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </CardContent>
            </Card>
        );
    }

    if (isError) {
        let errorMessage = "Failed to load registered courses.";
        const status = (error as any)?.response?.status;
        const serverMessage = (error as any)?.response?.data?.message;

        switch (status) {
            case 404:
                errorMessage = serverMessage || "Student or Semester not found.";
                break;
            case 403:
                errorMessage = serverMessage || "Access denied.";
                break;
            default:
                errorMessage = serverMessage || "Failed to load registered courses.";
        }

        return (
            <Card className="border-destructive/20 shadow-md bg-destructive/5">
                <CardContent className="p-6 flex flex-col items-center justify-center h-48 text-destructive gap-2 text-center">
                    <AlertCircle className="h-8 w-8" />
                    <p className="font-medium px-4">{errorMessage}</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-none shadow-xl overflow-hidden">
            <CardHeader className="bg-muted/30 pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-primary" />
                            Registered Courses
                        </CardTitle>
                        <CardDescription>
                            Courses currently registered for this student and semester.
                        </CardDescription>
                    </div>
                    <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">
                        {registeredCourses.length} Courses
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {registeredCourses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border-t border-dashed bg-muted/5 gap-2">
                        <BookOpen className="h-8 w-8 opacity-20" />
                        <p>No courses registered yet.</p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {registeredCourses.map((item: any, index: number) => {
                            const course = getCourseData(item);

                            if (!course) return null; // Skip invalid items

                            return (
                                <div key={item.id || index} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm tracking-tight">{course.courseCode || "Unknown Code"}</p>
                                            <p className="text-xs text-muted-foreground">{course.title || "Unknown Title"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-xs font-bold bg-secondary px-2.5 py-1 rounded-md whitespace-nowrap">
                                            {course.unit || course.creditUnit || '-'} Units
                                        </div>
                                        {isResultAdmin && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 w-8 p-0"
                                                onClick={() => handleUnregister(item.id)} // Assuming item.id is the registered_course ID
                                                disabled={unregisterMutation.isPending}
                                            >
                                                {unregisterMutation.isPending ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
                                            </Button>
                                        )}
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

export default CourseRegistrationPage;
