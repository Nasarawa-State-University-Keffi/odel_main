import { useEffect, useState, useRef } from "react";
import { BookOpen, Search, Filter, ChevronLeft, ChevronRight, Clock, Building2 } from "lucide-react";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimateIn } from "@/components/ui/animate-in";
import { useCourse } from "@/service/useCourse";
import { Link, useNavigate } from "react-router-dom";

const Courses = () => {
    const { fetchCourses, isPending, coursesData } = useCourse();
    const [searchTerm, setSearchTerm] = useState("");
    const navigate = useNavigate()

    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // 1. Initial Load
    useEffect(() => {
        fetchCourses();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 2. The Debounced Search Effect
    useEffect(() => {
        if (searchTerm === "") {
            fetchCourses();
            return;
        }

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }


        typingTimeoutRef.current = setTimeout(() => {
            fetchCourses({ search: searchTerm });
        }, 500);

        // Cleanup function
        return () => {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        };
    }, [searchTerm]);


    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
    };

    // --- LOADING STATE ---
    if (isPending && !coursesData) {
        return (
            <div className="space-y-8 max-w-7xl mx-auto pb-12">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-10 w-64 rounded-xl" />
                    <Skeleton className="h-10 w-24 rounded-xl" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-[220px] rounded-2xl" />)}
                </div>
            </div>
        );
    }

    const displayCourses = coursesData?.results || [];

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12">

            {/* 1. Page Header & Search */}
            <AnimateIn direction="down" className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div>
                    <h1 className="text-3xl font-heading font-bold tracking-tight text-zinc-900 dark:text-white">
                        Course Catalog
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">
                        Browse and manage your {coursesData?.count || 0} registered courses.
                    </p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-zinc-400" />
                        <Input
                            placeholder="Search by code or title..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 h-11 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl focus-visible:ring-emerald-500 shadow-sm"
                        />
                    </div>
                    <Button variant="outline" className="h-11 px-4 rounded-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                        <Filter className="w-4 h-4 mr-2" />
                        Filter
                    </Button>
                </div>
            </AnimateIn>

            {/* 2. Course Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayCourses.map((course, index) => (
                    <AnimateIn key={course.course_external_id} delay={index * 0.05} direction="up">
                        <Card className="group flex flex-col h-full hover:border-emerald-500/50 hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden cursor-pointer bg-white dark:bg-zinc-950 border-zinc-200/60 dark:border-zinc-800/60">

                            <CardHeader className="p-6 pb-4 flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 font-bold uppercase tracking-wider text-xs px-3 py-1 rounded-lg transition-colors">
                                        {course.course_code}
                                    </Badge>
                                    <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-500 group-hover:bg-emerald-50 group-hover:text-white transition-colors duration-300">
                                        <BookOpen className="w-4 h-4" />
                                    </div>
                                </div>

                                <CardTitle className="text-xl font-semibold leading-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
                                    {course.course_title}
                                </CardTitle>
                            </CardHeader>

                            <CardContent className="px-6 py-0">
                                <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 mb-2">
                                    <Building2 className="w-4 h-4 opacity-70" />
                                    <span className="truncate">{course.department_name}</span>
                                </div>
                            </CardContent>

                            <CardFooter className="p-6 pt-5 mt-auto border-t border-zinc-100 dark:border-zinc-900/50 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/20 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/20 transition-colors">
                                <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 dark:text-zinc-500">
                                    <Clock className="w-3.5 h-3.5" />
                                    Updated {formatDate(course.updated_at)}
                                </div>
                                <Link to={`/application/courses/${course.course_external_id}`} className="text-sm font-semibold text-emerald-600 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 flex items-center">
                                    View Materials <ChevronRight className="w-4 h-4 ml-1" />
                                </Link>
                            </CardFooter>
                        </Card>
                    </AnimateIn>
                ))}
            </div>

            {/* 3. Empty State (*/}
            {!isPending && displayCourses.length === 0 && (
                <div className="py-20 text-center flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mb-4">
                        <Search className="w-8 h-8 text-zinc-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">No courses found</h3>
                    <p className="text-zinc-500 max-w-sm mt-1">We couldn't find any courses matching "{searchTerm}".</p>
                </div>
            )}

            {/* 4. Pagination Footer */}
            {coursesData && (coursesData.next || coursesData.previous) && (
                <AnimateIn direction="up" delay={0.4} className="flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800 pt-6 mt-8">
                    <p className="text-sm text-zinc-500 font-medium">
                        Showing page results...
                    </p>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            className="rounded-xl border-zinc-200 dark:border-zinc-800"
                            disabled={!coursesData.previous || isPending}
                            onClick={() => coursesData.previous && fetchCourses({ url: coursesData.previous })}
                        >
                            <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                        </Button>

                        <Button
                            variant="outline"
                            className="rounded-xl border-zinc-200 dark:border-zinc-800"
                            disabled={!coursesData.next || isPending}
                            onClick={() => coursesData.next && fetchCourses({ url: coursesData.next })}
                        >
                            Next <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                </AnimateIn>
            )}

        </div>
    );
};

export default Courses;