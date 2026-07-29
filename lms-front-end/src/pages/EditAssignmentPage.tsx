import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft, Save, Loader2, AlertCircle,
    Calendar, FileText
} from "lucide-react";
import { toast } from "react-toastify";
import { useStaffAccessment } from "@/service/useStaffAssignment";
import { AnimateIn } from "@/components/ui/animate-in";
import type { UpdateAssignmentPayload } from "@/types/assignment.types";

const formatDateTimeForInput = (isoString?: string): string => {
    if (!isoString) return "";
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const EditAssignmentPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { fetchAssignmentById, updateAssignment, isPending } = useStaffAccessment();

    // Local state for fetching
    const [isLoadingDetails, setIsLoadingDetails] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // Form data state
    const [formData, setFormData] = useState<UpdateAssignmentPayload>({
        title: "",
        description: "",
        open_at: "",
        due_at: "",
        close_at: "",
        max_attempts: 1,
        max_marks: "100",
        allow_late_submission: true,
        is_published: false,
    });

    // Fetch assignment details on mount
    useEffect(() => {
        if (!id) return;

        setIsLoadingDetails(true);
        fetchAssignmentById(id)
            .then((data) => {
                setFormData({
                    title: data.title || "",
                    description: data.description || "",
                    open_at: formatDateTimeForInput(data.open_at),
                    due_at: formatDateTimeForInput(data.due_at),
                    close_at: formatDateTimeForInput(data.close_at),
                    max_attempts: data.max_attempts || 1,
                    max_marks: data.max_marks || "100",
                    allow_late_submission: data.allow_late_submission ?? true,
                    is_published: data.is_published ?? false,
                    course: typeof data.course === "object" ? data.course.course_external_id : data.course,
                });
                setFetchError(null);
            })
            .catch((err) => {
                setFetchError(typeof err === "string" ? err : "Failed to load assignment details.");
            })
            .finally(() => {
                setIsLoadingDetails(false);
            });
    }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "number" ? Number(value) : value,
        }));
    };

    const handleToggle = (name: keyof UpdateAssignmentPayload) => {
        setFormData((prev) => ({
            ...prev,
            [name]: !prev[name],
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;

        setIsSubmitting(true);
        try {
            // Convert local input dates back to standard ISO string before sending
            const payload: UpdateAssignmentPayload = {
                ...formData,
                open_at: formData.open_at ? new Date(formData.open_at).toISOString() : undefined,
                due_at: formData.due_at ? new Date(formData.due_at).toISOString() : undefined,
                close_at: formData.close_at ? new Date(formData.close_at).toISOString() : undefined,
            };

            await updateAssignment(id, payload);
            toast.success("Assignment updated successfully!");
            navigate("/staff/dashboard/assignments");
        } catch (err: any) {
            toast.error(typeof err === "string" ? err : "Failed to update assignment.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoadingDetails) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-emerald-500">
                <Loader2 size={36} className="animate-spin mb-4" />
                <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Loading assignment details...</p>
            </div>
        );
    }

    if (fetchError) {
        return (
            <main className="w-full max-w-4xl mx-auto px-4 py-12">
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 p-6 rounded-2xl text-center">
                    <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-red-800 dark:text-red-300">Error Loading Assignment</h3>
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1 mb-6">{fetchError}</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-sm font-semibold"
                    >
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
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
                                Edit Assignment
                            </h1>
                            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                                Update assessment rules, schedule, and details.
                            </p>
                        </div>
                    </div>

                    {/* Submit Actions */}
                    <div className="flex items-center gap-3 self-end sm:self-auto w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || isPending}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <>
                                    <Save size={16} />
                                    <span>Save Changes</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Main Content Layout Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Basic Information */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        <AnimateIn direction="up" className="bg-white dark:bg-zinc-950 p-5 sm:p-7 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 shadow-sm flex flex-col gap-6">
                            <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-semibold text-base border-b border-zinc-100 dark:border-zinc-800 pb-3">
                                <FileText size={18} className="text-emerald-500" />
                                <h2>General Information</h2>
                            </div>

                            {/* Title Field */}
                            <div className="flex flex-col gap-2">
                                <label className="text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                                    Assignment Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    required
                                    value={formData.title}
                                    onChange={handleChange}
                                    placeholder="e.g. Midterm Project - System Architecture"
                                    className="w-full px-4 h-11 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                                />
                            </div>

                            {/* Description Field */}
                            <div className="flex flex-col gap-2">
                                <label className="text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                                    Instructions & Description
                                </label>
                                <textarea
                                    name="description"
                                    rows={6}
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="Provide detailed instructions for your students..."
                                    className="w-full p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all resize-y min-h-[140px]"
                                />
                            </div>
                        </AnimateIn>

                        {/* Availability & Deadlines */}
                        <AnimateIn direction="up" delay={0.1} className="bg-white dark:bg-zinc-950 p-5 sm:p-7 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 shadow-sm flex flex-col gap-6">
                            <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-semibold text-base border-b border-zinc-100 dark:border-zinc-800 pb-3">
                                <Calendar size={18} className="text-emerald-500" />
                                <h2>Schedule & Dates</h2>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {/* Open At */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                        Open Date
                                    </label>
                                    <input
                                        type="datetime-local"
                                        name="open_at"
                                        value={formData.open_at}
                                        onChange={handleChange}
                                        className="w-full px-3 h-11 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                                    />
                                </div>

                                {/* Due At */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                        Due Date
                                    </label>
                                    <input
                                        type="datetime-local"
                                        name="due_at"
                                        value={formData.due_at}
                                        onChange={handleChange}
                                        className="w-full px-3 h-11 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                                    />
                                </div>

                                {/* Close At */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                        Hard Lock Date
                                    </label>
                                    <input
                                        type="datetime-local"
                                        name="close_at"
                                        value={formData.close_at}
                                        onChange={handleChange}
                                        className="w-full px-3 h-11 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                                    />
                                </div>
                            </div>
                        </AnimateIn>
                    </div>

                    {/* Right Column: Settings & Rules */}
                    <div className="flex flex-col gap-6">

                        {/* Scoring & Submission Rules */}
                        <AnimateIn direction="up" delay={0.15} className="bg-white dark:bg-zinc-950 p-5 sm:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 shadow-sm flex flex-col gap-5">
                            <h2 className="text-zinc-900 dark:text-white font-semibold text-base border-b border-zinc-100 dark:border-zinc-800 pb-3">
                                Rules & Scoring
                            </h2>

                            {/* Max Marks */}
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                    Maximum Marks
                                </label>
                                <input
                                    type="text"
                                    name="max_marks"
                                    value={formData.max_marks}
                                    onChange={handleChange}
                                    className="w-full px-4 h-11 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                                />
                            </div>

                            {/* Max Attempts */}
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                    Max Allowed Attempts
                                </label>
                                <input
                                    type="number"
                                    name="max_attempts"
                                    min={1}
                                    value={formData.max_attempts}
                                    onChange={handleChange}
                                    className="w-full px-4 h-11 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                                />
                            </div>
                        </AnimateIn>

                        {/* Status Toggles */}
                        <AnimateIn direction="up" delay={0.2} className="bg-white dark:bg-zinc-950 p-5 sm:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 shadow-sm flex flex-col gap-5">
                            <h2 className="text-zinc-900 dark:text-white font-semibold text-base border-b border-zinc-100 dark:border-zinc-800 pb-3">
                                Settings & Status
                            </h2>

                            {/* Is Published Toggle */}
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                        Publish Immediately
                                    </span>
                                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                        Visible to enrolled students.
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleToggle("is_published")}
                                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${formData.is_published ? "bg-emerald-500" : "bg-zinc-200 dark:bg-zinc-800"
                                        }`}
                                >
                                    <span
                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${formData.is_published ? "translate-x-5" : "translate-x-0"
                                            }`}
                                    />
                                </button>
                            </div>

                            {/* Allow Late Submissions Toggle */}
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                        Allow Late Submissions
                                    </span>
                                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                        Permit hand-ins past due date.
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleToggle("allow_late_submission")}
                                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${formData.allow_late_submission ? "bg-emerald-500" : "bg-zinc-200 dark:bg-zinc-800"
                                        }`}
                                >
                                    <span
                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${formData.allow_late_submission ? "translate-x-5" : "translate-x-0"
                                            }`}
                                    />
                                </button>
                            </div>
                        </AnimateIn>

                    </div>
                </div>
            </form>
        </main>
    );
};

export default EditAssignmentPage;