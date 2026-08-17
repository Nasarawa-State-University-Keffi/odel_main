import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft, Save, Loader2, BookOpen,
    Clock, Settings2, FileText, AlertCircle
} from "lucide-react";
import { toast } from "react-toastify";
import { useStaffQuiz } from "@/service/useStaffQuiz";
import { AnimateIn } from "@/components/ui/animate-in";
import type { UpdateQuizPayload } from "@/types/quiz.types";

// Helper to convert ISO datetime string to datetime-local input format
const formatDateTimeForInput = (isoString?: string): string => {
    if (!isoString) return "";
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const EditQuizPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { fetchQuizById, updateQuiz, isPending } = useStaffQuiz();

    // Page states
    const [isLoadingDetails, setIsLoadingDetails] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // Mock courses (replace with real fetch like in CreateQuiz)
    const [courses] = useState([{ id: "0", title: "Current Course (Locked)" }]);

    const [formData, setFormData] = useState<UpdateQuizPayload>({
        name: "",
        description: "",
        time_open: "",
        time_close: "",
        time_limit: 60,
        max_grade: "100",
        shuffle_questions: true,
        max_attempts: 1,
        show_feedback: true,
        course_id: ""
    });

    useEffect(() => {
        if (!id) return;

        setIsLoadingDetails(true);
        fetchQuizById(id)
            .then((data) => {
                setFormData({
                    name: data.name || "",
                    description: data.description || "",
                    time_open: formatDateTimeForInput(data.time_open),
                    time_close: formatDateTimeForInput(data.time_close),
                    time_limit: data.time_limit || 60,
                    max_grade: data.max_grade || "100",
                    shuffle_questions: data.shuffle_questions ?? true,
                    max_attempts: data.max_attempts || 1,
                    show_feedback: data.show_feedback ?? true,
                    course_id: String(data.course_external_id),
                });
                setFetchError(null);
            })
            .catch((err) => {
                setFetchError(typeof err === "string" ? err : "Failed to load quiz details.");
            })
            .finally(() => {
                setIsLoadingDetails(false);
            });
    }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "number" ? Number(value) : value,
        }));
    };

    const handleToggle = (name: keyof UpdateQuizPayload) => {
        setFormData((prev) => ({
            ...prev,
            [name]: !prev[name as keyof UpdateQuizPayload],
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;

        setIsSubmitting(true);
        try {
            const payload: UpdateQuizPayload = {
                ...formData,
                time_open: formData.time_open ? new Date(formData.time_open).toISOString() : undefined,
                time_close: formData.time_close ? new Date(formData.time_close).toISOString() : undefined,
                max_grade: formData.max_grade?.toString(),
                course_id: formData.course_id
            };

            await updateQuiz(id, payload);
            toast.success("Quiz updated successfully!");
            navigate("/staff/dashboard/quizzes");
        } catch (err: any) {
            toast.error(typeof err === "string" ? err : "Failed to update quiz.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoadingDetails) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-emerald-500">
                <Loader2 size={36} className="animate-spin mb-4" />
                <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Loading quiz configurations...</p>
            </div>
        );
    }

    if (fetchError) {
        return (
            <main className="w-full max-w-4xl mx-auto px-4 py-12">
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 p-6 rounded-2xl text-center">
                    <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-red-800 dark:text-red-300">Error Loading Quiz</h3>
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1 mb-6">{fetchError}</p>
                    <button onClick={() => navigate(-1)} className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-sm font-semibold">
                        Go Back
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <form onSubmit={handleSubmit}>
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <button type="button" onClick={() => navigate(-1)} className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                            <ArrowLeft size={18} />
                        </button>
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
                                Edit Quiz
                            </h1>
                            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                                Update settings, timing, and rules for this assessment.
                            </p>
                        </div>
                    </div>

                    {/* Submit Actions */}
                    <div className="flex items-center gap-3 self-end sm:self-auto w-full sm:w-auto">
                        <button type="button" onClick={() => navigate(-1)} className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={isSubmitting || isPending} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50">
                            {isSubmitting ? (
                                <><Loader2 size={16} className="animate-spin" /><span>Saving...</span></>
                            ) : (
                                <><Save size={16} /><span>Save Changes</span></>
                            )}
                        </button>
                    </div>
                </div>

                {/* Main Content Layout Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left/Main Column: Basic Information */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        <AnimateIn direction="up" className="bg-white dark:bg-zinc-950 p-5 sm:p-7 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 shadow-sm flex flex-col gap-6">
                            <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-semibold text-base border-b border-zinc-100 dark:border-zinc-800 pb-3">
                                <FileText size={18} className="text-emerald-500" />
                                <h2>General Details</h2>
                            </div>

                            {/* Course Selection (Disabled for Edit) */}
                            <div className="flex flex-col gap-2">
                                <label className="text-xs sm:text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                                    Target Course (Cannot be changed)
                                </label>
                                <div className="relative">
                                    <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                    <select
                                        disabled
                                        className="w-full pl-10 pr-4 h-11 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-500 dark:text-zinc-400 appearance-none opacity-70"
                                    >
                                        <option>{courses[0].title}</option>
                                    </select>
                                </div>
                            </div>

                            {/* Name Field */}
                            <div className="flex flex-col gap-2">
                                <label className="text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                                    Quiz Name <span className="text-red-500">*</span>
                                </label>
                                <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full px-4 h-11 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all" />
                            </div>

                            {/* Description Field */}
                            <div className="flex flex-col gap-2">
                                <label className="text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                                    Description & Instructions
                                </label>
                                <textarea name="description" rows={5} value={formData.description} onChange={handleChange} className="w-full p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all resize-y min-h-[120px]" />
                            </div>
                        </AnimateIn>

                        {/* Timing Configuration */}
                        <AnimateIn direction="up" delay={0.1} className="bg-white dark:bg-zinc-950 p-5 sm:p-7 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 shadow-sm flex flex-col gap-6">
                            <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-semibold text-base border-b border-zinc-100 dark:border-zinc-800 pb-3">
                                <Clock size={18} className="text-emerald-500" />
                                <h2>Schedule & Timing</h2>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Open Time */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Open Quiz At <span className="text-red-500">*</span></label>
                                    <input type="datetime-local" name="time_open" required value={formData.time_open} onChange={handleChange} className="w-full px-4 h-11 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all" />
                                </div>

                                {/* Close Time */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Close Quiz At <span className="text-red-500">*</span></label>
                                    <input type="datetime-local" name="time_close" required value={formData.time_close} onChange={handleChange} className="w-full px-4 h-11 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all" />
                                </div>
                            </div>
                        </AnimateIn>
                    </div>

                    {/* Right Column: Settings & Rules */}
                    <div className="flex flex-col gap-6">

                        <AnimateIn direction="up" delay={0.15} className="bg-white dark:bg-zinc-950 p-5 sm:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 shadow-sm flex flex-col gap-5">
                            <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-semibold text-base border-b border-zinc-100 dark:border-zinc-800 pb-3">
                                <Settings2 size={18} className="text-emerald-500" />
                                <h2>Grading & Rules</h2>
                            </div>

                            {/* Time Limit */}
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Time Limit (Minutes) <span className="text-red-500">*</span></label>
                                <input type="number" name="time_limit" min={1} required value={formData.time_limit} onChange={handleChange} className="w-full px-4 h-11 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all" />
                            </div>

                            {/* Max Grade */}
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Maximum Grade</label>
                                <input type="number" name="max_grade" step="0.01" required value={formData.max_grade} onChange={handleChange} className="w-full px-4 h-11 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all" />
                            </div>

                            {/* Max Attempts */}
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Max Allowed Attempts</label>
                                <input type="number" name="max_attempts" min={1} required value={formData.max_attempts} onChange={handleChange} className="w-full px-4 h-11 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all" />
                            </div>
                        </AnimateIn>

                        {/* Status Toggles */}
                        <AnimateIn direction="up" delay={0.2} className="bg-white dark:bg-zinc-950 p-5 sm:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 shadow-sm flex flex-col gap-5">

                            {/* Shuffle Questions Toggle */}
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Shuffle Questions</span>
                                    <span className="text-xs text-zinc-500 dark:text-zinc-400">Randomize order for each attempt.</span>
                                </div>
                                <button type="button" onClick={() => handleToggle("shuffle_questions")} className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${formData.shuffle_questions ? "bg-emerald-500" : "bg-zinc-200 dark:bg-zinc-800"}`}>
                                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${formData.shuffle_questions ? "translate-x-5" : "translate-x-0"}`} />
                                </button>
                            </div>

                            <hr className="border-zinc-100 dark:border-zinc-800" />

                            {/* Show Feedback Toggle */}
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Show Feedback</span>
                                    <span className="text-xs text-zinc-500 dark:text-zinc-400">Display results after completion.</span>
                                </div>
                                <button type="button" onClick={() => handleToggle("show_feedback")} className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${formData.show_feedback ? "bg-emerald-500" : "bg-zinc-200 dark:bg-zinc-800"}`}>
                                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${formData.show_feedback ? "translate-x-5" : "translate-x-0"}`} />
                                </button>
                            </div>
                        </AnimateIn>

                    </div>
                </div>
            </form>
        </main>
    );
};

export default EditQuizPage;