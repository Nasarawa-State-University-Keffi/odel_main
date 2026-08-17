import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Plus, Search, Edit3, Trash2, Loader2, AlertCircle, FileText,
} from "lucide-react";
import { toast } from "react-toastify";
import { useStaffQuestionBank } from "@/service/useStaffQuestionBank";
import { AnimateIn } from "@/components/ui/animate-in";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";


export const StaffQuestionListPage: React.FC = () => {
    const navigate = useNavigate();
    const { fetchQuestions, isLoading, deleteQuestion } = useStaffQuestionBank();

    const [questions, setQuestions] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [querstionToDelete, setQuestionToDelete] = useState<{ id: string, name: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const loadQuestions = async () => {
        try {
            const response = await fetchQuestions();
            const list = Array.isArray(response)
                ? response
                : response?.results || [];
            setQuestions(list);
        } catch (err) {
            console.error("Failed to fetch questions:", err);
            setErrorMessage("Failed to load questions from the bank.");
        }
    };

    useEffect(() => {
        loadQuestions();
    }, []);


    const confirmDelete = async () => {
        if (!querstionToDelete) return;

        setIsDeleting(true);
        try {
            await deleteQuestion(querstionToDelete.id);
            toast.success("Question deleted successfully.");
            loadQuestions();
        } catch (err: any) {
            toast.error(typeof err === "string" ? err : "Failed to delete question.");
        } finally {
            setIsDeleting(false);
            setQuestionToDelete(null);
        }
    };

    const filteredQuestions = questions.filter((q) => {
        const name = q.name || q.question_text || "";
        return name.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
                        Question Bank Management
                    </h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        Manage, edit, or remove assessment items across all categories.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => navigate("/staff/dashboard/question-bank/questions/create")}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-all shadow-md shadow-emerald-500/20"
                >
                    <Plus size={18} />
                    <span>Create Question</span>
                </button>
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

            {/* Search and Controls Filter */}
            <div className="flex items-center gap-3 bg-white dark:bg-zinc-950 p-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
                <Search size={18} className="text-zinc-400 ml-2" />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search questions by title or text..."
                    className="w-full bg-transparent text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none placeholder:text-zinc-400"
                />
            </div>

            {/* Question List Table / Grid */}
            <AnimateIn direction="up">
                <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
                    {isLoading && questions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3 text-zinc-400">
                            <Loader2 size={24} className="animate-spin text-emerald-500" />
                            <p className="text-sm">Loading questions...</p>
                        </div>
                    ) : filteredQuestions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-2 text-zinc-400">
                            <FileText size={32} className="text-zinc-300 dark:text-zinc-700" />
                            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">No questions found</p>
                            <p className="text-xs">Get started by creating your first assessment question.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
                            {filteredQuestions.map((q) => {
                                const qId = q.id ?? q.pk;
                                const qName = q.name || "Untitled Question";
                                const qText = q.question_text || "No description provided.";
                                const qType = q.qtype || "multichoice";
                                const defaultMark = q.default_mark ?? "1";

                                return (
                                    <div
                                        key={qId}
                                        className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors"
                                    >
                                        <div className="flex flex-col gap-1.5 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                                                    {qType}
                                                </span>
                                                <span className="text-xs text-zinc-400 font-medium">
                                                    Marks: {defaultMark}
                                                </span>
                                            </div>
                                            <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
                                                {qName}
                                            </h3>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">
                                                {qText}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2 self-end sm:self-center">
                                            <button
                                                type="button"
                                                onClick={() => navigate(`/staff/dashboard/question-bank/questions/edit/${qId}`)}
                                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-xs font-semibold transition-colors"
                                                title="Edit question"
                                            >
                                                <Edit3 size={14} /> Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setQuestionToDelete({ id: qId, name: qText });
                                                }}
                                                disabled={deletingId === qId}
                                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 text-xs font-semibold transition-colors disabled:opacity-50"
                                                title="Delete question"
                                            >
                                                {deletingId === qId ? (
                                                    <Loader2 size={14} className="animate-spin" />
                                                ) : (
                                                    <Trash2 size={14} />
                                                )}
                                                <span>Delete</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </AnimateIn>


            <AlertDialog open={!!querstionToDelete} onOpenChange={(open) => !open && setQuestionToDelete(null)}>
                <AlertDialogContent className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-zinc-900 dark:text-white flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-red-500" />
                            Delete Category
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-zinc-500 dark:text-zinc-400 mt-2">
                            Are you absolutely sure you want to delete <span className="font-semibold text-zinc-900 dark:text-zinc-200">"{querstionToDelete?.name}"</span>?
                            This action cannot be undone and may affect quizzes utilizing these questions.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                        <AlertDialogCancel
                            disabled={isDeleting}
                            className="rounded-xl border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
                        >
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                confirmDelete();
                            }}
                            disabled={isDeleting}
                            className="bg-red-500 hover:bg-red-600 focus:ring-red-500/50 text-white rounded-xl border-0"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                'Yes, Delete Category'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </main>
    );
};

export default StaffQuestionListPage;