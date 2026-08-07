import React from "react";
import {
    Bell,
    CheckCheck,
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
    Inbox
} from "lucide-react";
import { useInAppNotifications } from "@/service/useInAppNotifications";
import { NotificationCard } from "@/components/notifications/NotificationCard";

const NotificationsPage: React.FC = () => {
    const {
        data,
        unreadCount,
        isLoading,
        error,
        search,
        setSearch,
        isReadFilter,
        setIsReadFilter,
        page,
        setPage,
        markAsRead,
        markAllAsRead
    } = useInAppNotifications();

    return (
        <main className="min-h-screen bg-slate-50/50 px-4 py-8 dark:bg-slate-950 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl space-y-6">

                {/* Header Section */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-6 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
                            <Bell className="h-5 w-5" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-950">
                                    {unreadCount > 99 ? "99+" : unreadCount}
                                </span>
                            )}
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                                Notifications
                            </h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Stay updated on assignments, announcements, and grades
                            </p>
                        </div>
                    </div>

                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-xs font-bold text-indigo-600 transition-all hover:bg-indigo-100 dark:border-indigo-900/50 dark:bg-indigo-950/50 dark:text-indigo-400 dark:hover:bg-indigo-900/80"
                        >
                            <CheckCheck className="h-4 w-4" />
                            Mark all as read
                        </button>
                    )}
                </div>

                {/* Filter and Search Controls */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    {/* Status Tabs */}
                    <div className="inline-flex rounded-xl bg-slate-200/60 p-1 dark:bg-slate-900">
                        <button
                            onClick={() => setIsReadFilter(undefined)}
                            className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${isReadFilter === undefined
                                    ? "bg-white text-slate-900 shadow dark:bg-slate-800 dark:text-white"
                                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                                }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setIsReadFilter(false)}
                            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${isReadFilter === false
                                    ? "bg-white text-slate-900 shadow dark:bg-slate-800 dark:text-white"
                                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                                }`}
                        >
                            Unread
                            {unreadCount > 0 && (
                                <span className="rounded-full bg-indigo-100 px-1.5 py-0.2 text-[10px] text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setIsReadFilter(true)}
                            className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${isReadFilter === true
                                    ? "bg-white text-slate-900 shadow dark:bg-slate-800 dark:text-white"
                                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                                }`}
                        >
                            Read
                        </button>
                    </div>

                    {/* Search Field */}
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search notifications..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-xs font-medium text-slate-900 outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-indigo-500"
                        />
                    </div>
                </div>

                {/* Content Section */}
                {isLoading ? (
                    <div className="space-y-3">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-24 w-full rounded-2xl bg-slate-200/60 dark:bg-slate-900 animate-pulse" />
                        ))}
                    </div>
                ) : error ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50/50 p-6 text-center text-xs font-bold text-red-600 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400">
                        {error}
                    </div>
                ) : data?.results.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
                            <Inbox className="h-6 w-6" />
                        </div>
                        <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-white">
                            No notifications
                        </h3>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            You're all caught up! Check back later for new updates.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {data?.results.map((notification) => (
                            <NotificationCard
                                key={notification.id}
                                notification={notification}
                                onMarkAsRead={markAsRead}
                            />
                        ))}
                    </div>
                )}

                {/* Pagination Controls */}
                {!isLoading && data && (data.next || data.previous) && (
                    <div className="flex items-center justify-between border-t border-slate-200 pt-4 dark:border-slate-800">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                            Page {page} of {Math.ceil(data.count / 10) || 1}
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={!data.previous}
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setPage((p) => p + 1)}
                                disabled={!data.next}
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
};

export default NotificationsPage