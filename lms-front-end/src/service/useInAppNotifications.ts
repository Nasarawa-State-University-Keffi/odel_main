import { useState, useEffect, useCallback } from "react";
import BaseRepository from "@/repository/base.repository";
import { endpoint } from "@/utils/endpoint";
import {
    InAppNotificationPaginationSchema,
    UnreadCountSchema,
    type InAppNotificationPagination
} from "@/types/inAppNotification.types";

export const useInAppNotifications = () => {
    const repository = new BaseRepository();

    const [data, setData] = useState<InAppNotificationPagination | null>(null);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Filters & Pagination
    const [page, setPage] = useState<number>(1);
    const [isReadFilter, setIsReadFilter] = useState<boolean | undefined>(undefined);
    const [search, setSearch] = useState<string>("");
    const [debouncedSearch, setDebouncedSearch] = useState<string>("");

    // Debounce search input
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 400);
        return () => clearTimeout(handler);
    }, [search]);

    const fetchUnreadCount = useCallback(async () => {
        try {
            const url = `${endpoint.notifications?.inApp?.base}unread-count/`;
            const response = await repository.get(url);
            if (response.success) {
                const parsed = UnreadCountSchema.parse(response.data);
                setUnreadCount(parsed.unread_count);
            }
        } catch (err) {
            console.error("Failed to fetch unread count:", err);
        }
    }, []);

    const fetchNotifications = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const queryParams = new URLSearchParams();
            queryParams.append("page", page.toString());

            if (isReadFilter !== undefined) {
                queryParams.append("is_read", isReadFilter.toString());
            }
            if (debouncedSearch) {
                queryParams.append("search", debouncedSearch);
            }

            const baseUrl = endpoint.notifications?.inApp?.base;
            const url = `${baseUrl}?${queryParams.toString()}`;
            const response = await repository.get(url);

            if (!response.success) {
                throw new Error((response.data as any)?.detail || "Failed to load notifications.");
            }

            const validatedData = InAppNotificationPaginationSchema.parse(response.data);
            setData(validatedData);
        } catch (err: any) {
            console.error("Fetch Notifications Error:", err);
            setError(err.message || "An error occurred while fetching notifications.");
        } finally {
            setIsLoading(false);
        }
    }, [page, isReadFilter, debouncedSearch]);

    useEffect(() => {
        fetchNotifications();
        fetchUnreadCount();
    }, [fetchNotifications, fetchUnreadCount]);

    // Mark single notification as read
    const markAsRead = async (id: string) => {
        try {
            const baseUrl = endpoint.notifications?.inApp?.base || "/api/notifications/in-app/";
            const response = await repository.post(`${baseUrl}${id}/mark-read/`, {});

            if (response.success) {
                // Optimistic UI update
                setData((prev) => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        results: prev.results.map((item) =>
                            item.id === id ? { ...item, is_read: true, read_at: new Date().toISOString() } : item
                        )
                    };
                });
                setUnreadCount((prev) => Math.max(0, prev - 1));
            }
        } catch (err) {
            console.error("Mark as read failed:", err);
        }
    };

    // Mark all notifications as read
    const markAllAsRead = async () => {
        try {
            const baseUrl = endpoint.notifications?.inApp?.base;
            const response = await repository.post(`${baseUrl}mark-all-read/`, {});

            if (response.success) {
                setData((prev) => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        results: prev.results.map((item) => ({
                            ...item,
                            is_read: true,
                            read_at: new Date().toISOString()
                        }))
                    };
                });
                setUnreadCount(0);
            }
        } catch (err) {
            console.error("Mark all as read failed:", err);
        }
    };

    return {
        data,
        unreadCount,
        isLoading,
        error,
        search,
        setSearch,
        isReadFilter,
        setIsReadFilter: (val: boolean | undefined) => { setIsReadFilter(val); setPage(1); },
        page,
        setPage,
        markAsRead,
        markAllAsRead,
        refetch: fetchNotifications,
        refetchUnreadCount: fetchUnreadCount
    };
};