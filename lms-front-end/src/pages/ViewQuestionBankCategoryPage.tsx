import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft, Loader2, AlertCircle, Edit, Trash2,
    BookOpen, Hash, Layers, FileText, Calendar, CheckCircle2, Clock
} from "lucide-react";
import { toast } from "react-toastify";
import { useStaffQuestionBank } from "@/service/useStaffQuestionBank";
import { useStaffDashboard } from "@/service/useStaffDashboard";
import { useUserContext } from "@/context/UserProvider";
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

export const ViewQuestionBankCategoryPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { fetchCategoryById, deleteCategory, isLoading: isActionLoading } = useStaffQuestionBank();
    const { dashboardData, fetchStaffData } = useStaffDashboard();
    const { user } = useUserContext();

    const [category, setCategory] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [openDeleteModal, setOpenDeleteModal] = useState(false)

    useEffect(() => {
        if (user?.external_id) {
            fetchStaffData(user.external_id);
        }
    }, [user]);

    // Fetch category details by ID
    useEffect(() => {
        if (id) {
            setIsLoading(true);
            fetchCategoryById(id)
                .then((data) => {
                    setCategory(data);
                })
                .catch((err) => {
                    setErrorMessage(typeof err === "string" ? err : "Failed to load category details.");
                })
                .finally(() => {
                    setIsLoading(false);
                });
        }
    }, [id]);

    const handleDelete = async () => {
        if (!id) return;
        try {
            await deleteCategory(id);
            toast.success("Category deleted successfully!");
            navigate("/staff/dashboard/question-bank/categories");
        } catch (err: any) {
            toast.error(typeof err === "string" ? err : "Failed to delete category.");

        }
    };

    if (isLoading) {
        return (
            <div className="w-full max-w-4xl mx-auto px-4 py-20 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading category details...</p>
            </div>
        );
    }

    if (errorMessage || !category) {
        return (
            <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
                <button
                    type="button"
                    onClick={() => navigate("/staff/dashboard/question-bank")}
                    className="self-start p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors flex items-center gap-2 text-sm font-medium"
                >
                    <ArrowLeft size={18} /> Back to Question Bank
                </button>
                <div className="p-6 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-2xl flex items-start gap-4">
                    <AlertCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <h2 className="text-base font-semibold text-red-800 dark:text-red-200">Unable to load category</h2>
                        <p className="text-sm text-red-600 dark:text-red-300 mt-1">{errorMessage || "The requested category could not be found."}</p>
                    </div>
                </div>
            </main>
        );
    }

    const associatedCourse = dashboardData?.total_courses?.find(
        (c) => String(c.course_external_id) === String(category.course_external_id)
    );

    return (
        <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">

            {/* Page Header with Navigation and Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={() => navigate("/staff/dashboard/question-bank")}
                        className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
                            Category Details
                        </h1>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                            Review metadata, question counts, and assigned parameters.
                        </p>
                    </div>
                </div>

                {/* Action Buttons: Edit & Delete */}
                <div className="flex items-center gap-3 self-end sm:self-auto">
                    <button
                        type="button"
                        onClick={() => navigate(`/staff/dashboard/question-bank/categories/edit/${category.id}`)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 text-sm font-semibold transition-colors shadow-sm"
                    >
                        <Edit size={16} className="text-emerald-500" />
                        <span>Edit</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setOpenDeleteModal(p => !p)}
                        disabled={isActionLoading}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 text-sm font-semibold transition-colors shadow-sm disabled:opacity-50"
                    >
                        {isActionLoading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        <span>Delete</span>
                    </button>
                </div>
            </div>

            {/* Main Content Card */}
            <AnimateIn direction="up">
                <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl shadow-sm p-6 sm:p-8 flex flex-col gap-8">

                    {/* Category Title & Description */}
                    <div className="flex flex-col gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/20">
                                {category.level_display || `${category.level} Level`}
                            </span>
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800">
                                ID: {category.id.slice(0, 8)}...
                            </span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
                            {category.name}
                        </h2>
                        <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-100 dark:border-zinc-900">
                            {category.description || "No description provided for this category."}
                        </p>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Course Card */}
                        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 flex flex-col gap-1">
                            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                                <BookOpen size={14} className="text-emerald-500" /> Course Assignment
                            </span>
                            <span className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                                {associatedCourse ? `${associatedCourse.course_code} - ${associatedCourse.course_title}` : `Course ID: ${category.course_external_id}`}
                            </span>
                        </div>

                        {/* Questions Count Card */}
                        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 flex flex-col gap-1">
                            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                                <Layers size={14} className="text-emerald-500" /> Total Questions
                            </span>
                            <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                                {category.questions_count ?? 0} Items
                            </span>
                        </div>

                        {/* Academic Level Card */}
                        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 flex flex-col gap-1">
                            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                                <Hash size={14} className="text-emerald-500" /> Academic Level
                            </span>
                            <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                                {category.level}00 Series
                            </span>
                        </div>
                    </div>

                    {/* Available Question Types */}
                    <div className="flex flex-col gap-3">
                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                            <FileText size={16} className="text-emerald-500" />
                            Available Question Types
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {category.available_question_types && category.available_question_types.length > 0 ? (
                                category.available_question_types.map((type: string, index: number) => (
                                    <span
                                        key={index}
                                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 flex items-center gap-1.5"
                                    >
                                        <CheckCircle2 size={12} className="text-emerald-500" />
                                        {type}
                                    </span>
                                ))
                            ) : (
                                <p className="text-sm text-zinc-500 italic">No question types registered yet.</p>
                            )}
                        </div>
                    </div>

                    {/* Timestamps Footnote */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-6 border-t border-zinc-100 dark:border-zinc-900 text-xs text-zinc-400 dark:text-zinc-500">
                        <div className="flex items-center gap-1.5">
                            <Calendar size={14} />
                            <span>Created: {new Date(category.created_at).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Clock size={14} />
                            <span>Last Updated: {new Date(category.updated_at).toLocaleString()}</span>
                        </div>
                    </div>

                </div>
            </AnimateIn>

            {/* Standalone Shadcn Alert Dialog */}
            <AlertDialog open={!!openDeleteModal} onOpenChange={(open) => !open && setOpenDeleteModal(false)}>
                <AlertDialogContent className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-zinc-900 dark:text-white flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-red-500" />
                            Delete Category
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-zinc-500 dark:text-zinc-400 mt-2">
                            Are you absolutely sure you want to delete <span className="font-semibold text-zinc-900 dark:text-zinc-200">"{category?.name}"</span>?
                            This action cannot be undone and may affect quizzes utilizing these questions.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                        <AlertDialogCancel
                            disabled={isLoading}
                            className="rounded-xl border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
                        >
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleDelete();
                            }}
                            disabled={isLoading}
                            className="bg-red-500 hover:bg-red-600 focus:ring-red-500/50 text-white rounded-xl border-0"
                        >
                            {isLoading ? (
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

export default ViewQuestionBankCategoryPage;