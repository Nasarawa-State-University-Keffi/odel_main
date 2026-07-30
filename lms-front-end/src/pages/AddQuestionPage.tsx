import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
    ArrowLeft, Loader2, AlertCircle, PlusCircle, 
    HelpCircle, Hash, Award, Check 
} from "lucide-react";
import { toast } from "react-toastify";
import { useStaffQuiz } from "@/service/useStaffQuiz";
import { AnimateIn } from "@/components/ui/animate-in";
import type { CreateQuestionSlotPayload } from "@/types/quiz.types";

export const AddQuestionPage: React.FC = () => {
    const { id: quizId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { addQuestionSlot, isPending } = useStaffQuiz();

    const [questionId, setQuestionId] = useState("");
    const [order, setOrder] = useState<number>(1);
    const [maxMark, setMaxMark] = useState("10.0");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);

        if (!quizId) {
            setErrorMessage("Missing Quiz ID. Cannot attach question slot.");
            return;
        }

        if (!questionId.trim()) {
            setErrorMessage("Please enter a valid Question UUID.");
            return;
        }

        if (Number(maxMark) <= 0 || isNaN(Number(maxMark))) {
            setErrorMessage("Max mark must be a positive number.");
            return;
        }

        const payload: CreateQuestionSlotPayload = {
            quiz: quizId,
            question: questionId.trim(),
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
        <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
            
            {/* Page Header */}
            <div className="flex items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
                <button 
                    type="button"
                    onClick={handleCancel}
                    className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-3">
                        Add Question Slot
                    </h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        Link an existing question from your assessment bank to this quiz.
                    </p>
                </div>
            </div>

            {/* Main Form Container */}
            <AnimateIn direction="up">
                <form 
                    onSubmit={handleSubmit} 
                    className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl shadow-sm p-6 sm:p-8 flex flex-col gap-6"
                >
                    {/* Inline Error Alert */}
                    {errorMessage && (
                        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            <div className="flex-1 text-sm text-red-700 dark:text-red-300 leading-relaxed">
                                {errorMessage}
                            </div>
                        </div>
                    )}

                    {/* Form Guidance Note */}
                    <div className="flex items-center gap-3 p-4 bg-emerald-50/60 dark:bg-emerald-500/10 border border-emerald-200/60 dark:border-emerald-500/20 rounded-xl text-emerald-800 dark:text-emerald-300 text-sm">
                        <PlusCircle size={20} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <p>
                            Enter the unique identification slot parameters below. Once created, this question slot will be sequenced in the student test drawer.
                        </p>
                    </div>

                    {/* Question ID Input */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                            <HelpCircle size={16} className="text-emerald-500" />
                            Question ID (UUID) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. 3fa85f64-5717-4562-b3fc-2c963f66afa6"
                            value={questionId}
                            onChange={(e) => setQuestionId(e.target.value)}
                            className="w-full px-4 h-12 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all placeholder:font-sans placeholder:text-zinc-400"
                        />
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                            Provide the UUID of the target question item from the Question Bank.
                        </span>
                    </div>

                    {/* Responsive Grid for Sequence Order & Max Mark */}
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
                                className="w-full px-4 h-12 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                            />
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                Position of this question within the test list.
                            </span>
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
                                className="w-full px-4 h-12 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                            />
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                Total achievable points for answering correctly.
                            </span>
                        </div>
                    </div>

                    {/* Action Buttons Container */}
                    <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-6 border-t border-zinc-100 dark:border-zinc-800/80 mt-2">
                        <button
                            type="button"
                            onClick={handleCancel}
                            disabled={isPending}
                            className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors disabled:opacity-50 text-center"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-xl text-sm font-semibold transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50"
                        >
                            {isPending ? (
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
                </form>
            </AnimateIn>
        </main>
    );
};

export default AddQuestionPage;