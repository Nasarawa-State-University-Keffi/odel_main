import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Search, Plus, FolderOpen, MoreVertical,
    Layers, BookOpen,  AlertCircle,
    ChevronLeft, ChevronRight, Edit2, Trash2, Loader2
} from "lucide-react";
import { toast } from "react-toastify";
import { useStaffQuestionBank } from "@/service/useStaffQuestionBank";
import { AnimateIn } from "@/components/ui/animate-in";
import type { QuestionBankCategory } from "@/types/questionBank.types";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


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

export const QuestionBankCategoriesPage = () => {
    const navigate = useNavigate();
    const { fetchCategories, deleteCategory, isLoading, error } = useStaffQuestionBank();

    const [categories, setCategories] = useState<QuestionBankCategory[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchInput, setSearchInput] = useState("");

    const [categoryToDelete, setCategoryToDelete] = useState<{ id: string, name: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const loadCategories = (page: number, search: string) => {
        fetchCategories({ page, search, ordering: "-created_at" })
            .then((data) => {
                setCategories(data.results);
                setTotalCount(data.count);
            })
            .catch(() => { });
    };

    useEffect(() => {
        loadCategories(currentPage, searchQuery);
    }, [currentPage, searchQuery]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
        setSearchQuery(searchInput);
    };


    const confirmDelete = async () => {
        if (!categoryToDelete) return;

        setIsDeleting(true);
        try {
            await deleteCategory(categoryToDelete.id);
            toast.success("Category deleted successfully.");
            loadCategories(currentPage, searchQuery);
        } catch (err: any) {
            toast.error(typeof err === "string" ? err : "Failed to delete category.");
        } finally {
            setIsDeleting(false);
            setCategoryToDelete(null);
        }
    };

    const totalPages = Math.ceil(totalCount / 10);

    return (
        <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8 relative">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-3">
                        <FolderOpen className="text-emerald-500" size={28} />
                        Question Bank
                    </h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        Manage categories and organize your assessment questions.
                    </p>
                </div>
                <button
                    onClick={() => navigate("/staff/dashboard/question-bank/create")}
                    className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md shadow-emerald-500/20 whitespace-nowrap"
                >
                    <Plus size={18} />
                    <span>Create Category</span>
                </button>
            </div>

            {/* Filters / Search */}
            <div className="bg-white dark:bg-zinc-950 p-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row gap-2">
                <form onSubmit={handleSearch} className="flex-1 relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search categories by name..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border-none text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                    />
                </form>
                <button
                    type="submit"
                    onClick={handleSearch}
                    className="px-6 py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-sm font-semibold transition-colors"
                >
                    Search
                </button>
            </div>

            {/* Main Content Area */}
            {error ? (
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 p-6 rounded-2xl text-center">
                    <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-red-800 dark:text-red-300">Failed to load categories</h3>
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
                </div>
            ) : isLoading && !categories.length ? (
                /* Loading Skeleton Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                        <div key={n} className="h-48 bg-zinc-100 dark:bg-zinc-900/50 rounded-2xl animate-pulse border border-zinc-200 dark:border-zinc-800"></div>
                    ))}
                </div>
            ) : categories.length === 0 ? (
                /* Empty State */
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-zinc-50 dark:bg-zinc-950/50">
                    <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mb-4">
                        <FolderOpen size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">No Categories Found</h3>
                    <p className="text-zinc-500 dark:text-zinc-400 max-w-sm mb-6">
                        {searchQuery
                            ? `No categories match your search "${searchQuery}". Try a different term.`
                            : "You haven't created any question categories yet. Create your first one to get started."}
                    </p>
                    {!searchQuery && (
                        <button
                            onClick={() => navigate("/staff/dashboard/question-bank/create")}
                            className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 px-6 py-3 rounded-xl font-semibold text-sm transition-all"
                        >
                            <Plus size={18} /> Create Category
                        </button>
                    )}
                </div>
            ) : (
                /* Categories Grid */
                <div className="flex flex-col gap-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {categories.map((category, idx) => (
                            <AnimateIn key={category.id} direction="up" delay={idx * 0.05}>
                                <div
                                    onClick={() => navigate(`/staff/dashboard/question-bank/${category.id}`)}
                                    className="group bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 hover:shadow-lg hover:border-emerald-500/30 transition-all cursor-pointer flex flex-col h-full relative overflow-hidden"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-2.5 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 rounded-xl group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                                            <Layers size={22} />
                                        </div>
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 rounded-md text-xs font-semibold">
                                            <BookOpen size={12} />
                                            Lvl {category.level_display || category.level}
                                        </div>
                                    </div>

                                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2 line-clamp-1 group-hover:text-emerald-500 transition-colors">
                                        {category.name}
                                    </h3>

                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-6 flex-1">
                                        {category.description || "No description provided."}
                                    </p>

                                    <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="flex items-center justify-center w-6 h-6 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                                                {category.questions_count}
                                            </span>
                                            <span className="text-zinc-600 dark:text-zinc-400 font-medium">Questions</span>
                                        </div>

                                        {/* Action Menu */}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger>
                                                <button
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors outline-none"
                                                >
                                                    <MoreVertical size={18} />
                                                </button>
                                            </DropdownMenuTrigger>

                                            <DropdownMenuContent align="end" className="w-40 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg">
                                                <DropdownMenuItem
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/staff/dashboard/question-bank/categories/edit/${category.id}`);
                                                    }}
                                                    className="cursor-pointer flex items-center gap-2 text-zinc-700 dark:text-zinc-300 focus:bg-zinc-100 dark:focus:bg-zinc-900 rounded-lg p-2"
                                                >
                                                    <Edit2 size={16} />
                                                    <span className="font-medium text-sm">Edit</span>
                                                </DropdownMenuItem>

                                                <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800 my-1" />

                                                <DropdownMenuItem
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setCategoryToDelete({ id: category.id, name: category.name });
                                                    }}
                                                    className="cursor-pointer flex items-center gap-2 text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/30 focus:text-red-700 dark:focus:text-red-300 rounded-lg p-2"
                                                >
                                                    <Trash2 size={16} />
                                                    <span className="font-medium text-sm">Delete</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            </AnimateIn>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between bg-white dark:bg-zinc-950 px-6 py-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 hidden sm:block">
                                Showing page <span className="font-semibold text-zinc-900 dark:text-white">{currentPage}</span> of <span className="font-semibold text-zinc-900 dark:text-white">{totalPages}</span>
                            </p>

                            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1 || isLoading}
                                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft size={16} />
                                    Previous
                                </button>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages || isLoading}
                                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Next
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Standalone Shadcn Alert Dialog */}
            <AlertDialog open={!!categoryToDelete} onOpenChange={(open) => !open && setCategoryToDelete(null)}>
                <AlertDialogContent className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-zinc-900 dark:text-white flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-red-500" />
                            Delete Category
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-zinc-500 dark:text-zinc-400 mt-2">
                            Are you absolutely sure you want to delete <span className="font-semibold text-zinc-900 dark:text-zinc-200">"{categoryToDelete?.name}"</span>?
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

export default QuestionBankCategoriesPage;