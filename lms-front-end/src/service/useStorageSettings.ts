import { useState, useEffect, useCallback } from "react";
import BaseRepository from "@/repository/base.repository";
import { endpoint } from "@/utils/endpoint";
import { StorageSettingPaginationSchema, StorageSettingSchema, type CreateStorageSettingPayload, type StorageSetting, type StorageSettingPagination } from "../types/storage.settings.types";

interface UseStorageSettingsListParams {
    initialPage?: number;
    ordering?: string;
}

export const useStorageSettings = ({ initialPage = 1, ordering = "-created_at" }: UseStorageSettingsListParams = {}) => {
    const [data, setData] = useState<StorageSettingPagination | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [page, setPage] = useState<number>(initialPage);
    const [search, setSearch] = useState<string>("");
    const [debouncedSearch, setDebouncedSearch] = useState<string>("");

    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);;
    const [success, setSuccess] = useState<boolean>(false);

    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const repository = new BaseRepository();

    // Debounce search input to prevent spamming the API
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1); // Reset to page 1 on a new search
        }, 500);
        return () => clearTimeout(handler);
    }, [search]);

    const fetchSettings = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const queryParams = new URLSearchParams({
                page: page.toString(),
                ...(debouncedSearch && { search: debouncedSearch }),
                ...(ordering && { ordering }),
            });

            const response = await repository.get(`${endpoint.admin?.storage?.content?.storage_setting?.base}?${queryParams.toString()}`);

            if (!response.success) {
                throw new Error("Failed to fetch storage settings.");
            }

            const validatedData = StorageSettingPaginationSchema.parse(response.data);
            setData(validatedData);
        } catch (err: any) {
            console.error("Fetch Storage Settings Error:", err);
            setError(err.message || "An unexpected error occurred while fetching data.");
        } finally {
            setIsLoading(false);
        }
    }, [page, debouncedSearch, ordering]);

    // Fetch data whenever dependencies change
    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const handleNextPage = () => {
        if (data?.next) setPage((prev) => prev + 1);
    };

    const handlePrevPage = () => {
        if (data?.previous) setPage((prev) => Math.max(prev - 1, 1));
    };

    const createSetting = async (payload: CreateStorageSettingPayload): Promise<StorageSetting | null> => {
        setIsSubmitting(true);
        setError(null);
        setSuccess(false);

        try {
            const url = endpoint.admin?.storage?.content?.storage_setting?.base;
            const response = await repository.post(url, payload);

            if (!response.success) {
                const errorMessage = (response.data as any).detail || (response.data as any).backend?.[0] || "Failed to create storage setting.";
                throw new Error(errorMessage);
            }

            const validatedData = StorageSettingSchema.parse(response.data);
            setSuccess(true);
            return validatedData;
        } catch (err: any) {
            console.error("Create Storage Setting Error:", err);
            setError(err.message || "An unexpected error occurred during creation.");
            return null;
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleActive = async (id: number, currentStatus: boolean, backend: string) => {
        setActionLoading(id);
        setError(null)
        try {
            const response = await repository.put(endpoint.admin.storage.content.storage_setting.base, {
                is_active: !currentStatus,
                backend: backend
            });

            if (!response.success) throw new Error("Failed to update status.");

            setSuccessMessage("Storage setting updated successfully.");
            await fetchSettings()
        } catch (err: any) {
            setError(err.message || "An error occurred while updating.");
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (itemToDelete: number) => {
        if (itemToDelete === null) return;
        setIsLoading(false)
        try {
            const response = await repository.delete(`${endpoint.admin.storage.content.storage_setting.base}/${itemToDelete}/`);

            if (!response.success) throw new Error("Failed to delete storage setting.");

            setSuccessMessage("Storage setting deleted successfully.");
            setIsDeleteModalOpen(false);
            await fetchSettings();
        } catch (err: any) {
            setError(err.message || "An error occurred while deleting.");
            setIsDeleteModalOpen(false);
        } finally {
            setIsLoading(false);
        }
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
        refetch: fetchSettings,
        isSubmitting,
        success,
        createSetting,
        actionLoading,
        successMessage,
        setActionLoading,
        setSuccessMessage,
        isDeleteModalOpen,
        setIsDeleteModalOpen,
        handleDelete,
        handleToggleActive
    };
}