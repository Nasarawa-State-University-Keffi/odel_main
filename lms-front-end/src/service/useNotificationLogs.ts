import { useState, useEffect, useCallback } from "react";
import BaseRepository from "@/repository/base.repository";
import { endpoint } from "@/utils/endpoint";
import { 
    NotificationLogPaginationSchema, 
    type NotificationLogPagination 
} from "@/types/notification.logs.types";

export const useNotificationLogs = () => {
    const repository = new BaseRepository();

    const [data, setData] = useState<NotificationLogPagination | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Filter States
    const [page, setPage] = useState<number>(1);
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [dateFrom, setDateFrom] = useState<string>("");
    const [dateTo, setDateTo] = useState<string>("");
    const [search, setSearch] = useState<string>("");
    const [debouncedSearch, setDebouncedSearch] = useState<string>("");

    // Debounce search input
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 500);
        return () => clearTimeout(handler);
    }, [search]);

    const fetchLogs = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const queryParams = new URLSearchParams();
            queryParams.append("page", page.toString());

            if (statusFilter) queryParams.append("status", statusFilter);
            if (dateFrom) queryParams.append("date_from", dateFrom);
            if (dateTo) queryParams.append("date_to", dateTo);
            if (debouncedSearch) queryParams.append("search", debouncedSearch);

            const url = `${endpoint.admin?.setting.notification.log}?${queryParams.toString()}`;
            const response = await repository.get(url);

            if (!response.success) {
                const errorData = response as any;
                let message = "Failed to fetch notification logs.";

                if (errorData?.detail) {
                    message = errorData.detail;
                } else if (errorData?.non_field_errors) {
                    message = Array.isArray(errorData.non_field_errors) 
                        ? errorData.non_field_errors.join(" ") 
                        : errorData.non_field_errors;
                } else if (typeof errorData === "object") {
                    const firstKey = Object.keys(errorData)[0];
                    if (firstKey) message = `${firstKey}: ${errorData[firstKey]}`;
                }

                throw new Error(message);
            }

            const validatedData = NotificationLogPaginationSchema.parse(response.data);
            setData(validatedData);
        } catch (err: any) {
            console.error("Fetch Notification Logs Error:", err);
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    }, [page, statusFilter, dateFrom, dateTo, debouncedSearch]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const handleNextPage = () => {
        if (data?.next) setPage((prev) => prev + 1);
    };

    const handlePrevPage = () => {
        if (data?.previous) setPage((prev) => Math.max(prev - 1, 1));
    };

    const resetFilters = () => {
        setStatusFilter("");
        setDateFrom("");
        setDateTo("");
        setSearch("");
        setPage(1);
    };

    return {
        data,
        isLoading,
        error,
        search,
        setSearch,
        statusFilter,
        setStatusFilter: (val: string) => { setStatusFilter(val); setPage(1); },
        dateFrom,
        setDateFrom: (val: string) => { setDateFrom(val); setPage(1); },
        dateTo,
        setDateTo: (val: string) => { setDateTo(val); setPage(1); },
        page,
        handleNextPage,
        handlePrevPage,
        resetFilters,
        refetch: fetchLogs
    };
};