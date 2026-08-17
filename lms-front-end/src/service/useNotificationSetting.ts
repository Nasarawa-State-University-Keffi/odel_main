import { useState, useEffect, useCallback } from "react";
import BaseRepository from "@/repository/base.repository";
import { endpoint } from "@/utils/endpoint";
import {
    NotificationSettingPaginationSchema,
    type NotificationSettingPagination,
    type CreateNotificationSettingPayload
} from "@/types/notification.settings.types";

interface UseNotificationSettingsParams {
    initialPage?: number;
    ordering?: string;
}

export const useNotificationSetting = ({ initialPage = 1, ordering = "-created_at" }: UseNotificationSettingsParams = {}) => {
    const repository = new BaseRepository();

    const [data, setData] = useState<NotificationSettingPagination | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [page, setPage] = useState<number>(initialPage);
    const [search, setSearch] = useState<string>("");
    const [debouncedSearch, setDebouncedSearch] = useState<string>("");

    // Debounce search input to avoid unnecessary API requests
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 500);
        return () => clearTimeout(handler);
    }, [search]);

    const fetchNotificationSettings = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const queryParams = new URLSearchParams({
                page: page.toString(),
                ...(debouncedSearch && { search: debouncedSearch }),
                ...(ordering && { ordering }),
            });
            const url = `${endpoint.admin?.setting?.notification?.base}?${queryParams.toString()}`;
            const response = await repository.get(url);

            if (!response.success) {
                throw new Error("Failed to fetch notification settings.");
            }

            const validatedData = NotificationSettingPaginationSchema.parse(response.data);
            setData(validatedData);
        } catch (err: any) {
            console.error("Fetch Notification Settings Error:", err);
            setError(err.message || "An unexpected error occurred while fetching settings.");
        } finally {
            setIsLoading(false);
        }
    }, [page, debouncedSearch, ordering]);

    useEffect(() => {
        fetchNotificationSettings();
    }, [fetchNotificationSettings]);

    const handleNextPage = () => {
        if (data?.next) setPage((prev) => prev + 1);
    };

    const handlePrevPage = () => {
        if (data?.previous) setPage((prev) => Math.max(prev - 1, 1));
    };

   

    return {
        data,
        isLoading,
        error,
        search,
        setSearch,
        page,
        handleNextPage,
        handlePrevPage,
        refetch: fetchNotificationSettings,
    };
};