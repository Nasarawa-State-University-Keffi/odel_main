import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft, Edit, Loader2, Clock, Calendar,
    Settings2, FileText, AlertCircle, Plus,
    BrainCircuit, CheckCircle2, XCircle, LayoutList
} from "lucide-react";
import { useStaffQuiz } from "@/service/useStaffQuiz";
import { AnimateIn } from "@/components/ui/animate-in";
import type { Quiz } from "@/types/quiz.types";

const ViewQuizPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { fetchQuizById } = useStaffQuiz();

    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        setIsLoading(true);
        fetchQuizById(id)
            .then((data) => {
                setQuiz(data);
                setError(null);
            })
            .catch((err) => {
                setError(typeof err === "string" ? err : "Failed to load quiz details.");
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [id]);

    const formatReadableDate = (isoString: string) => {
        return new Date(isoString).toLocaleString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getQuizStatus = () => {
        if (!quiz) return { label: "Unknown", color: "bg-zinc-100 text-zinc-600" };

        const now = new Date();
        const openTime = new Date(quiz.time_open);
        const closeTime = new Date(quiz.time_close);

        if (now < openTime) {
            return { label: "Scheduled", color: "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20" };
        } else if (now >= openTime && now <= closeTime) {
            return { label: "Active", color: "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" };
        } else {
            return { label: "Closed", color: "bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20" };
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-emerald-500">
                <Loader2 size={36} className="animate-spin mb-4" />
                <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Loading quiz details...</p>
            </div>
        );
    }

    if (error || !quiz) {
        return (
            <main className="w-full max-w-4xl mx-auto px-4 py-12">
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 p-6 rounded-2xl text-center">
                    <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-red-800 dark:text-red-300">Error Loading Quiz</h3>
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1 mb-6">{error}</p>
                    <button onClick={() => navigate("/staff/dashboard/quizzes")} className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-sm font-semibold">
                        Back to Quizzes
                    </button>
                </div>
            </main>
        );
    }

    const status = getQuizStatus();

    return (
        <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">

            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-4">
                    <button
                        onClick={() => navigate("/staff/dashboard/quizzes")}
                        className="mt-1 sm:mt-0 p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <div className="flex flex-wrap items-center gap-3 mb-1">
                            <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
                                {quiz.name}
                            </h1>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${status.color}`}>
                                {status.label}
                            </span>
                        </div>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            Course ID: <span className="font-medium text-zinc-700 dark:text-zinc-300">{quiz.course_external_id}</span>
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => navigate(`/staff/dashboard/quizzes/${quiz.id}/edit`)}
                    className="flex items-center justify-center gap-2 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm w-full sm:w-auto"
                >
                    <Edit size={16} />
                    <span>Edit Settings</span>
                </button>
            </div>

            {/* Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Main Content (Left Col) */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    {/* General Details Card */}
                    <AnimateIn direction="up" className="bg-white dark:bg-zinc-950 p-6 sm:p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 shadow-sm flex flex-col h-full">
                        <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-semibold text-lg border-b border-zinc-100 dark:border-zinc-800 pb-4 mb-4">
                            <FileText size={20} className="text-emerald-500" />
                            <h2>Description & Instructions</h2>
                        </div>
                        <div className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap">
                            {quiz.description || <span className="italic text-zinc-400">No description provided.</span>}
                        </div>
                    </AnimateIn>

                    {/* Manage Questions Section */}
                    <AnimateIn direction="up" delay={0.1} className="bg-white dark:bg-zinc-950 p-6 sm:p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 shadow-sm flex flex-col flex-1">
                        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4 mb-6">
                            <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-semibold text-lg">
                                <LayoutList size={20} className="text-emerald-500" />
                                <h2>Quiz Questions</h2>
                                <span className="ml-2 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 py-0.5 px-2 rounded-md text-xs font-bold">
                                    {quiz.questions_count}
                                </span>
                            </div>
                            <button className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors">
                                <Plus size={16} /> Add Question
                            </button>
                        </div>

                        {/* Questions Empty State */}
                        <div className="flex flex-col items-center justify-center py-10 text-center flex-1 border-2 border-dashed border-zinc-100 dark:border-zinc-800/60 rounded-xl">
                            <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                                <BrainCircuit size={28} />
                            </div>
                            <h3 className="text-base font-semibold text-zinc-900 dark:text-white mb-1">No questions yet</h3>
                            <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-xs mb-6">
                                Get started by adding multiple choice, true/false, or written questions to this quiz.
                            </p>
                            <button onClick={() => navigate(`/staff/dashboard/quizzes/questions/create/${quiz.id}`)} className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm">
                                <Plus size={16} />
                                Create First Question
                            </button>
                        </div>
                    </AnimateIn>
                </div>

                {/* Sidebar (Right Col) */}
                <div className="flex flex-col gap-6">

                    {/* Timing Card */}
                    <AnimateIn direction="up" delay={0.15} className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 shadow-sm">
                        <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-semibold text-base border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-4">
                            <Calendar size={18} className="text-emerald-500" />
                            <h2>Schedule & Duration</h2>
                        </div>

                        <div className="flex flex-col gap-4">
                            <div>
                                <span className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Opens</span>
                                <span className="text-sm text-zinc-900 dark:text-zinc-100 font-medium">
                                    {formatReadableDate(quiz.time_open)}
                                </span>
                            </div>
                            <div>
                                <span className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Closes</span>
                                <span className="text-sm text-zinc-900 dark:text-zinc-100 font-medium">
                                    {formatReadableDate(quiz.time_close)}
                                </span>
                            </div>
                            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
                                <Clock size={16} className="text-zinc-400" />
                                <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                                    {quiz.time_limit} Minutes Limit
                                </span>
                            </div>
                        </div>
                    </AnimateIn>

                    {/* Rules Card */}
                    <AnimateIn direction="up" delay={0.2} className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 shadow-sm">
                        <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-semibold text-base border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-4">
                            <Settings2 size={18} className="text-emerald-500" />
                            <h2>Grading & Rules</h2>
                        </div>

                        <div className="flex flex-col gap-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-zinc-600 dark:text-zinc-400">Max Grade</span>
                                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{quiz.max_grade}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-zinc-600 dark:text-zinc-400">Allowed Attempts</span>
                                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{quiz.max_attempts}</span>
                            </div>

                            <hr className="border-zinc-100 dark:border-zinc-800 my-1" />

                            <div className="flex justify-between items-center">
                                <span className="text-sm text-zinc-600 dark:text-zinc-400">Shuffle Questions</span>
                                {quiz.shuffle_questions ? (
                                    <CheckCircle2 size={18} className="text-emerald-500" />
                                ) : (
                                    <XCircle size={18} className="text-zinc-400" />
                                )}
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-zinc-600 dark:text-zinc-400">Show Feedback</span>
                                {quiz.show_feedback ? (
                                    <CheckCircle2 size={18} className="text-emerald-500" />
                                ) : (
                                    <XCircle size={18} className="text-zinc-400" />
                                )}
                            </div>
                        </div>
                    </AnimateIn>

                </div>
            </div>
        </main>
    );
};

export default ViewQuizPage;