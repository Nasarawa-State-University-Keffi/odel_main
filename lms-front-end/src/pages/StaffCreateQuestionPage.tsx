import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft, Loader2, AlertCircle, Plus, Trash2,
    Layers, FileText, CheckCircle2
} from "lucide-react";
import { toast } from "react-toastify";
import { useStaffQuestionBank } from "@/service/useStaffQuestionBank";
import { AnimateIn } from "@/components/ui/animate-in";

interface AnswerField {
    answer_text: string;
    fraction: string;
    feedback: string;
    order: number;
}

export const StaffCreateQuestionPage: React.FC = () => {
    const navigate = useNavigate();
    const { fetchCategories, createQuestion, isLoading: isActionLoading } = useStaffQuestionBank();

    const [categories, setCategories] = useState<any[]>([]);
    const [isLoadingCategories, setIsLoadingCategories] = useState<boolean>(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Form state matching API schema
    const [formData, setFormData] = useState({
        category: "",
        qtype: "multichoice",
        name: "",
        question_text: "",
        general_feedback: "",
        default_mark: "1",
        penalty: "0.33",
    });

    // Dynamic answers state
    const [answers, setAnswers] = useState<AnswerField[]>([
        { answer_text: "", fraction: "1.0", feedback: "", order: 1 },
        { answer_text: "", fraction: "0.0", feedback: "", order: 2 },
    ]);

    // Load categories on mount with robust response handling
    useEffect(() => {
        fetchCategories()
            .then((response: any) => {
                const list = Array.isArray(response)
                    ? response
                    : response?.results || response?.data || [];

                setCategories(list);

                if (list.length > 0) {
                    const firstCat = list[0];
                    const firstId = firstCat.id ?? firstCat.category_id ?? firstCat.pk;
                    if (firstId !== undefined) {
                        setFormData((prev) => ({ ...prev, category: String(firstId) }));
                    }
                }
            })
            .catch((err) => {
                console.log("Failed to load categories:", err);
                setErrorMessage("Failed to load question bank categories. Please try again.");
            })
            .finally(() => {
                setIsLoadingCategories(false);
            });
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        if (name === "qtype") {
            if (value === "truefalse") {
                setAnswers([
                    { answer_text: "True", fraction: "1.0", feedback: "", order: 1 },
                    { answer_text: "False", fraction: "0.0", feedback: "", order: 2 },
                ]);
            } else if (value === "shortanswer") {
                setAnswers([
                    { answer_text: "", fraction: "1.0", feedback: "", order: 1 },
                ]);
            } else if (value === "multichoice") {
                setAnswers([
                    { answer_text: "", fraction: "1.0", feedback: "", order: 1 },
                    { answer_text: "", fraction: "0.0", feedback: "", order: 2 },
                ]);
            }
        }
    };

    const handleAnswerChange = (index: number, field: keyof AnswerField, value: any) => {
        const updatedAnswers = [...answers];
        updatedAnswers[index] = { ...updatedAnswers[index], [field]: value };
        setAnswers(updatedAnswers);
    };

    const addAnswerRow = () => {
        setAnswers([
            ...answers,
            { answer_text: "", fraction: "0.0", feedback: "", order: answers.length + 1 },
        ]);
    };

    const removeAnswerRow = (index: number) => {
        if (answers.length <= 2) {
            toast.warn("Multichoice questions require at least 2 answer options.");
            return;
        }
        const updated = answers.filter((_, i) => i !== index).map((ans, idx) => ({ ...ans, order: idx + 1 }));
        setAnswers(updated);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);

        if (!formData.category) {
            setErrorMessage("Please select a category for this question.");
            return;
        }
        if (!formData.name.trim() || !formData.question_text.trim()) {
            setErrorMessage("Question title and body text are required.");
            return;
        }

        for (let i = 0; i < answers.length; i++) {
            if (!answers[i].answer_text.trim()) {
                setErrorMessage(`Answer option #${i + 1} cannot be blank.`);
                return;
            }
        }

        const payload = {
            ...formData,
            answers: answers.map((ans, idx) => ({
                ...ans,
                order: idx + 1,
            })),
        };

        try {
            await createQuestion(payload);
            toast.success("Question created successfully!");
            navigate("/staff/dashboard/question-bank/questions");
        } catch (err: any) {
            if (typeof err === "object" && err !== null) {
                const formattedErr = Object.entries(err)
                    .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(", ") : val}`)
                    .join(" | ");
                setErrorMessage(formattedErr);
            } else {
                setErrorMessage(typeof err === "string" ? err : "Failed to create question.");
            }
        }
    };

    return (
        <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={() => navigate("/staff/dashboard/question-bank/questions")}
                        className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
                            Create New Question
                        </h1>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                            Add a structured assessment item with customizable grading weights and options.
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

            {/* Form Container */}
            <AnimateIn direction="up">
                <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl shadow-sm p-6 sm:p-8 flex flex-col gap-8">

                    {/* Section 1: Core Parameters */}
                    <div className="flex flex-col gap-5">
                        <h2 className="text-base font-semibold text-zinc-900 dark:text-white flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-900 pb-3">
                            <Layers size={18} className="text-emerald-500" />
                            Classification & Settings
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                    Category <span className="text-red-500">*</span>
                                </label>
                                {isLoadingCategories ? (
                                    <div className="h-11 rounded-xl bg-zinc-100 dark:bg-zinc-900 flex items-center px-4 text-sm text-zinc-400 gap-2">
                                        <Loader2 size={16} className="animate-spin text-emerald-500" /> Loading categories...
                                    </div>
                                ) : (
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        className="h-11 px-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-sm"
                                        required
                                    >
                                        <option value="" disabled>Select a category...</option>
                                        {categories.map((cat, idx) => {
                                            const catId = cat.id ?? cat.category_id ?? cat.pk ?? idx;
                                            const catName = cat.name ?? cat.title ?? cat.category_name ?? `Category #${idx + 1}`;
                                            const catLevel = cat.level_display ?? (cat.level ? `${cat.level}L` : "");
                                            return (
                                                <option key={catId} value={catId}>
                                                    {catName} {catLevel ? `(${catLevel})` : ""}
                                                </option>
                                            );
                                        })}
                                    </select>
                                )}
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                    Question Type
                                </label>
                                <select
                                    name="qtype"
                                    value={formData.qtype}
                                    onChange={handleInputChange}
                                    className="h-11 px-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-sm"
                                >
                                    <option value="multichoice">Multiple Choice</option>
                                    <option value="truefalse">True / False</option>
                                    <option value="shortanswer">Short Answer</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                    Default Mark
                                </label>
                                <input
                                    type="text"
                                    name="default_mark"
                                    value={formData.default_mark}
                                    onChange={handleInputChange}
                                    className="h-11 px-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-sm"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                    Penalty (for multi-tries)
                                </label>
                                <input
                                    type="text"
                                    name="penalty"
                                    value={formData.penalty}
                                    onChange={handleInputChange}
                                    className="h-11 px-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Question Content */}
                    <div className="flex flex-col gap-5 pt-4">
                        <h2 className="text-base font-semibold text-zinc-900 dark:text-white flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-900 pb-3">
                            <FileText size={18} className="text-emerald-500" />
                            Question Content
                        </h2>

                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                Question Title / Short Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="e.g., Photosynthesis Phase 1"
                                className="h-11 px-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-sm"
                                required
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                Question Body Text <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                name="question_text"
                                rows={4}
                                value={formData.question_text}
                                onChange={handleInputChange}
                                placeholder="Provide the full question prompt or scenario here..."
                                className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-sm resize-none"
                                required
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                General Feedback (Optional)
                            </label>
                            <textarea
                                name="general_feedback"
                                rows={2}
                                value={formData.general_feedback}
                                onChange={handleInputChange}
                                placeholder="Feedback displayed regardless of answer..."
                                className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-sm resize-none"
                            />
                        </div>
                    </div>

                    {/* Section 3: Conditional Answer Options based on qtype */}
                    <div className="flex flex-col gap-5 pt-4">
                        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 pb-3">
                            <h2 className="text-base font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                                <CheckCircle2 size={18} className="text-emerald-500" />
                                {formData.qtype === "multichoice" && "Multiple Choice Options"}
                                {formData.qtype === "truefalse" && "True / False Correct Answer"}
                                {formData.qtype === "shortanswer" && "Accepted Short Answer Keyword"}
                            </h2>
                            {formData.qtype === "multichoice" && (
                                <button
                                    type="button"
                                    onClick={addAnswerRow}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 text-xs font-semibold transition-colors"
                                >
                                    <Plus size={14} /> Add Option
                                </button>
                            )}
                        </div>

                        {/* RENDER FOR MULTIPLE CHOICE */}
                        {formData.qtype === "multichoice" && (
                            <div className="flex flex-col gap-4">
                                {answers.map((ans, idx) => (
                                    <div
                                        key={idx}
                                        className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 flex flex-col sm:flex-row gap-4 items-start sm:items-center"
                                    >
                                        <div className="flex items-center gap-2 w-full sm:w-auto">
                                            <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                                                {idx + 1}
                                            </span>
                                            <input
                                                type="text"
                                                value={ans.answer_text}
                                                onChange={(e) => handleAnswerChange(idx, "answer_text", e.target.value)}
                                                placeholder={`Answer choice #${idx + 1}`}
                                                className="h-10 flex-1 sm:w-64 px-3 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                                required
                                            />
                                        </div>

                                        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end flex-1">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs text-zinc-500 font-medium">Grade Fraction:</span>
                                                <select
                                                    value={ans.fraction}
                                                    onChange={(e) => handleAnswerChange(idx, "fraction", e.target.value)}
                                                    className="h-10 px-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none"
                                                >
                                                    <option value="1.0">100% (Correct)</option>
                                                    <option value="0.5">50%</option>
                                                    <option value="0.33">33% (Valid)</option>
                                                    <option value="0.0">0% (Incorrect)</option>
                                                </select>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => removeAnswerRow(idx)}
                                                className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                                                title="Remove option"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* RENDER FOR TRUE / FALSE */}
                        {formData.qtype === "truefalse" && (
                            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 flex flex-col gap-3">
                                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                    Select the correct answer option:
                                </label>
                                <select
                                    value={answers.find((a) => a.fraction === "1.0")?.answer_text || "True"}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setAnswers([
                                            { answer_text: "True", fraction: val === "True" ? "1.0" : "0.0", feedback: "", order: 1 },
                                            { answer_text: "False", fraction: val === "False" ? "1.0" : "0.0", feedback: "", order: 2 },
                                        ]);
                                    }}
                                    className="h-11 px-4 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none"
                                >
                                    <option value="True">True is correct</option>
                                    <option value="False">False is correct</option>
                                </select>
                            </div>
                        )}

                        {/* RENDER FOR SHORT ANSWER */}
                        {formData.qtype === "shortanswer" && (
                            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 flex flex-col gap-3">
                                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                    Correct Keyword / Answer Text <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={answers[0]?.answer_text || ""}
                                    onChange={(e) => {
                                        setAnswers([
                                            { answer_text: e.target.value, fraction: "1.0", feedback: "", order: 1 }
                                        ]);
                                    }}
                                    placeholder="Enter the expected correct word or short phrase..."
                                    className="h-11 px-4 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none"
                                    required
                                />
                                <span className="text-xs text-zinc-400">Students entering this exact match will receive full credit (100%).</span>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-end gap-3 pt-6 border-t border-zinc-100 dark:border-zinc-900">
                        <button
                            type="button"
                            onClick={() => navigate("/staff/dashboard/question-bank/questions")}
                            className="px-5 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 text-sm font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isActionLoading}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50"
                        >
                            {isActionLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                            <span>Save Question</span>
                        </button>
                    </div>

                </form>
            </AnimateIn>
        </main>
    );
};

export default StaffCreateQuestionPage;