import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, Loader2, AlertCircle, TrendingUp, BookOpen, GraduationCap, XCircle, CheckCircle } from "lucide-react";
import { studentService } from "@/features/admin/services/studentService";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Interfaces based on the provided JSON structure
interface Course {
    id: number;
    courseCode: string;
    title: string;
    creditUnit: number;
    compulsory: boolean;
}

interface RegisteredCourse {
    id: number;
    programmeAndCourse: {
        programme: {
            name: string;
        }
    };
    passed: boolean; // Note: In one case it was false but grade A?? Using grade as truth if available.
    status: string;
}

interface StudentResult {
    id: number;
    grade: string;
    total: number;
    exam: number;
    ca: number;
    registeredCourse: RegisteredCourse;
    course: Course;
    resultValid: boolean;
    approved: boolean;
}

interface StudentResultsTabProps {
    student: any;
}

export const StudentResultsTab = ({ student }: StudentResultsTabProps) => {
    const { data: results, isLoading, isError, error } = useQuery({
        queryKey: ["student-result", student.userId],
        queryFn: async () => {
            const data = await studentService.getStudentResult(student.userId);
            // Ensure we return an array
            return Array.isArray(data) ? data : [];
        },
        enabled: !!student.userId,
        retry: false
    });

    if (!student.userId) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Missing User ID</AlertTitle>
                <AlertDescription>
                    This student does not have a user ID, which is required to check results.
                </AlertDescription>
            </Alert>
        );
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <p>Loading student results...</p>
            </div>
        );
    }

    if (isError) {
        const status = (error as any)?.response?.status;
        const backendMessage = (error as any)?.response?.data?.message || (error as any)?.response?.data?.detail;

        let title = "Error Fetching Results";
        let message = backendMessage || "Failed to load student results. Please try again later.";

        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{title}</AlertTitle>
                <AlertDescription>{message}</AlertDescription>
            </Alert>
        );
    }

    // Calculations
    const totalCourses = results?.length || 0;
    const totalUnits = results?.reduce((acc: number, r: StudentResult) => acc + (r.course?.creditUnit || 0), 0) || 0;
    const passedCourses = results?.filter((r: StudentResult) => r.grade !== 'F').length || 0;
    const failedCourses = totalCourses - passedCourses;

    // Simple GPA approximation logic can be added here if needed, 
    // but without grade points (5,4,3,2,1,0), we'll stick to counts.

    const getGradeColor = (grade: string) => {
        switch (grade) {
            case 'A': return "bg-green-500/15 text-green-700 hover:bg-green-500/25 border-green-200";
            case 'B': return "bg-lime-500/15 text-lime-700 hover:bg-lime-500/25 border-lime-200";
            case 'C': return "bg-blue-500/15 text-blue-700 hover:bg-blue-500/25 border-blue-200";
            case 'D': return "bg-yellow-500/15 text-yellow-700 hover:bg-yellow-500/25 border-yellow-200";
            case 'E': return "bg-orange-500/15 text-orange-700 hover:bg-orange-500/25 border-orange-200";
            case 'F': return "bg-red-500/15 text-red-700 hover:bg-red-500/25 border-red-200";
            default: return "bg-gray-500/15 text-gray-700 hover:bg-gray-500/25 border-gray-200";
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="shadow-sm border-border/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Registered</CardTitle>
                        <BookOpen className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalCourses}</div>
                        <p className="text-xs text-muted-foreground mt-1">Courses</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-border/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Units</CardTitle>
                        <TrendingUp className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalUnits}</div>
                        <p className="text-xs text-muted-foreground mt-1">Credit Units</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-border/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Passed</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{passedCourses}</div>
                        <p className="text-xs text-muted-foreground mt-1">Courses Cleared</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-border/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Carry Over</CardTitle>
                        <XCircle className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{failedCourses}</div>
                        <p className="text-xs text-muted-foreground mt-1">Courses Outstanding</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-border/50 shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/10 border-b border-border/40 py-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground flex items-center gap-2">
                            <GraduationCap className="h-3.5 w-3.5" />
                            Academic Performance Report
                        </CardTitle>
                        <Badge variant="outline" className="text-[10px] font-mono">
                            SESSION: 2024/2025
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/5">
                            <TableRow>
                                <TableHead className="w-[100px] font-bold text-[10px] uppercase tracking-widest">Course Code</TableHead>
                                <TableHead className="font-bold text-[10px] uppercase tracking-widest">Course Title</TableHead>
                                <TableHead className="text-center w-[80px] font-bold text-[10px] uppercase tracking-widest">Unit</TableHead>
                                <TableHead className="text-center w-[80px] font-bold text-[10px] uppercase tracking-widest">CA</TableHead>
                                <TableHead className="text-center w-[80px] font-bold text-[10px] uppercase tracking-widest">Exam</TableHead>
                                <TableHead className="text-center w-[80px] font-bold text-[10px] uppercase tracking-widest">Total</TableHead>
                                <TableHead className="text-center w-[80px] font-bold text-[10px] uppercase tracking-widest">Grade</TableHead>
                                <TableHead className="text-right w-[100px] font-bold text-[10px] uppercase tracking-widest">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {results && results.length > 0 ? (
                                results.map((result: StudentResult) => (
                                    <TableRow key={result.id} className="hover:bg-muted/5">
                                        <TableCell className="font-mono font-bold text-xs text-primary">
                                            {result.course?.courseCode}
                                        </TableCell>
                                        <TableCell className="font-medium text-xs text-muted-foreground">
                                            {result.course?.title}
                                        </TableCell>
                                        <TableCell className="text-center font-mono text-xs">
                                            {result.course?.creditUnit}
                                        </TableCell>
                                        <TableCell className="text-center font-mono text-xs text-muted-foreground">
                                            {result.ca}
                                        </TableCell>
                                        <TableCell className="text-center font-mono text-xs text-muted-foreground">
                                            {result.exam}
                                        </TableCell>
                                        <TableCell className="text-center font-mono text-xs font-bold">
                                            {result.total}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="secondary" className={`${getGradeColor(result.grade)} h-6 w-8 rounded-md justify-center font-bold`}>
                                                {result.grade}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {result.grade !== 'F' ? (
                                                <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">
                                                    PASSED
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full border border-red-100">
                                                    FAILED
                                                </span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground text-xs">
                                        No results available for this student.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};
