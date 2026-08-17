// src/service/useNotificationSettingDetail.ts
import { useState, useEffect, useCallback } from "react";
import BaseRepository from "@/repository/base.repository";
import { endpoint } from "@/utils/endpoint";
import { 
    NotificationSettingSchema, 
    type NotificationSetting, 
    type UpdateNotificationSettingPayload 
} from "@/types/notification.settings.types";

export const useNotificationSettingDetail = (id?: string) => {
    const repository = new BaseRepository();

    const [setting, setSetting] = useState<NotificationSetting | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [isUpdating, setIsUpdating] = useState<boolean>(false);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);
    const [actionError, setActionError] = useState<string | null>(null);
    const [actionSuccess, setActionSuccess] = useState<string | null>(null);

    // GET: Retrieve setting by ID
    const fetchDetail = useCallback(async () => {
        if (!id) return;
        setIsLoading(true);
        setError(null);
        try {
            const url = `${endpoint.admin.setting.notification.base}${id}/`;
            const response = await repository.get(url);

            if (!response.success) {
                throw new Error((response as any).detail || "Failed to fetch notification setting configuration.");
            }

            const validatedData = NotificationSettingSchema.parse(response.data);
            setSetting(validatedData);
        } catch (err: any) {
            console.error("Fetch Detail Error:", err);
            setError(err.message || "An unexpected error occurred while fetching configuration.");
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchDetail();
    }, [fetchDetail]);

    // PUT: Update setting
    const updateSetting = async (payload: UpdateNotificationSettingPayload): Promise<boolean> => {
        if (!id) return false;
        setIsUpdating(true);
        setActionError(null);
        setActionSuccess(null);

        try {
            const url = `${endpoint.admin.setting.notification.base}${id}/`;
            const response = await repository.put(url, payload);

            if (!response.success) {
                const errorMessage = (response as any).detail || "Failed to update notification setting.";
                throw new Error(errorMessage);
            }

            const validatedData = NotificationSettingSchema.parse(response.data);
            setSetting(validatedData);
            setActionSuccess("Notification configuration updated successfully.");
            return true;
        } catch (err: any) {
            console.error("Update Setting Error:", err);
            setActionError(err.message || "Failed to update configuration.");
            return false;
        } finally {
            setIsUpdating(false);
        }
    };

    // DELETE: Destroy setting
    const deleteSetting = async (): Promise<boolean> => {
        if (!id) return false;
        setIsDeleting(true);
        setActionError(null);

        try {
            const url = `${endpoint.admin.setting.notification.base}${id}/`;
            const response = await repository.delete(url);

            if (!response.success) {
                throw new Error((response as any).detail || "Failed to delete notification setting.");
            }

            return true;
        } catch (err: any) {
            console.error("Delete Setting Error:", err);
            setActionError(err.message || "Failed to delete setting.");
            return false;
        } finally {
            setIsDeleting(false);
        }
    };

    return {
        setting,
        isLoading,
        error,
        updateSetting,
        deleteSetting,
        isUpdating,
        isDeleting,
        actionError,
        actionSuccess,
        setActionError,
        setActionSuccess,
        refetch: fetchDetail
    };
};