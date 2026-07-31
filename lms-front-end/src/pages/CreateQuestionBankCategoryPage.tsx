import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft, Loader2, AlertCircle, FolderPlus,
    Type, AlignLeft, Hash, BookOpen
} from "lucide-react";
import { toast } from "react-toastify";
import { useStaffQuestionBank } from "@/service/useStaffQuestionBank";
import { useStaffDashboard } from "@/service/useStaffDashboard";
import { AnimateIn } from "@/components/ui/animate-in";
import type { CreateCategoryPayload } from "@/types/questionBank.types";

// Shadcn UI Imports
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useUserContext } from "@/context/UserProvider";

export const CreateQuestionBankCategoryPage: React.FC = () => {
    const navigate = useNavigate();
    const { createCategory, isLoading: isCreating } = useStaffQuestionBank();

    // Fetch courses from dashboard hook
    const { dashboardData, fetchStaffData } = useStaffDashboard();
    const { user } = useUserContext();

    const [formData, setFormData] = useState<CreateCategoryPayload>({
        course_id: "",
        name: "",
        description: "",
        level: "100",
    });

    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Ensure dashboard data is loaded
    useEffect(() => {
        if (user) {
            fetchStaffData(user.external_id);
        }
    }, [user]);

    // Native input handler
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Shadcn Select handler
    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);

        if (!formData.course_id || !formData.name.trim() || !formData.level) {
            setErrorMessage("Please fill in all required fields.");
            return;
        }

        try {
            await createCategory(formData);
            toast.success("Category created successfully!");
            navigate("/staff/dashboard/question-bank/categories");
        } catch (err: any) {
            setErrorMessage(typeof err === "string" ? err : "An error occurred while creating the category.");
        }
    };

    // Find the currently selected course for immediate trigger display
    const selectedCourse = dashboardData?.total_courses?.find(
        (c) => String(c.course_external_id) === String(formData.course_id)
    );

    return (
        <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">

            {/* Page Header */}
            <div className="flex items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
                <button
                    type="button"
                    onClick={() => navigate("/staff/dashboard/question-bank")}
                    className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-3">
                        Create New Category
                    </h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        Set up a new folder in your question bank to group related assessment items.
                    </p>
                </div>
            </div>

            {/* Main Form Container */}
            <AnimateIn direction="up">
                <form
                    onSubmit={handleSubmit}
                    className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl shadow-sm p-6 sm:p-8 flex flex-col gap-6"
                >
                    {/* Error Alert */}
                    {errorMessage && (
                        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            <div className="flex-1 text-sm text-red-700 dark:text-red-300 leading-relaxed">
                                {errorMessage}
                            </div>
                        </div>
                    )}

                    {/* Course ID & Level Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Course Shadcn Select */}
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                                <BookOpen size={16} className="text-emerald-500" />
                                Course <span className="text-red-500">*</span>
                            </label>
                            <Select
                                key={`course-select-${formData.course_id}`}
                                value={formData.course_id}
                                onValueChange={(val) => handleSelectChange("course_id", val)}
                            >
                                <SelectTrigger className="w-full h-12 rounded-xl bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-sm focus:ring-emerald-500/50">
                                    {selectedCourse ? (
                                        <div className="truncate text-left">
                                            <span className="font-semibold">{selectedCourse.course_code}</span> - {selectedCourse.course_title}
                                        </div>
                                    ) : (
                                        <SelectValue placeholder="Select a course..." />
                                    )}
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                                    {dashboardData?.total_courses?.map((course) => (
                                        <SelectItem
                                            key={course.course_external_id}
                                            value={String(course.course_external_id)}
                                            className="focus:bg-emerald-50 focus:text-emerald-900 dark:focus:bg-emerald-500/10 dark:focus:text-emerald-300 cursor-pointer"
                                        >
                                            <span className="font-semibold">{course.course_code}</span> - {course.course_title}
                                        </SelectItem>
                                    ))}
                                    {(!dashboardData?.total_courses || dashboardData.total_courses.length === 0) && (
                                        <div className="px-2 py-3 text-sm text-zinc-500 text-center">
                                            No courses available.
                                        </div>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Level Shadcn Select */}
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                                <Hash size={16} className="text-emerald-500" />
                                Academic Level <span className="text-red-500">*</span>
                            </label>
                            <Select
                                key={`level-select-${formData.level}`}
                                value={formData.level}
                                onValueChange={(val) => handleSelectChange("level", val)}
                            >
                                <SelectTrigger className="w-full h-12 rounded-xl bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-sm focus:ring-emerald-500/50">
                                    <SelectValue placeholder="Select level..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                                    {["100", "200", "300", "400", "500", "600"].map((lvl) => (
                                        <SelectItem
                                            key={lvl}
                                            value={lvl}
                                            className="focus:bg-emerald-50 focus:text-emerald-900 dark:focus:bg-emerald-500/10 dark:focus:text-emerald-300 cursor-pointer"
                                        >
                                            {lvl} Level
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Category Name */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                            <Type size={16} className="text-emerald-500" />
                            Category Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            required
                            placeholder="e.g. Midterm 1 - Algebra Concepts"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-4 h-12 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-zinc-400"
                        />
                    </div>

                    {/* Description */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                            <AlignLeft size={16} className="text-emerald-500" />
                            Description (Optional)
                        </label>
                        <textarea
                            name="description"
                            placeholder="Provide details about what topics or questions are covered in this category..."
                            value={formData.description}
                            onChange={handleChange}
                            rows={4}
                            className="w-full p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-zinc-400 resize-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-6 border-t border-zinc-100 dark:border-zinc-800/80 mt-2">
                        <button
                            type="button"
                            onClick={() => navigate("/staff/dashboard/question-bank")}
                            disabled={isCreating}
                            className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors disabled:opacity-50 text-center"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isCreating}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-xl text-sm font-semibold transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50"
                        >
                            {isCreating ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    <span>Creating...</span>
                                </>
                            ) : (
                                <>
                                    <FolderPlus size={16} />
                                    <span>Save Category</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </AnimateIn>
        </main>
    );
};

export default CreateQuestionBankCategoryPage;