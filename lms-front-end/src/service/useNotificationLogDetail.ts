// src/service/useNotificationLogDetail.ts
import { useState, useEffect, useCallback } from "react";
import BaseRepository from "@/repository/base.repository";
import { endpoint } from "@/utils/endpoint";
import { NotificationLogSchema, type NotificationLog } from "@/types/notification.logs.types";

export const useNotificationLogDetail = (id: string | null) => {
    const repository = new BaseRepository();

    const [log, setLog] = useState<NotificationLog | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchDetail = useCallback(async () => {
        if (!id) {
            setLog(null);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const url = `${endpoint.admin.setting.notification.log}/${id}/`;
            const response = await repository.get(url);

            if (!response.success) {
                throw new Error((response as any).detail || "Log record not found.");
            }

            const validatedData = NotificationLogSchema.parse(response.data);
            setLog(validatedData);
        } catch (err: any) {
            console.error("Fetch Log Detail Error:", err);
            setError(err.message || "Could not retrieve audit log details.");
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchDetail();
    }, [fetchDetail]);

    return {
        log,
        isLoading,
        error
    };
};