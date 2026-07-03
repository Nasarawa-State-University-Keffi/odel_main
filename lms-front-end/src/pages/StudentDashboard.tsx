import { useEffect } from "react";
import { BookOpen, CalendarDays, ClipboardList, GraduationCap, ChevronRight, Clock } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AnimateIn } from "@/components/ui/animate-in";
import { useStudentDashboard } from "@/service/useStudentDashboard";

const StudentDashboard = () => {
    const { fetchDashboard, isPending, dashboardData } = useStudentDashboard();

    // Fetch data when the component loads
    useEffect(() => {
        fetchDashboard();
    }, []);

    // --- LOADING STATE ---
    if (isPending || !dashboardData) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-[120px] w-full rounded-2xl" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-[100px] rounded-xl" />)}
                </div>
                <Skeleton className="h-[400px] w-full rounded-2xl" />
            </div>
        );
    }

    // Extract data for easier usage
    const { user, courses, course_count, pending_quizzes, upcoming_assignments } = dashboardData;

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12">

            {/* 1. Welcome Hero Section */}
            <AnimateIn direction="up">
                <div className="relative overflow-hidden rounded-3xl bg-zinc-950 p-8 text-white shadow-lg">
                    {/* Subtle Background Gradients */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/20 blur-[100px] rounded-full pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-semibold mb-2">
                                <GraduationCap className="w-4 h-4" />
                                Level {user.level} Student
                            </div>
                            <h1 className="text-3xl md:text-4xl font-heading font-bold tracking-tight">
                                Welcome back, {user.full_name.split(' ')[0]}! 👋
                            </h1>
                            <p className="text-zinc-400 max-w-lg">
                                You have {upcoming_assignments?.length || 0} assignments due this week and {course_count} active courses. Let's make today productive.
                            </p>
                        </div>

                        <div className="shrink-0">
                            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl h-11 px-6 font-semibold shadow-lg shadow-emerald-500/20 transition-all">
                                View Schedule
                                <CalendarDays className="ml-2 w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </AnimateIn>

            {/* 2. Quick Stats Grid */}
            <AnimateIn delay={0.1} direction="up" className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Stat Card 1 */}
                <Card className="border-zinc-200/50 shadow-sm rounded-2xl">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-zinc-500">Enrolled Courses</p>
                            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">{course_count}</h3>
                        </div>
                    </CardContent>
                </Card>

                {/* Stat Card 2 */}
                <Card className="border-zinc-200/50 shadow-sm rounded-2xl">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-2xl">
                            <ClipboardList className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-zinc-500">Pending Assignments</p>
                            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">{upcoming_assignments?.length || 0}</h3>
                        </div>
                    </CardContent>
                </Card>

                {/* Stat Card 3 */}
                <Card className="border-zinc-200/50 shadow-sm rounded-2xl">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-2xl">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-zinc-500">Active Quizzes</p>
                            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">{pending_quizzes?.length || 0}</h3>
                        </div>
                    </CardContent>
                </Card>
            </AnimateIn>

            {/* 3. Main Content Area  */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Course Grid */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">Current Semester Courses</h2>
                        <Button variant="ghost" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                            View All <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>

                    <AnimateIn delay={0.2} direction="up" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {courses.map((course) => (
                            <Card key={course.id} className="group hover:border-emerald-500/50 hover:shadow-md transition-all duration-300 rounded-2xl overflow-hidden cursor-pointer flex flex-col">
                                <CardHeader className="p-5 pb-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <Badge variant="secondary" className="bg-zinc-100 text-zinc-700 font-bold uppercase tracking-wider text-xs">
                                            {course.course_code}
                                        </Badge>
                                    </div>
                                    <CardTitle className="text-base leading-tight group-hover:text-emerald-600 transition-colors">
                                        {course.course_title}
                                    </CardTitle>
                                </CardHeader>
                                <CardFooter className="p-5 pt-0 mt-auto border-t border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/20 flex flex-col gap-3">
                                    {/* Faux Progress Bar for visual flair */}
                                    <div className="w-full space-y-1">
                                        <div className="flex justify-between text-xs text-zinc-500 font-medium">
                                            <span>Course Progress</span>
                                            <span>0%</span>
                                        </div>
                                        <Progress value={0} className="h-1.5" />
                                    </div>
                                </CardFooter>
                            </Card>
                        ))}
                    </AnimateIn>
                </div>

                {/*  Mini Agenda */}
                <AnimateIn delay={0.3} direction="left" className="space-y-6">
                    <Card className="rounded-2xl border-zinc-200/50 shadow-sm sticky top-24">
                        <CardHeader className="border-b border-zinc-100 dark:border-zinc-800/50 pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <CalendarDays className="w-5 h-5 text-emerald-500" />
                                Upcoming Deadlines
                            </CardTitle>
                            <CardDescription>Stay on top of your schedule</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            {upcoming_assignments?.length === 0 && pending_quizzes?.length === 0 ? (
                                <div className="p-8 text-center text-sm text-zinc-500 flex flex-col items-center gap-2">
                                    <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mb-2">
                                        <ClipboardList className="w-6 h-6 text-zinc-400" />
                                    </div>
                                    <p>You're all caught up!</p>
                                    <p className="text-xs">No pending assignments or quizzes.</p>
                                </div>
                            ) : (
                                <div className="p-4">
                                    {/*  populate this whn we get assignment data */}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </AnimateIn>

            </div>
        </div>
    );
};

export default StudentDashboard;