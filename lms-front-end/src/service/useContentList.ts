// src/hooks/useContentList.ts
import { useState, useEffect, useCallback } from "react";
import { ContentPaginationSchema, type ContentPagination } from "../types/content.types";
import BaseRepository from "@/repository/base.repository";
import { endpoint } from "@/utils/endpoint";

interface UseContentListParams {
    initialPage?: number;
    ordering?: string;
}

export const useContentList = ({ initialPage = 1, ordering = "-created_at" }: UseContentListParams = {}) => {
    const [data, setData] = useState<ContentPagination | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [page, setPage] = useState<number>(initialPage);
    const [search, setSearch] = useState<string>("");
    const [debouncedSearch, setDebouncedSearch] = useState<string>("");

    const repository = new BaseRepository();

    // Debounce search input
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 500);
        return () => clearTimeout(handler);
    }, [search]);

    const fetchContent = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const queryParams = new URLSearchParams({
                page: page.toString(),
                ...(debouncedSearch && { search: debouncedSearch }),
                ...(ordering && { ordering }),
            });

            const response = await repository.get(`${endpoint.content.base}?${queryParams.toString()}`);

            if (!response.success) throw new Error("Failed to fetch learning content");

            const validatedData = ContentPaginationSchema.parse(response.data);

            setData(validatedData);
        } catch (err: any) {
            console.error("Fetch Content Error:", err);
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    }, [page, debouncedSearch, ordering]);

    useEffect(() => {
        fetchContent();
    }, [fetchContent]);

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
        refetch: fetchContent
    };
};