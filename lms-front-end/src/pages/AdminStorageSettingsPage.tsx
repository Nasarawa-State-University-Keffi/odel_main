import React, { useState, useEffect } from "react";
import {
    Search,
    Server,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    XCircle,
    HardDrive,
    Plus,
    Trash2,
    Loader2,
    AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import { useStorageSettings } from "@/service/useStorageSettings";
import { useNavigate } from "react-router-dom";

// --- Loading Skeleton Component ---
const StorageSettingSkeleton = () => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 animate-pulse">
        <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800"></div>
            <div className="space-y-2">
                <div className="h-5 w-32 rounded bg-slate-200 dark:bg-slate-700"></div>
                <div className="h-3 w-48 rounded bg-slate-100 dark:bg-slate-800"></div>
            </div>
        </div>
        <div className="h-8 w-24 rounded-full bg-slate-100 dark:bg-slate-800 sm:self-center"></div>
    </div>
);

export const AdminStorageSettingsPage: React.FC = () => {
    const {
        data,
        isLoading,
        error: fetchError,
        search,
        setSearch,
        page,
        handleNextPage,
        handlePrevPage,
        isDeleteModalOpen,
        setIsDeleteModalOpen,
        handleDelete,
        actionLoading,
        handleToggleActive
    } = useStorageSettings();

    const navigate = useNavigate();
    // const repository = new BaseRepository();

    // --- Mutation States ---
    // const [actionLoading, setActionLoading] = useState<number | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);

    const [itemToDelete, setItemToDelete] = useState<number | null>(null);

    // Auto-dismiss messages after 4 seconds
    useEffect(() => {
        if (successMessage || actionError) {
            const timer = setTimeout(() => {
                setSuccessMessage(null);
                setActionError(null);
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [successMessage, actionError]);

    // --- Handlers ---
    // const handleToggleActive = async (id: number, currentStatus: boolean) => {
    //     setActionLoading(id);
    //     setActionError(null);
    //     try {
    //         const response = await repository.patch(`/api/content/storage-settings/${id}/`, {
    //             is_active: !currentStatus
    //         });

    //         if (!response.success) throw new Error("Failed to update status.");

    //         setSuccessMessage("Storage setting updated successfully.");
    //         refetch(); // Refresh the list
    //     } catch (err: any) {
    //         setActionError(err.message || "An error occurred while updating.");
    //     } finally {
    //         setActionLoading(null);
    //     }
    // };

    const confirmDelete = (id: number) => {
        setItemToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteItem = async () => {
        if (itemToDelete === null) return;
        await handleDelete(itemToDelete).then(() => {
            setItemToDelete(null);
        })
    };

    return (
        <main className="relative min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-950 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl">

                {/* Header Section */}
                <div className="mb-8 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end border-b border-slate-200 pb-6 dark:border-slate-800">
                    <div>
                        <div className="mb-2 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400">
                                <HardDrive className="h-5 w-5" />
                            </div>
                            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                                Storage Settings
                            </h1>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Manage and configure your file storage backends (Local, S3, Cloudinary).
                        </p>
                    </div>

                    {/* Actions & Search */}
                    <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search backends..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-indigo-500"
                            />
                        </div>
                        <button
                            onClick={() => navigate("/admin/dashboard/storage-settings/create")}
                            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-indigo-700 shadow-sm"
                        >
                            <Plus className="h-4 w-4" /> Add Backend
                        </button>
                    </div>
                </div>

                {/* Notifications */}
                {(fetchError || actionError) && (
                    <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400 animate-in fade-in slide-in-from-top-2">
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        <p className="text-sm font-semibold">{fetchError || actionError}</p>
                    </div>
                )}
                {successMessage && (
                    <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400 animate-in fade-in slide-in-from-top-2">
                        <CheckCircle2 className="h-5 w-5 shrink-0" />
                        <p className="text-sm font-semibold">{successMessage}</p>
                    </div>
                )}

                {/* Data List Section */}
                <div className="space-y-4">
                    {isLoading ? (
                        <div className="space-y-4">
                            {[...Array(4)].map((_, i) => <StorageSettingSkeleton key={i} />)}
                        </div>
                    ) : data?.results.length === 0 ? (
                        <div className="flex min-h-75 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
                            <Server className="mb-4 h-12 w-12 text-slate-300 dark:text-slate-700" />
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No storage settings found</h3>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                {search ? `No backends match "${search}".` : "You haven't configured any storage backends yet."}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {data?.results.map((setting) => (
                                <div
                                    key={setting.id}
                                    className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-indigo-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-500/50"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors ${setting.is_active ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                                            <Server className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold capitalize text-slate-900 dark:text-white">
                                                {setting.backend} Storage
                                            </h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                ID: {setting.id} • Updated: {format(new Date(setting.updated_at), "MMM d, yyyy")}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 sm:self-center">
                                        {/* Status Badge */}
                                        {setting.is_active ? (
                                            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                                                <CheckCircle2 className="h-3.5 w-3.5" /> Active
                                            </span>
                                        ) : (
                                            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                                                <XCircle className="h-3.5 w-3.5" /> Inactive
                                            </span>
                                        )}

                                        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>

                                        {/* Toggle Switch */}
                                        <div className="flex items-center gap-2">
                                            {actionLoading === setting.id ? (
                                                <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleActive(setting.id, setting.is_active, setting.backend)}
                                                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${setting.is_active ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
                                                        }`}
                                                    role="switch"
                                                    aria-checked={setting.is_active}
                                                    title={setting.is_active ? "Deactivate" : "Activate"}
                                                >
                                                    <span className="sr-only">Toggle status</span>
                                                    <span
                                                        aria-hidden="true"
                                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${setting.is_active ? 'translate-x-5' : 'translate-x-0'
                                                            }`}
                                                    />
                                                </button>
                                            )}
                                        </div>

                                        {/* Delete Button */}
                                        <button
                                            onClick={() => confirmDelete(setting.id)}
                                            className="rounded-lg p-2 text-slate-400 transition-all hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                                            title="Delete Setting"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
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
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <button
                                onClick={handleNextPage}
                                disabled={!data.next}
                                className="flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2.5 text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                )}

            </div>

            {/* --- Professional Delete Confirmation Modal --- */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 animate-in zoom-in-95">
                        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                            <AlertTriangle className="h-7 w-7 text-red-600 dark:text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Delete Storage Setting?</h3>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                            Are you sure you want to delete this storage backend? This action cannot be undone and may break existing file URLs if they rely on this backend.
                        </p>
                        <div className="mt-8 flex items-center justify-end gap-3">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                disabled={isLoading}
                                className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteItem}
                                disabled={isLoading}
                                className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-700 focus:ring-4 focus:ring-red-500/20 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" /> Deleting...
                                    </>
                                ) : (
                                    "Yes, Delete"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};