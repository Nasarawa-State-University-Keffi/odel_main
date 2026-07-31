import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft, Edit, Loader2, Clock, Calendar,
    Settings2, FileText, AlertCircle, Plus,
    BrainCircuit, CheckCircle2, XCircle, LayoutList, Hash, Award
} from "lucide-react";
import { useStaffQuiz } from "@/service/useStaffQuiz";
import { AnimateIn } from "@/components/ui/animate-in";
import type { Quiz, QuizQuestionSlot } from "@/types/quiz.types";

const ViewStaffQuizQuestionPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { fetchQuizById } = useStaffQuiz();

    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [questions, setQuestions] = useState<QuizQuestionSlot[]>([]);
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

    const handleQuestionAdded = (newSlot: QuizQuestionSlot) => {
        setQuestions((prev) => [...prev, newSlot].sort((a, b) => a.order - b.order));
        if (quiz) {
            setQuiz({
                ...quiz,
                questions_count: (quiz.questions_count || 0) + 1
            });
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

    return (
        <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-4">
                    <button
                        onClick={() => navigate("/staff/dashboard/quizzes")}
                        className="mt-1 sm:mt-0 p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
                            {quiz.name}
                        </h1>
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

                {/* Main Content */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    {/* General Details */}
                    <AnimateIn direction="up" className="bg-white dark:bg-zinc-950 p-6 sm:p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 shadow-sm">
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
                                    {questions.length || quiz.questions_count || 0}
                                </span>
                            </div>
                            <button
                                // onClick={() => setIsAddModalOpen(true)}
                                className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                            >
                                <Plus size={16} /> Add Question Slot
                            </button>
                        </div>

                        {/* Questions List or Empty State */}
                        {questions.length > 0 ? (
                            <div className="flex flex-col gap-3">
                                {questions.map((q) => (
                                    <div key={q.id} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                                                #{q.order}
                                            </span>
                                            <div>
                                                <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                                    {q.question_name || `Question Slot ${q.order}`}
                                                </h4>
                                                <p className="text-xs text-zinc-400 font-mono">
                                                    ID: {q.question}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
                                            <Award size={14} className="text-emerald-500" />
                                            <span>{q.max_mark} pts</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 text-center flex-1 border-2 border-dashed border-zinc-100 dark:border-zinc-800/60 rounded-xl">
                                <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                                    <BrainCircuit size={28} />
                                </div>
                                <h3 className="text-base font-semibold text-zinc-900 dark:text-white mb-1">No question slots added</h3>
                                <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-xs mb-6">
                                    Add question slots linking question bank items to this quiz shell.
                                </p>
                                <button
                                    // onClick={() => setIsAddModalOpen(true)}
                                    className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm"
                                >
                                    <Plus size={16} />
                                    Link First Question
                                </button>
                            </div>
                        )}
                    </AnimateIn>
                </div>

                {/* Sidebar */}
                <div className="flex flex-col gap-6">
                    <AnimateIn direction="up" delay={0.15} className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 shadow-sm">
                        <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-semibold text-base border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-4">
                            <Clock size={18} className="text-emerald-500" />
                            <h2>Timing</h2>
                        </div>
                        <div className="text-sm text-zinc-600 dark:text-zinc-400 flex flex-col gap-2">
                            <div><span className="font-semibold text-zinc-900 dark:text-zinc-200">Duration:</span> {quiz.time_limit} mins</div>
                            <div><span className="font-semibold text-zinc-900 dark:text-zinc-200">Max Grade:</span> {quiz.max_grade}</div>
                            <div><span className="font-semibold text-zinc-900 dark:text-zinc-200">Attempts:</span> {quiz.max_attempts}</div>
                        </div>
                    </AnimateIn>
                </div>
            </div>
        </main>
    );
};

export default ViewStaffQuizQuestionPage;