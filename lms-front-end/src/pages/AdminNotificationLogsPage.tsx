import React, { useState } from "react";
import { 
    Search, 
    FileText, 
    AlertCircle, 
    ChevronLeft, 
    ChevronRight, 
    CheckCircle2, 
    XCircle, 
    Clock, 
    Calendar,
    Filter,
    RotateCcw,
    Eye,
    X,
    ShieldCheck,
    Send
} from "lucide-react";
import { format } from "date-fns";
import { useNotificationLogs } from "@/service/useNotificationLogs";
import { useNotificationLogDetail } from "@/service/useNotificationLogDetail";
import type { NotificationLog } from "@/types/notification.logs.types";

// Skeleton Loader
const LogItemSkeleton = () => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 animate-pulse">
        <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800"></div>
            <div className="space-y-2">
                <div className="h-4 w-48 rounded bg-slate-200 dark:bg-slate-700"></div>
                <div className="h-3 w-64 rounded bg-slate-100 dark:bg-slate-800"></div>
            </div>
        </div>
        <div className="h-7 w-20 rounded-full bg-slate-100 dark:bg-slate-800 sm:self-center"></div>
    </div>
);

const AdminNotificationLogsPage: React.FC = () => {
    const {
        data,
        isLoading,
        error,
        search,
        setSearch,
        statusFilter,
        setStatusFilter,
        dateFrom,
        setDateFrom,
        dateTo,
        setDateTo,
        page,
        handleNextPage,
        handlePrevPage,
        resetFilters
    } = useNotificationLogs();

    // Modal view state
    const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
    const { log: detailLog, isLoading: isDetailLoading, error: detailError } = useNotificationLogDetail(selectedLogId);

    const getStatusBadge = (status: string) => {
        switch (status.toLowerCase()) {
            case "sent":
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Sent
                    </span>
                );
            case "failed":
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20">
                        <XCircle className="h-3.5 w-3.5" /> Failed
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">
                        <Clock className="h-3.5 w-3.5 text-amber-500" /> {status}
                    </span>
                );
        }
    };

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-950 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">

                {/* Header Section */}
                <div className="mb-8 border-b border-slate-200 pb-6 dark:border-slate-800">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400">
                            <FileText className="h-5 w-5" />
                        </div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                            Notification Delivery Logs
                        </h1>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Read-only audit history of outbound email dispatches and provider response logs.
                    </p>
                </div>

                {/* Filters Bar */}
                <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        
                        {/* Search Input */}
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search recipient, subject..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-xs font-medium text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-indigo-500"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="relative">
                            <Filter className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-xs font-medium text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-indigo-500"
                            >
                                <option value="">All Statuses</option>
                                <option value="sent">Sent</option>
                                <option value="failed">Failed</option>
                                <option value="pending">Pending</option>
                            </select>
                        </div>

                        {/* Date From */}
                        <div className="relative">
                            <Calendar className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-xs font-medium text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-indigo-500"
                            />
                        </div>

                        {/* Date To */}
                        <div className="relative">
                            <Calendar className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-xs font-medium text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    {/* Filter Action Reset */}
                    {(statusFilter || dateFrom || dateTo || search) && (
                        <div className="flex items-center justify-end border-t border-slate-100 pt-3 dark:border-slate-800">
                            <button
                                onClick={resetFilters}
                                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
                            >
                                <RotateCcw className="h-3.5 w-3.5" /> Reset Filters
                            </button>
                        </div>
                    )}
                </div>

                {/* API Error Notification */}
                {error && (
                    <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400 animate-in fade-in">
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        <p className="text-sm font-semibold">{error}</p>
                    </div>
                )}

                {/* Logs List Section */}
                <div className="space-y-3">
                    {isLoading ? (
                        <div className="space-y-3">
                            {[...Array(5)].map((_, i) => <LogItemSkeleton key={i} />)}
                        </div>
                    ) : data?.results.length === 0 ? (
                        <div className="flex min-h-75 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
                            <Send className="mb-4 h-12 w-12 text-slate-300 dark:text-slate-700" />
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No delivery logs found</h3>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                Try modifying your search or date range filters.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {data?.results.map((log: NotificationLog) => (
                                <div
                                    key={log.id}
                                    onClick={() => setSelectedLogId(log.id)}
                                    className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:border-indigo-300 hover:shadow-md cursor-pointer dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-500/50"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                            <FileText className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                                    {log.subject}
                                                </h3>
                                                <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                                    {log.backend_used}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                To: <span className="font-semibold text-slate-700 dark:text-slate-300">{log.recipient}</span> • {format(new Date(log.created_at), "MMM d, yyyy • HH:mm:ss")}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 sm:self-center">
                                        {getStatusBadge(log.status)}
                                        <button className="rounded-lg p-2 text-slate-400 transition-colors group-hover:bg-slate-100 group-hover:text-indigo-600 dark:group-hover:bg-slate-800 dark:group-hover:text-indigo-400">
                                            <Eye className="h-4 w-4" />
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
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Page <span className="font-bold text-slate-900 dark:text-white">{page}</span> • Total records: <span className="font-bold text-slate-900 dark:text-white">{data.count}</span>
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handlePrevPage}
                                disabled={!data.previous}
                                className="flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2.5 text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button
                                onClick={handleNextPage}
                                disabled={!data.next}
                                className="flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2.5 text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* --- Log Detail Viewer Drawer/Modal --- */}
            {selectedLogId && (
                <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/50 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in">
                    <div className="h-full w-full max-w-2xl rounded-none sm:rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 overflow-y-auto flex flex-col justify-between animate-in slide-in-from-right">
                        <div>
                            {/* Drawer Header */}
                            <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Audit Delivery Detail</h3>
                                </div>
                                <button
                                    onClick={() => setSelectedLogId(null)}
                                    className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Drawer Content */}
                            {isDetailLoading ? (
                                <div className="py-20 text-center">
                                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
                                    <p className="mt-3 text-xs font-semibold text-slate-500">Retrieving audit record...</p>
                                </div>
                            ) : detailError ? (
                                <div className="my-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-600 dark:border-red-900/50 dark:bg-red-950/30">
                                    <AlertCircle className="h-5 w-5 shrink-0" />
                                    <p className="text-xs font-semibold">{detailError}</p>
                                </div>
                            ) : detailLog ? (
                                <div className="mt-6 space-y-6">
                                    {/* Overview Metadata */}
                                    <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-950/50 text-xs">
                                        <div>
                                            <span className="text-slate-400 font-medium">Log ID</span>
                                            <p className="font-mono text-slate-800 dark:text-slate-200 mt-1 truncate">{detailLog.id}</p>
                                        </div>
                                        <div>
                                            <span className="text-slate-400 font-medium">Backend Used</span>
                                            <p className="font-semibold uppercase text-indigo-600 dark:text-indigo-400 mt-1">{detailLog.backend_used}</p>
                                        </div>
                                        <div>
                                            <span className="text-slate-400 font-medium">Created At</span>
                                            <p className="text-slate-800 dark:text-slate-200 mt-1">{format(new Date(detailLog.created_at), "MMM d, yyyy • HH:mm:ss")}</p>
                                        </div>
                                        <div>
                                            <span className="text-slate-400 font-medium">Sent At</span>
                                            <p className="text-slate-800 dark:text-slate-200 mt-1">
                                                {detailLog.sent_at ? format(new Date(detailLog.sent_at), "MMM d, yyyy • HH:mm:ss") : "N/A"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Recipient & Subject */}
                                    <div className="space-y-3 text-xs">
                                        <div>
                                            <label className="font-bold text-slate-900 dark:text-white">Recipient Email</label>
                                            <p className="mt-1 font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 p-2.5 rounded-xl">{detailLog.recipient}</p>
                                        </div>
                                        <div>
                                            <label className="font-bold text-slate-900 dark:text-white">Subject</label>
                                            <p className="mt-1 text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 p-2.5 rounded-xl">{detailLog.subject}</p>
                                        </div>
                                    </div>

                                    {/* Error Message if Failed */}
                                    {detailLog.error_message && (
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-red-600 dark:text-red-400">Error Exception Message</label>
                                            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-mono text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
                                                {detailLog.error_message}
                                            </div>
                                        </div>
                                    )}

                                    {/* Body Text Output */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-900 dark:text-white">Email Body Text</label>
                                        <textarea
                                            readOnly
                                            rows={8}
                                            value={detailLog.body_text || "No plain text content available."}
                                            className="w-full rounded-xl border border-slate-200 bg-slate-950 p-3 font-mono text-xs text-slate-300 outline-none dark:border-slate-800"
                                        />
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        {/* Drawer Footer */}
                        <div className="mt-6 border-t border-slate-200 pt-4 dark:border-slate-800 flex justify-end">
                            <button
                                onClick={() => setSelectedLogId(null)}
                                className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700"
                            >
                                Close Audit View
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};


export default AdminNotificationLogsPage;