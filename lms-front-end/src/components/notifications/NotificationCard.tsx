import React from "react";
import { BookOpen, BellRing, AlertCircle, Award, CheckCircle2, ArrowUpRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { InAppNotification } from "@/types/inAppNotification.types";

interface NotificationCardProps {
    notification: InAppNotification;
    onMarkAsRead: (id: string) => void;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({ notification, onMarkAsRead }) => {
    const getNotificationIcon = (type: string) => {
        switch (type) {
            case "ASSIGNMENT_POSTED":
                return <BookOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />;
            case "GRADE_RELEASED":
                return <Award className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
            case "ANNOUNCEMENT_POSTED":
                return <BellRing className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
            default:
                return <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
        }
    };

    const handleClick = () => {
        if (!notification.is_read) {
            onMarkAsRead(notification.id);
        }
        if (notification.action_url) {
            window.location.href = notification.action_url;
        }
    };

    return (
        <div
            onClick={handleClick}
            className={`group relative flex items-start gap-4 rounded-2xl border p-4 transition-all duration-200 cursor-pointer ${
                !notification.is_read
                    ? "border-indigo-200 bg-indigo-50/40 shadow-sm dark:border-indigo-900/40 dark:bg-indigo-950/20 hover:border-indigo-300 dark:hover:border-indigo-800"
                    : "border-slate-200 bg-white dark:border-slate-800/80 dark:bg-slate-900/60 hover:bg-slate-50/80 dark:hover:bg-slate-900"
            }`}
        >
            {/* Unread indicator bar */}
            {!notification.is_read && (
                <span className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-indigo-600 dark:bg-indigo-500" />
            )}

            {/* Icon Wrapper */}
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                !notification.is_read 
                    ? "border-indigo-200 bg-indigo-100/80 dark:border-indigo-800 dark:bg-indigo-900/50" 
                    : "border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800"
            }`}>
                {getNotificationIcon(notification.notification_type)}
            </div>

            {/* Content Body */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <h4 className={`text-xs font-bold truncate ${
                        !notification.is_read ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300"
                    }`}>
                        {notification.title}
                    </h4>
                    <span className="shrink-0 text-[10px] font-medium text-slate-400 dark:text-slate-500">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </span>
                </div>

                <p className="mt-1 text-xs text-slate-600 line-clamp-2 dark:text-slate-400">
                    {notification.message}
                </p>

                {/* Footer Badges & Actions */}
                <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        {notification.notification_type.replace("_", " ")}
                    </span>

                    <div className="flex items-center gap-2">
                        {!notification.is_read && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onMarkAsRead(notification.id);
                                }}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                            >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Mark as read
                            </button>
                        )}
                        {notification.action_url && (
                            <span className="text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                                <ArrowUpRight className="h-4 w-4" />
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};