// pages/StudentAssignmentDetailPage.tsx
import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useStudentAssignmentDetail } from "@/service/useStudentAssignmentDetail";
import { AnimateIn } from "@/components/ui/animate-in";
import {
    ChevronLeft,
    CalendarDays,
    Clock,
    AlertCircle,
    FileText,
    Download,
    Award,
    Info,
    CheckCircle2,
    UploadCloud
} from "lucide-react";
import { AssignmentDetailSkeleton } from "@/components/student/AssignmentDetailSkeleton";

export const StudentAssignmentDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: assignment, isLoading, error, fetchAssignmentDetail } = useStudentAssignmentDetail(id);

    useEffect(() => {
        fetchAssignmentDetail();
    }, [fetchAssignmentDetail]);

    // Format Date Helper
    const formatDate = (isoString: string) => {
        return new Date(isoString).toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Status Helper
    const getStatus = (dueAt: string, closeAt: string) => {
        const now = new Date();
        const dueDate = new Date(dueAt);
        const closeDate = new Date(closeAt);

        if (now > closeDate) return { label: "Closed", color: "bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20", closed: true };
        if (now > dueDate) return { label: "Late Window", color: "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20", closed: false };
        return { label: "Open", color: "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20", closed: false };
    };

    if (isLoading) {
        return (
            <div className="min-h-screen w-full bg-slate-50/50 dark:bg-slate-950 px-4 py-8 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-6xl"><AssignmentDetailSkeleton /></div>
            </div>
        );
    }

    if (error || !assignment) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Failed to load assignment</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md">{error}</p>
                <button onClick={() => navigate(-1)} className="rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-6 py-2.5 font-semibold text-sm">
                    Go Back
                </button>
            </div>
        );
    }

    const status = getStatus(assignment.due_at, assignment.close_at);

    return (
        <div className="min-h-screen w-full bg-slate-50/50 dark:bg-slate-950 px-4 py-8 sm:px-6 lg:px-8 transition-colors duration-200">
            <div className="mx-auto max-w-6xl space-y-6">

                {/* HEADER / NAVIGATION */}
                <AnimateIn direction="down" delay={0.1}>
                    <button 
                        onClick={() => navigate(-1)} 
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors mb-4"
                    >
                        <ChevronLeft className="h-4 w-4" /> Back to Assignments
                    </button>
                    
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-sm">
                                    {assignment.course.course_code}
                                </span>
                                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold border ${status.color}`}>
                                    {status.label}
                                </span>
                            </div>
                            <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-slate-50 lg:text-4xl">
                                {assignment.title}
                            </h1>
                            <p className="text-base text-slate-500 dark:text-slate-400 mt-2 font-medium">
                                {assignment.course.course_title}
                            </p>
                        </div>
                    </div>
                </AnimateIn>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
                    
                    {/* LEFT COLUMN: DESCRIPTION & FILES */}
                    <div className="lg:col-span-2 space-y-6">
                        <AnimateIn direction="up" delay={0.2}>
                            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-emerald-500" /> Instructions
                                </h3>
                                <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
                                    {assignment.description}
                                </div>
                            </div>
                        </AnimateIn>

                        {/* ATTACHED FILES */}
                        {assignment.content_files && assignment.content_files.length > 0 && (
                            <AnimateIn direction="up" delay={0.3}>
                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider ml-1">
                                        Attached Resources
                                    </h3>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {assignment.content_files.map((file) => (
                                            <a 
                                                key={file.id} 
                                                href={file.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="group flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-500/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-500/10 transition-all shadow-sm"
                                            >
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                                        <FileText className="h-5 w-5" />
                                                    </div>
                                                    <div className="truncate">
                                                        <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                                                            {file.title || "Attached File"}
                                                        </p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                                                            {file.content_type || "Document"}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Download className="h-4 w-4 text-slate-400 group-hover:text-emerald-500 shrink-0 ml-3" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            </AnimateIn>
                        )}
                    </div>

                    {/* RIGHT COLUMN: SIDEBAR METADATA */}
                    <div className="space-y-6">
                        <AnimateIn direction="left" delay={0.3}>
                            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6">
                                
                                {/* Timeline */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                                        Timeline
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3 text-sm">
                                            <CalendarDays className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                                            <div>
                                                <p className="font-semibold text-slate-700 dark:text-slate-300">Available From</p>
                                                <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">{formatDate(assignment.open_at)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 text-sm">
                                            <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                                            <div>
                                                <p className="font-semibold text-slate-700 dark:text-slate-300">Due Date</p>
                                                <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">{formatDate(assignment.due_at)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 text-sm">
                                            <Clock className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                                            <div>
                                                <p className="font-semibold text-slate-700 dark:text-slate-300">Closes On</p>
                                                <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">{formatDate(assignment.close_at)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="h-px w-full bg-slate-100 dark:bg-slate-800" />

                                {/* Grading & Rules */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                                        Rules & Grading
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="rounded-xl bg-slate-50 dark:bg-slate-950/50 p-3 border border-slate-100 dark:border-slate-800">
                                            <Award className="h-4 w-4 text-emerald-500 mb-1.5" />
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Points</p>
                                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{parseFloat(assignment.max_marks)}</p>
                                        </div>
                                        <div className="rounded-xl bg-slate-50 dark:bg-slate-950/50 p-3 border border-slate-100 dark:border-slate-800">
                                            <Info className="h-4 w-4 text-blue-500 mb-1.5" />
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Attempts</p>
                                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{assignment.max_attempts}</p>
                                        </div>
                                    </div>
                                    {assignment.allow_late_submission && (
                                        <div className="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 p-2.5 text-xs text-amber-700 dark:text-amber-400 font-medium border border-amber-200/50 dark:border-amber-900/50">
                                            <CheckCircle2 className="h-3.5 w-3.5" /> Late submissions allowed
                                        </div>
                                    )}
                                </div>
                            </div>
                        </AnimateIn>

                        {/* CTA ACTION */}
                        <AnimateIn direction="up" delay={0.4}>
                            <button 
                                disabled={status.closed}
                                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white py-4 font-bold text-sm transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:bg-slate-400 dark:disabled:bg-slate-700"
                            >
                                {status.closed ? (
                                    <>Assignment Closed</>
                                ) : (
                                    <>
                                        <UploadCloud className="h-5 w-5" /> Start Submission
                                    </>
                                )}
                            </button>
                        </AnimateIn>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentAssignmentDetailPage;