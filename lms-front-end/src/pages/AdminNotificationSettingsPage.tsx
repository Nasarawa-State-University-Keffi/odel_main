import React from "react";
import { 
    Search, 
    Bell, 
    AlertCircle, 
    ChevronLeft, 
    ChevronRight, 
    CheckCircle2, 
    XCircle, 
    Mail, 
    Plus,
    Inbox
} from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useNotificationSetting } from "@/service/useNotificationSetting";

// --- Loading Skeleton Component ---
const NotificationSettingSkeleton = () => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 animate-pulse">
        <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800"></div>
            <div className="space-y-2">
                <div className="h-5 w-36 rounded bg-slate-200 dark:bg-slate-700"></div>
                <div className="h-3 w-48 rounded bg-slate-100 dark:bg-slate-800"></div>
            </div>
        </div>
        <div className="h-8 w-24 rounded-full bg-slate-100 dark:bg-slate-800 sm:self-center"></div>
    </div>
);

const AdminNotificationSettingsPage: React.FC = () => {
    const {
        data,
        isLoading,
        error,
        search,
        setSearch,
        page,
        handleNextPage,
        handlePrevPage
    } = useNotificationSetting();

    const navigate = useNavigate();

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-950 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl">

                {/* Header Section */}
                <div className="mb-8 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end border-b border-slate-200 pb-6 dark:border-slate-800">
                    <div>
                        <div className="mb-2 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400">
                                <Bell className="h-5 w-5" />
                            </div>
                            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                                Notification Settings
                            </h1>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Configure email backends (SMTP, SendGrid, Amazon SES) and delivery protocols.
                        </p>
                    </div>

                    {/* Actions & Search */}
                    <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search settings..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-indigo-500"
                            />
                        </div>
                        <button 
                            onClick={() => navigate("/admin/dashboard/notifications/settings/create")}
                            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-indigo-700 shadow-sm"
                        >
                            <Plus className="h-4 w-4" /> Add Provider
                        </button>
                    </div>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        <p className="text-sm font-semibold">{error}</p>
                    </div>
                )}

                {/* Data List Section */}
                <div className="space-y-4">
                    {isLoading ? (
                        <div className="space-y-4">
                            {[...Array(4)].map((_, i) => <NotificationSettingSkeleton key={i} />)}
                        </div>
                    ) : data?.results.length === 0 ? (
                        <div className="flex min-h-75 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
                            <Inbox className="mb-4 h-12 w-12 text-slate-300 dark:text-slate-700" />
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No notification settings found</h3>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                {search ? `No settings match "${search}".` : "No notification providers have been configured yet."}
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
                                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors ${
                                            setting.is_active 
                                                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400' 
                                                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                        }`}>
                                            <Mail className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-lg font-bold uppercase text-slate-900 dark:text-white">
                                                    {setting.backend_choice}
                                                </h3>
                                                <span className="font-mono text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                                    {setting.id.substring(0, 8)}...
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                Updated: {format(new Date(setting.updated_at), "MMM d, yyyy • HH:mm")}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 sm:self-center">
                                        {setting.is_active ? (
                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                                                <CheckCircle2 className="h-3.5 w-3.5" /> Active Provider
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                                                <XCircle className="h-3.5 w-3.5" /> Inactive
                                            </span>
                                        )}
                                        <button 
                                            onClick={() => navigate(`/admin/dashboard/notifications/settings/${setting.id}`)}
                                            className="rounded-lg px-3 py-1.5 text-xs font-bold text-slate-600 transition-all hover:bg-slate-100 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-indigo-400"
                                        >
                                            View Config
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
        </main>
    );
};

export default AdminNotificationSettingsPage;