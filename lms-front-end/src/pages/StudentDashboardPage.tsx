import { useEffect, useMemo } from "react";
import {
    BookOpen, CalendarDays, ClipboardList, GraduationCap,
    ChevronRight, Clock, FileText, AlertCircle
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AnimateIn } from "@/components/ui/animate-in";
import { useStudentDashboard } from "@/service/useStudentDashboard";
import { useAcademicSetup } from "@/service/useAcademicSetup";

// Helper to format ISO dates into readable strings (e.g., "Aug 1, 4:10 PM")
const formatDeadline = (dateString: string) => {
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    }).format(new Date(dateString));
};

const StudentOverviewPage = () => {
    const { fetchDashboardData, isPending, dashboardData } = useStudentDashboard();
    const { fetchSemester, fetchSession } = useAcademicSetup();

    // Fetch data when the component loads
    useEffect(() => {
        const initializeDashboard = async () => {
            fetchSemester();
            fetchSession();
            fetchDashboardData();
        };

        initializeDashboard();
    }, []);

    const agendaItems = useMemo(() => {
        if (!dashboardData) return [];

        const assignments = (dashboardData.upcoming_assignments || []).map((a: any) => ({
            id: a.id,
            title: a.title,
            date: new Date(a.due_at),
            rawDate: a.due_at,
            type: "assignment" as const,
        }));

        const quizzes = (dashboardData.pending_quizzes || []).map((q: any) => ({
            id: q.id,
            title: q.name, // Quizzes use 'name' instead of 'title'
            date: new Date(q.time_close),
            rawDate: q.time_close,
            type: "quiz" as const,
        }));

        // Combine and sort chronologically by closest deadline
        return [...assignments, ...quizzes].sort((a, b) => a.date.getTime() - b.date.getTime());
    }, [dashboardData]);

    // --- LOADING STATE ---
    if (isPending || !dashboardData) {
        return (
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                <Skeleton className="h-[160px] md:h-[120px] w-full rounded-3xl" />
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-[100px] rounded-2xl" />)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-4">
                        <Skeleton className="h-[40px] w-1/3 rounded-lg" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[1, 2].map((i) => <Skeleton key={i} className="h-[140px] rounded-2xl" />)}
                        </div>
                    </div>
                    <Skeleton className="h-[400px] w-full rounded-2xl" />
                </div>
            </div>
        );
    }

    // Extract data with safe fallbacks
    const {
        user,
        courses = [],
        course_count = 0,
        pending_quizzes = [],
        upcoming_assignments = []
    } = dashboardData;

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-12">

            {/* 1. Welcome Hero Section */}
            <AnimateIn direction="up">
                <div className="relative overflow-hidden rounded-3xl bg-zinc-950 p-6 sm:p-8 text-white shadow-lg">
                    {/* Subtle Background Gradients */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/20 blur-[100px] rounded-full pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-3">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                                <GraduationCap className="w-4 h-4" />
                                {user?.level ? `Level ${user.level} Student` : "Active Undergraduate"}
                            </div>
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold tracking-tight">
                                Welcome back, {user?.full_name?.split(' ')[0] || "Student"}! 👋
                            </h1>
                            <p className="text-sm sm:text-base text-zinc-400 max-w-lg leading-relaxed">
                                You have {upcoming_assignments.length} assignments due this week and {course_count} active courses. Let's make today productive.
                            </p>
                        </div>

                        <div className="shrink-0">
                            <Button className="w-full md:w-auto bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl h-12 px-6 font-semibold shadow-lg shadow-emerald-500/20 transition-all">
                                View Schedule
                                <CalendarDays className="ml-2 w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </AnimateIn>

            {/* 2. Quick Stats Grid */}
            <AnimateIn delay={0.1} direction="up" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {/* Stat Card 1 */}
                <Card className="border-zinc-200/50 shadow-sm rounded-2xl transition-all hover:shadow-md">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl shrink-0">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-zinc-500 line-clamp-1">Enrolled Courses</p>
                            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">{course_count}</h3>
                        </div>
                    </CardContent>
                </Card>

                {/* Stat Card 2 */}
                <Card className="border-zinc-200/50 shadow-sm rounded-2xl transition-all hover:shadow-md">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-2xl shrink-0">
                            <ClipboardList className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-zinc-500 line-clamp-1">Pending Assignments</p>
                            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">{upcoming_assignments.length}</h3>
                        </div>
                    </CardContent>
                </Card>

                {/* Stat Card 3 */}
                <Card className="border-zinc-200/50 shadow-sm rounded-2xl transition-all hover:shadow-md sm:col-span-2 md:col-span-1">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-2xl shrink-0">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-zinc-500 line-clamp-1">Active Quizzes</p>
                            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">{pending_quizzes.length}</h3>
                        </div>
                    </CardContent>
                </Card>
            </AnimateIn>

            {/* 3. Main Content Area  */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Course Grid */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                            Current Semester Courses
                        </h2>
                        <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 text-xs sm:text-sm">
                            View All <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>

                    {courses.length === 0 ? (
                        <div className="p-12 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl flex flex-col items-center justify-center text-center gap-3 bg-zinc-50/50 dark:bg-zinc-900/20">
                            <BookOpen className="w-8 h-8 text-zinc-400" />
                            <p className="text-zinc-500 text-sm font-medium">No courses registered for this semester yet.</p>
                        </div>
                    ) : (
                        <AnimateIn
                            delay={0.2}
                            direction="up"
                            className={`grid grid-cols-1 ${courses.length > 1 ? 'sm:grid-cols-2' : ''} gap-4 sm:gap-6`}
                        >
                            {courses.map((course: any, idx: number) => (
                                <Card key={course.course_external_id || idx} className="group hover:border-emerald-500/50 hover:shadow-md transition-all duration-300 rounded-2xl overflow-hidden cursor-pointer flex flex-col h-full bg-white dark:bg-zinc-950">
                                    <CardHeader className="p-5 pb-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <Badge variant="secondary" className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold uppercase tracking-wider text-[10px] px-2.5 py-0.5">
                                                {course.course_code}
                                            </Badge>
                                        </div>
                                        <CardTitle className="text-base leading-snug group-hover:text-emerald-600 transition-colors line-clamp-2">
                                            {course.course_title}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardFooter className="p-5 pt-0 mt-auto border-t border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/20 flex flex-col gap-3">
                                        {/* Faux Progress Bar for visual flair */}
                                        <div className="w-full space-y-1.5 mt-3">
                                            <div className="flex justify-between text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">
                                                <span>Progress</span>
                                                <span>0%</span>
                                            </div>
                                            <Progress value={0} className="h-1.5 bg-zinc-200 dark:bg-zinc-800" />
                                        </div>
                                    </CardFooter>
                                </Card>
                            ))}
                        </AnimateIn>
                    )}
                </div>

                {/*  Mini Agenda Sidebar */}
                <AnimateIn delay={0.3} direction="left" className="space-y-6">
                    <Card className="rounded-2xl border-zinc-200/50 shadow-sm sticky top-6 overflow-hidden bg-white dark:bg-zinc-950">
                        <CardHeader className="border-b border-zinc-100 dark:border-zinc-800/80 pb-4 bg-zinc-50/50 dark:bg-zinc-900/20">
                            <CardTitle className="text-base font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
                                <CalendarDays className="w-5 h-5 text-emerald-500" />
                                Upcoming Deadlines
                            </CardTitle>
                            <CardDescription className="text-xs">Prioritize your schedule</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            {agendaItems.length === 0 ? (
                                <div className="p-10 text-center text-sm text-zinc-500 flex flex-col items-center gap-3">
                                    <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                                        <ClipboardList className="w-6 h-6 text-emerald-500" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-zinc-700 dark:text-zinc-300">You're all caught up!</p>
                                        <p className="text-xs mt-1 text-zinc-400">No pending assignments or quizzes at the moment.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800/80 max-h-[450px] overflow-y-auto">
                                    {agendaItems.map((item) => (
                                        <div key={item.id} className="p-4 sm:p-5 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors flex gap-4 items-start cursor-pointer group">

                                            {/* Icon Indicator */}
                                            <div className={`mt-0.5 shrink-0 w-9 h-9 rounded-full flex items-center justify-center border ${item.type === 'quiz'
                                                    ? 'bg-rose-50 border-rose-100 text-rose-500 dark:bg-rose-500/10 dark:border-rose-500/20'
                                                    : 'bg-amber-50 border-amber-100 text-amber-500 dark:bg-amber-500/10 dark:border-amber-500/20'
                                                }`}>
                                                {item.type === 'quiz' ? <AlertCircle className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                                            </div>

                                            {/* Details */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${item.type === 'quiz' ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'
                                                        }`}>
                                                        {item.type}
                                                    </span>
                                                </div>
                                                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-emerald-600 transition-colors">
                                                    {item.title}
                                                </p>
                                                <div className="flex items-center gap-1.5 mt-1.5 text-xs font-medium text-zinc-500">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {formatDeadline(item.rawDate)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                        {agendaItems.length > 0 && (
                            <CardFooter className="p-3 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/20">
                                <Button variant="ghost" className="w-full text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                                    View Full Calendar
                                </Button>
                            </CardFooter>
                        )}
                    </Card>
                </AnimateIn>

            </div>
        </div>
    );
};

export default StudentOverviewPage;