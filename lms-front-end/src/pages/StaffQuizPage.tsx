import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, AlertCircle, Search, ChevronLeft, ChevronRight, BookOpen, Loader2, BrainCircuit } from "lucide-react";
import { useStaffQuiz } from "@/service/useStaffQuiz";
import { AnimateIn } from "@/components/ui/animate-in";
import { QuizCard } from "@/components/staff/quiz/QuizCard";

const StaffQuizPage = () => {
    const navigate = useNavigate();
    const { fetchQuizzes, isPending, data, error } = useStaffQuiz();

    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchQuizzes({ search: searchTerm, page: currentPage });
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, currentPage]);

    return (
        <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col min-h-[calc(100vh-4rem)]">

            {/* Header & Controls */}
            <div className="flex flex-col gap-6 mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <AnimateIn direction="left">
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                            Quizzes & Tests
                        </h1>
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
                            Create, manage, and schedule automated course assessments.
                        </p>
                    </AnimateIn>

                    <AnimateIn direction="right" className="w-full sm:w-auto">
                        <button
                            onClick={() => navigate("/staff/dashboard/quizzes/create")}
                            className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5 active:translate-y-0 w-full sm:w-auto"
                        >
                            <Plus size={18} strokeWidth={2.5} />
                            <span>Create Quiz</span>
                        </button>
                    </AnimateIn>
                </div>

                {/* Toolbar */}
                <AnimateIn direction="up" delay={0.1} className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-zinc-950 p-2 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 shadow-sm">
                    <div className="relative w-full sm:max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                        <input
                            type="text"
                            placeholder="Search quizzes by name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 h-11 bg-zinc-50 dark:bg-zinc-900/50 border-transparent focus:bg-white dark:focus:bg-zinc-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500"
                        />
                    </div>

                    {data?.count !== undefined && (
                        <div className="hidden sm:flex items-center gap-2 px-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                            <BookOpen size={16} />
                            <span>{data.count} Total Quizzes</span>
                        </div>
                    )}
                </AnimateIn>
            </div>

            {/* Error State */}
            {error && !isPending && (
                <AnimateIn direction="down" className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 px-4 py-4 rounded-xl mb-8 flex items-start gap-3">
                    <AlertCircle size={20} className="mt-0.5 shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                </AnimateIn>
            )}

            {/* Loading State */}
            {isPending && !data && (
                <div className="flex-1 flex flex-col items-center justify-center py-20 text-emerald-500">
                    <Loader2 size={36} className="animate-spin mb-4" />
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Loading quizzes...</p>
                </div>
            )}

            {/* Empty State */}
            {!isPending && data && data.results.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center">
                    <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 text-zinc-400 rounded-full flex items-center justify-center mb-4">
                        <BrainCircuit size={32} />
                    </div>
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">No quizzes found</h3>
                    <p className="text-zinc-500 dark:text-zinc-400 max-w-sm mb-6 text-sm">
                        {searchTerm ? "No results match your search criteria." : "You haven't created any automated quizzes yet."}
                    </p>
                </div>
            )}

            {/* Data Grid & Pagination */}
            {!isPending && data && data.results.length > 0 && (
                <div className="flex-1 flex flex-col">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                        {data.results.map((quiz, index) => (
                            <AnimateIn key={quiz.id} direction="up" delay={index * 0.05} className="h-full">
                                <QuizCard quiz={quiz} />
                            </AnimateIn>
                        ))}
                    </div>

                    {/* Pagination */}
                    <AnimateIn direction="up" delay={0.2} className="mt-auto pt-6 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                            Page <span className="text-zinc-900 dark:text-zinc-100">{currentPage}</span>
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => data?.previous && setCurrentPage(prev => prev - 1)}
                                disabled={!data.previous || isPending}
                                className="flex items-center gap-1 px-4 py-2 text-sm font-semibold rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft size={16} /> Previous
                            </button>
                            <button
                                onClick={() => data?.next && setCurrentPage(prev => prev + 1)}
                                disabled={!data.next || isPending}
                                className="flex items-center gap-1 px-4 py-2 text-sm font-semibold rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                Next <ChevronRight size={16} />
                            </button>
                        </div>
                    </AnimateIn>
                </div>
            )}
        </main>
    );
};

export default StaffQuizPage;