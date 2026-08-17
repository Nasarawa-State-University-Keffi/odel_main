import React from "react";
import { Search, Library, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { ContentCard, ContentCardSkeleton } from "../components/content/ContentCard";
import { useContentList } from "@/service/useContentList";

export const LearningContentPage: React.FC = () => {
    const {
        data,
        isLoading,
        error,
        search,
        setSearch,
        page,
        handleNextPage,
        handlePrevPage
    } = useContentList();

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-950 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">

                {/* Header Section */}
                <div className="mb-8 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end border-b border-slate-200 pb-6 dark:border-slate-800">
                    <div>
                        <div className="mb-2 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400">
                                <Library className="h-5 w-5" />
                            </div>
                            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                                Learning Materials
                            </h1>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Browse, search, and access course notes, video lessons, and resources.
                        </p>
                    </div>

                    {/* Search Bar */}
                    <div className="w-full md:w-80">
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search materials by title..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-indigo-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Error State */}
                {error && (
                    <div className="mb-8 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        <p className="text-sm font-semibold">{error}</p>
                    </div>
                )}

                {/* Content List Layout */}
                <div className="space-y-4">
                    {isLoading ? (
                        <div className="space-y-4">
                            {[...Array(4)].map((_, i) => <ContentCardSkeleton key={i} />)}
                        </div>
                    ) : data?.results.length === 0 ? (
                        <div className="flex min-h-[350px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
                            <Library className="mb-4 h-12 w-12 text-slate-300 dark:text-slate-700" />
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No content found</h3>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                {search ? `No results match "${search}". Try adjusting your search query.` : "There are currently no learning materials available."}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {data?.results.map((item) => (
                                <ContentCard key={item.id} item={item} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Pagination Controls */}
                {!isLoading && data && (data.next || data.previous) && (
                    <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-6 dark:border-slate-800">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Showing page <span className="font-bold text-slate-900 dark:text-white">{page}</span>
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handlePrevPage}
                                disabled={!data.previous}
                                className="flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2.5 text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                                aria-label="Previous page"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <button
                                onClick={handleNextPage}
                                disabled={!data.next}
                                className="flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2.5 text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                                aria-label="Next page"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </main>
    );
};