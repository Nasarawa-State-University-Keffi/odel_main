import { useState } from "react";
import BaseRepository from "@/repository/base.repository";
import { endpoint } from "@/utils/endpoint";
import {
    NotificationSettingSchema,
    type NotificationSetting,
    type CreateNotificationSettingPayload
} from "@/types/notification.settings.types";

export const useCreateNotificationSetting = () => {
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<boolean>(false);

    const repository = new BaseRepository();

    const createSetting = async (payload: CreateNotificationSettingPayload): Promise<NotificationSetting | null> => {
        setIsSubmitting(true);
        setError(null);
        setSuccess(false);

        try {
            const url = endpoint.admin.setting.notification.base;
            const response = await repository.post(url, payload);

            if (!response.success) {
                throw new Error((response as any).detail || "Failed to create notification setting.");
            }

            const validatedData = NotificationSettingSchema.parse(response.data);
            setSuccess(true);
            return validatedData;
        } catch (err: any) {
            console.error("Create Notification Setting Error:", err);
            setError(err.message || "An unexpected error occurred during creation.");
            return null;
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        createSetting,
        isSubmitting,
        error,
        success,
        resetState: () => { setError(null); setSuccess(false); }
    };
};