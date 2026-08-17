import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, CalendarDays, FileText, PlayCircle, ClipboardCheck, BookOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimateIn } from "@/components/ui/animate-in";
import { useCourse } from "@/service/useCourse";

const CourseDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { fetchCourseDetail, isPending, courseDetail } = useCourse();

    useEffect(() => {
        if (id) {
            fetchCourseDetail(id);
        }
    }, [id]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(date);
    };

    // --- LOADING STATE ---
    if (isPending || !courseDetail) {
        return (
            <div className="space-y-8 max-w-5xl mx-auto pb-12">
                <Skeleton className="h-[250px] w-full rounded-3xl" />
                <div className="space-y-4">
                    <Skeleton className="h-12 w-[400px] rounded-xl" />
                    <Skeleton className="h-[400px] w-full rounded-2xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-6xl mx-auto pb-12">

            {/* 1. Navigation & Hero Banner */}
            <AnimateIn direction="down" className="space-y-4">
                <Button
                    variant="ghost"
                    onClick={() => navigate('/courses')}
                    className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white -ml-4"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Courses
                </Button>

                <div className="relative overflow-hidden rounded-3xl bg-zinc-950 p-8 md:p-12 text-white shadow-xl border border-zinc-800">
                    {/* Subtle Background Elements */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
                    <div className="absolute bottom-0 left-10 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />

                    <div className="relative z-10 max-w-3xl space-y-4">
                        <div className="flex items-center gap-3">
                            <Badge className="bg-emerald-500 text-white hover:bg-emerald-600 font-bold uppercase tracking-wider text-sm px-3 py-1 rounded-lg">
                                {courseDetail.course_code}
                            </Badge>
                            <span className="flex items-center gap-1.5 text-sm font-medium text-zinc-400">
                                <Building2 className="w-4 h-4" />
                                {courseDetail.department_name}
                            </span>
                        </div>

                        <h1 className="text-3xl md:text-5xl font-heading font-bold tracking-tight leading-tight">
                            {courseDetail.course_title}
                        </h1>

                        <div className="flex items-center gap-2 text-sm text-zinc-400 mt-4 pt-4 border-t border-zinc-800/50 inline-flex">
                            <CalendarDays className="w-4 h-4" />
                            Last updated on {formatDate(courseDetail.updated_at)}
                        </div>
                    </div>
                </div>
            </AnimateIn>

            {/* 2. Interactive Content Tabs */}
            <AnimateIn delay={0.1} direction="up">
                <Tabs defaultValue="materials" className="w-full">

                    <TabsList className="h-14 w-full justify-start bg-transparent border-b border-zinc-200 dark:border-zinc-800 rounded-none p-0 mb-8 space-x-6 overflow-x-auto">
                        <TabsTrigger
                            value="materials"
                            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 rounded-none h-full px-2 text-base"
                        >
                            <BookOpen className="w-4 h-4 mr-2" /> Study Materials
                        </TabsTrigger>
                        <TabsTrigger
                            value="assignments"
                            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 rounded-none h-full px-2 text-base"
                        >
                            <FileText className="w-4 h-4 mr-2" /> Assignments
                        </TabsTrigger>
                        <TabsTrigger
                            value="quizzes"
                            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 rounded-none h-full px-2 text-base"
                        >
                            <ClipboardCheck className="w-4 h-4 mr-2" /> Quizzes
                        </TabsTrigger>
                    </TabsList>

                    {/* TAB 1: Study Materials (PDFs, Videos) */}
                    <TabsContent value="materials" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Placeholder for actual content we will fetch later */}
                            <Card className="border-zinc-200/50 shadow-sm rounded-2xl hover:border-emerald-500/30 transition-all cursor-pointer group">
                                <CardHeader className="p-5 pb-4">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <CardTitle className="text-lg">Week 1: Introduction</CardTitle>
                                    <CardDescription>PDF Document • 2.4 MB</CardDescription>
                                </CardHeader>
                            </Card>

                            <Card className="border-zinc-200/50 shadow-sm rounded-2xl hover:border-emerald-500/30 transition-all cursor-pointer group">
                                <CardHeader className="p-5 pb-4">
                                    <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <PlayCircle className="w-5 h-5" />
                                    </div>
                                    <CardTitle className="text-lg">Lecture Video Recording</CardTitle>
                                    <CardDescription>Video • 45 mins</CardDescription>
                                </CardHeader>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* TAB 2: Assignments */}
                    <TabsContent value="assignments" className="focus-visible:outline-none focus-visible:ring-0">
                        <Card className="border-zinc-200/50 shadow-sm rounded-2xl">
                            <CardContent className="p-12 text-center flex flex-col items-center">
                                <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mb-4">
                                    <FileText className="w-8 h-8 text-zinc-400" />
                                </div>
                                <h3 className="text-xl font-semibold">No active assignments</h3>
                                <p className="text-zinc-500 mt-2">You're all caught up for this course.</p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* TAB 3: Quizzes */}
                    <TabsContent value="quizzes" className="focus-visible:outline-none focus-visible:ring-0">
                        <Card className="border-zinc-200/50 shadow-sm rounded-2xl">
                            <CardContent className="p-12 text-center flex flex-col items-center">
                                <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mb-4">
                                    <ClipboardCheck className="w-8 h-8 text-zinc-400" />
                                </div>
                                <h3 className="text-xl font-semibold">No pending quizzes</h3>
                                <p className="text-zinc-500 mt-2">Check back later for upcoming assessments.</p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                </Tabs>
            </AnimateIn>

        </div>
    );
};

export default CourseDetail;