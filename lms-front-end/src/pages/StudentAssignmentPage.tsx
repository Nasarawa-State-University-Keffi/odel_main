import { useEffect, useState } from "react";
import { useStudentAssignment } from "@/service/useStudentAssignment";
import { useAcademicSetup } from "@/service/useAcademicSetup";
import { AnimateIn } from "@/components/ui/animate-in";
import {
    BookOpen,
    Calendar,
    Clock,
    FileText,
    Search,
    ChevronLeft,
    ChevronRight,
    Award,
    AlertCircle,
    CheckCircle2,
    RotateCcw
} from "lucide-react";
import { AssignmentsSkeleton } from "@/components/student/AssignmentsSkeleton";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const StudentAssignmentsPage = () => {
    const { data, isLoading, error, currentPage, fetchAssignment } = useStudentAssignment();
    const { fetchSemester, fetchSession, semester, session, isPending: isAcademicPending } = useAcademicSetup();

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedSession, setSelectedSession] = useState("");
    const [selectedSemester, setSelectedSemester] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        fetchSession();
        fetchSemester();
    }, [fetchSession]);

    useEffect(() => {
        fetchAssignment({
            page: 1,
            search: searchTerm,
            session: selectedSession,
            semester: selectedSemester
        });
    }, [selectedSession, selectedSemester]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchAssignment({
            page: 1,
            search: searchTerm,
            session: selectedSession,
            semester: selectedSemester
        });
    };

    const handlePageChange = (newPage: number) => {
        fetchAssignment({
            page: newPage,
            search: searchTerm,
            session: selectedSession,
            semester: selectedSemester
        });
    };

    const getAssignmentStatus = (dueAt: string, closeAt: string) => {
        const now = new Date();
        const dueDate = new Date(dueAt);
        const closeDate = new Date(closeAt);

        if (now > closeDate) {
            return { label: "Closed", color: "bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20" };
        }
        if (now > dueDate) {
            return { label: "Late Window", color: "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20" };
        }
        return { label: "Open", color: "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" };
    };

    const totalResults = data?.count || 0;
    const pageSize = 10;
    const totalPages = Math.ceil(totalResults / pageSize) || 1;

    return (
        <div className="min-h-screen w-full bg-slate-50/50 dark:bg-slate-950 px-4 py-8 sm:px-6 lg:px-8 transition-colors duration-200">
            <div className="mx-auto max-w-6xl space-y-6">

                <AnimateIn direction="down" delay={0.1}>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h1 className="font-heading text-2xl font-bold text-slate-900 dark:text-slate-50 sm:text-3xl">
                                Academic Assignments
                            </h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                Review pending coursework, track deadlines, and submit your work.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                            <Select value={selectedSession} onValueChange={(value: string | null) => setSelectedSession(value || "")}>
                                <SelectTrigger className="w-full sm:w-40 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                    <SelectValue placeholder="Session" />
                                </SelectTrigger>
                                <SelectContent>
                                    {(session as any)?.results?.map((s: any) => (
                                        <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={selectedSemester} onValueChange={(value: string | null) => setSelectedSemester(value || "")}>
                                <SelectTrigger className="w-full sm:w-40 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                    <SelectValue placeholder="Semester" />
                                </SelectTrigger>
                                <SelectContent>
                                    {(semester as any)?.results?.map((s: any) => (
                                        <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <form onSubmit={handleSearch} className="relative w-full sm:w-64">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search title..."
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
                                />
                            </form>
                        </div>
                    </div>
                </AnimateIn>

                {error && (
                    <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-4 text-red-600 dark:text-red-400 flex items-center justify-between">
                        <div className="flex items-center gap-3 text-sm font-medium">
                            <AlertCircle className="h-5 w-5 shrink-0" />
                            <span>{error}</span>
                        </div>
                        <button
                            onClick={() => fetchAssignment({ page: currentPage, search: searchTerm, session: selectedSession, semester: selectedSemester })}
                            className="inline-flex items-center gap-1 text-xs font-bold underline hover:opacity-80"
                        >
                            <RotateCcw className="h-3.5 w-3.5" /> Retry
                        </button>
                    </div>
                )}

                {isLoading ? (
                    <AssignmentsSkeleton />
                ) : data?.results && data.results.length > 0 ? (
                    <div className="grid gap-5 md:grid-cols-2">
                        {data.results.map((assignment, index) => {
                            const status = getAssignmentStatus(assignment.due_at, assignment.close_at);
                            const dueDateFormatted = new Date(assignment.due_at).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                            });

                            return (
                                <AnimateIn key={assignment.id} direction="up" delay={0.05 * index}>
                                    <div className="group flex flex-col justify-between h-full rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-md transition-all duration-200">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                                                    <BookOpen className="h-3.5 w-3.5 text-emerald-500" />
                                                    {assignment.course.course_code}
                                                </span>

                                                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold border ${status.color}`}>
                                                    {status.label}
                                                </span>
                                            </div>

                                            <div>
                                                <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                                    {assignment.title}
                                                </h3>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                                                    {assignment.course.course_title}
                                                </p>
                                                <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mt-2 leading-relaxed">
                                                    {assignment.description}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-4">
                                            <div className="grid grid-cols-3 gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                                    <span className="truncate">{dueDateFormatted}</span>
                                                </div>

                                                <div className="flex items-center gap-1.5 justify-center">
                                                    <Award className="h-3.5 w-3.5 text-amber-500" />
                                                    <span>{parseFloat(assignment.max_marks)} pts</span>
                                                </div>

                                                <div className="flex items-center gap-1.5 justify-end">
                                                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                                                    <span>{assignment.max_attempts} {assignment.max_attempts === 1 ? 'Attempt' : 'Attempts'}</span>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => {
                                                    const queryParams = new URLSearchParams();
                                                    if (selectedSession) queryParams.append("session", selectedSession);
                                                    if (selectedSemester) queryParams.append("semester", selectedSemester);
                                                    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";
                                                    navigate(`/student/assignments/${assignment.id}${queryString}`);
                                                }}
                                                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white py-2.5 text-sm font-semibold transition-colors shadow-sm"
                                            >
                                                <FileText className="h-4 w-4" />
                                                View Assignment
                                            </button>
                                        </div>
                                    </div>
                                </AnimateIn>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 py-16 px-4 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mb-4">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">No assignments found</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
                            You are all caught up! No active assignments match your query.
                        </p>
                    </div>
                )}

                {totalResults > 0 && (
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 px-6 py-4 shadow-sm backdrop-blur-md text-xs font-medium text-slate-500 dark:text-slate-400">
                        <div>
                            Showing <strong className="text-slate-700 dark:text-slate-200">{(currentPage - 1) * pageSize + 1}</strong> to{" "}
                            <strong className="text-slate-700 dark:text-slate-200">{Math.min(currentPage * pageSize, totalResults)}</strong> of{" "}
                            <strong className="text-slate-700 dark:text-slate-200">{totalResults}</strong> assignments
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={!data?.previous || isLoading}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="h-4 w-4" /> Previous
                            </button>

                            <span className="px-2 font-bold text-slate-700 dark:text-slate-200">
                                Page {currentPage} of {totalPages}
                            </span>

                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={!data?.next || isLoading}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                Next <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentAssignmentsPage;