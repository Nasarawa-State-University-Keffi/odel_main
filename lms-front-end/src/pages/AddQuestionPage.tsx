import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft, Loader2, AlertCircle, PlusCircle,
    Search, Filter, ChevronLeft, ChevronRight,
    Check, HelpCircle, Hash, Award, Layers, FileText
} from "lucide-react";
import { toast } from "react-toastify";
import { useStaffQuiz } from "@/service/useStaffQuiz";
import { useStaffQuestionBank } from "@/service/useStaffQuestionBank";
import { AnimateIn } from "@/components/ui/animate-in";
import type { CreateQuestionSlotPayload } from "@/types/quiz.types";

export const AddQuestionPage: React.FC = () => {
    const { id: quizId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { addQuestionSlot, isPending: isSubmitting } = useStaffQuiz();
    const { fetchQuestions, fetchCategories, isLoading: isLoadingBank } = useStaffQuestionBank();

    // Form configuration state
    const [selectedQuestionId, setSelectedQuestionId] = useState<string>("");
    const [selectedQuestionName, setSelectedQuestionName] = useState<string>("");
    const [order, setOrder] = useState<number>(1);
    const [maxMark, setMaxMark] = useState<string>("10.0");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Question bank browsing state
    const [questions, setQuestions] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [totalCount, setTotalCount] = useState<number>(0);

    // Load Categories on mount
    useEffect(() => {
        const loadCategories = async () => {
            try {
                const res = await fetchCategories();
                const list = Array.isArray(res) ? res : res?.results || [];
                setCategories(list);
            } catch (err) {
                console.error("Failed to load categories:", err);
            }
        };
        loadCategories();
    }, []);

    // Load Questions whenever search, category, or page changes
    useEffect(() => {
        const loadBankQuestions = async () => {
            try {
                const response = await fetchQuestions({
                    page: currentPage,
                    search: searchQuery,
                    category: selectedCategory || undefined,
                });

                const list = Array.isArray(response) ? response : response?.results || [];
                setQuestions(list);

                // Handle pagination metadata if available from DRF paginator
                if (response?.count) {
                    setTotalCount(response.count);
                    setTotalPages(Math.ceil(response.count / 10)); // Assuming 10 items per page default
                } else {
                    setTotalPages(list.length > 0 ? currentPage + (response?.next ? 1 : 0) : currentPage);
                }
            } catch (err) {
                console.error("Failed to load question bank:", err);
            }
        };

        const debounceTimer = setTimeout(() => {
            loadBankQuestions();
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [currentPage, searchQuery, selectedCategory]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);

        if (!quizId) {
            setErrorMessage("Missing Quiz ID. Cannot attach question slot.");
            return;
        }

        if (!selectedQuestionId) {
            setErrorMessage("Please select a question from the Question Bank below.");
            return;
        }

        if (Number(maxMark) <= 0 || isNaN(Number(maxMark))) {
            setErrorMessage("Max mark must be a positive number.");
            return;
        }

        const payload: CreateQuestionSlotPayload = {
            quiz: quizId,
            question: selectedQuestionId,
            order: Number(order),
            max_mark: String(maxMark),
        };

        try {
            await addQuestionSlot(payload);
            toast.success("Question slot linked successfully!");
            navigate(`/staff/dashboard/quizzes/${quizId}`);
        } catch (err: any) {
            setErrorMessage(typeof err === "string" ? err : "Failed to add question slot.");
        }
    };

    const handleCancel = () => {
        if (quizId) {
            navigate(`/staff/dashboard/quizzes/${quizId}`);
        } else {
            navigate(-1);
        }
    };

    return (
        <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">

            {/* Page Header */}
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-6">
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
                            Add Question Slot
                        </h1>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                            Link an existing assessment question from your bank to this quiz.
                        </p>
                    </div>
                </div>
            </div>

            {/* Error Banner */}
            {errorMessage && (
                <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div className="flex-1 text-sm text-red-700 dark:text-red-300 leading-relaxed">
                        {errorMessage}
                    </div>
                </div>
            )}

            <AnimateIn direction="up">
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">

                    {/* Section 1: Question Bank Picker Hub */}
                    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl shadow-sm p-6 sm:p-8 flex flex-col gap-5">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-100 dark:border-zinc-900 pb-4">
                            <div>
                                <h2 className="text-base font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                                    <HelpCircle size={18} className="text-emerald-500" />
                                    Select Question from Bank <span className="text-red-500">*</span>
                                </h2>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                    {selectedQuestionId
                                        ? `Selected: "${selectedQuestionName}"`
                                        : "Click a question card below to select it."}
                                </p>
                            </div>

                            {selectedQuestionId && (
                                <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto">
                                    <Check size={14} /> Question Linked
                                </span>
                            )}
                        </div>

                        {/* Search and Category Filters */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="sm:col-span-2 relative flex items-center">
                                <Search size={16} className="absolute left-3.5 text-zinc-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    placeholder="Search by question title or text..."
                                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                />
                            </div>

                            <div className="relative flex items-center">
                                <Filter size={16} className="absolute left-3.5 text-zinc-400" />
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => {
                                        setSelectedCategory(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none"
                                >
                                    <option value="">All Categories</option>
                                    {categories.map((cat, idx) => {
                                        const catId = cat.id ?? cat.pk ?? idx;
                                        const catName = cat.name ?? cat.title ?? `Category #${idx + 1}`;
                                        return (
                                            <option key={catId} value={catId}>
                                                {catName}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                        </div>

                        {/* Question Cards Grid */}
                        <div className="min-h-[280px] max-h-[380px] overflow-y-auto pr-1 flex flex-col gap-3">
                            {isLoadingBank && questions.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 gap-3 text-zinc-400">
                                    <Loader2 size={24} className="animate-spin text-emerald-500" />
                                    <p className="text-xs">Loading questions from bank...</p>
                                </div>
                            ) : questions.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 gap-2 text-zinc-400">
                                    <FileText size={28} className="text-zinc-300 dark:text-zinc-700" />
                                    <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">No questions found</p>
                                    <p className="text-[11px]">Try adjusting your search query or category filter.</p>
                                </div>
                            ) : (
                                questions.map((q) => {
                                    const qId = q.id ?? q.pk;
                                    const qName = q.name || "Untitled Question";
                                    const qText = q.question_text || "No description text.";
                                    const qType = q.qtype || "multichoice";
                                    const isSelected = selectedQuestionId === qId;

                                    return (
                                        <div
                                            key={qId}
                                            onClick={() => {
                                                setSelectedQuestionId(qId);
                                                setSelectedQuestionName(qName);
                                            }}
                                            className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${isSelected
                                                ? "bg-emerald-50/50 dark:bg-emerald-500/10 border-emerald-500 shadow-sm"
                                                : "bg-zinc-50/50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                                                }`}
                                        >
                                            <div className="flex flex-col gap-1.5 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px] font-semibold uppercase tracking-wider">
                                                        {qType}
                                                    </span>
                                                    <span className="text-[11px] text-zinc-400 font-mono">
                                                        ID: {qId.slice(0, 8)}...
                                                    </span>
                                                </div>
                                                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                                                    {qName}
                                                </h3>
                                                <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">
                                                    {qText}
                                                </p>
                                            </div>

                                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-1 ${isSelected
                                                ? "bg-emerald-500 border-emerald-500 text-white"
                                                : "border-zinc-300 dark:border-zinc-700"
                                                }`}>
                                                {isSelected && <Check size={12} />}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Pagination Bar */}
                        <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-900 text-xs text-zinc-500">
                            <span>Page {currentPage} of {Math.max(totalPages, 1)}</span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    disabled={currentPage <= 1 || isLoadingBank}
                                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                    className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 disabled:opacity-40 hover:bg-zinc-200 transition-colors"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <button
                                    type="button"
                                    disabled={currentPage >= totalPages || isLoadingBank}
                                    onClick={() => setCurrentPage((prev) => prev + 1)}
                                    className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 disabled:opacity-40 hover:bg-zinc-200 transition-colors"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Slot Sequencing & Grading Parameters */}
                    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl shadow-sm p-6 sm:p-8 flex flex-col gap-6">
                        <h2 className="text-base font-semibold text-zinc-900 dark:text-white flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-900 pb-3">
                            <Layers size={18} className="text-emerald-500" />
                            Slot Configuration
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {/* Sequence Order */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                                    <Hash size={16} className="text-emerald-500" />
                                    Sequence Order <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    required
                                    value={order}
                                    onChange={(e) => setOrder(Number(e.target.value))}
                                    className="w-full px-4 h-12 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                />
                                <span className="text-xs text-zinc-500">Position of this question within the test list.</span>
                            </div>

                            {/* Max Mark */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                                    <Award size={16} className="text-emerald-500" />
                                    Max Mark <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0.1"
                                    required
                                    value={maxMark}
                                    onChange={(e) => setMaxMark(e.target.value)}
                                    className="w-full px-4 h-12 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                />
                                <span className="text-xs text-zinc-500">Total achievable points for answering correctly.</span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-6 border-t border-zinc-100 dark:border-zinc-900">
                            <button
                                type="button"
                                onClick={handleCancel}
                                disabled={isSubmitting}
                                className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || !selectedQuestionId}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-xl text-sm font-semibold transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        <span>Linking Question...</span>
                                    </>
                                ) : (
                                    <>
                                        <Check size={16} />
                                        <span>Add Question to Quiz</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                </form>
            </AnimateIn>
        </main>
    );
};

export default AddQuestionPage;