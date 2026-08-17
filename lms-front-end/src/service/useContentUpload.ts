// src/hooks/useContentUpload.ts
import { useState, useCallback } from "react";
import {
    type FileUploadPayload,
    type YouTubeUploadPayload,
    type ContentResponse,
    ContentResponseSchema
} from "../types/content.upload.types";
import BaseRepository from "@/repository/base.repository";
import { endpoint } from "@/utils/endpoint";

export const useContentUpload = () => {
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [successData, setSuccessData] = useState<ContentResponse | null>(null);
    const repository = new BaseRepository()

    const resetState = () => {
        setError(null);
        setSuccessData(null);
    };

    const uploadFile = useCallback(async (payload: FileUploadPayload) => {
        setIsUploading(true);
        resetState();

        try {
            const formData = new FormData();
            formData.append("file", payload.file);
            formData.append("course_id", payload.course_id);
            formData.append("content_type", payload.content_type);

            if (payload.title) formData.append("title", payload.title);
            if (payload.description) formData.append("description", payload.description);
            if (payload.storage_backend) formData.append("storage_backend", payload.storage_backend);

            const response = await repository.upload(endpoint.staff.dashboard.content.upload.file, formData)

            if (!response.success) {
                const errData = await response.data;
                throw new Error("Failed to upload file.");
            }

            setSuccessData(ContentResponseSchema.parse(response.data));
            return true;
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred during upload.");
            return false;
        } finally {
            setIsUploading(false);
        }
    }, []);

    const uploadYouTubeLink = useCallback(async (payload: YouTubeUploadPayload) => {
        setIsUploading(true);
        resetState();

        try {
            const response = await repository.post(endpoint.staff.dashboard.content.upload.youtube, payload)

            if (!response.success) {
                const errData = await response.data;
                throw new Error("Failed to link YouTube video.");
            }

            setSuccessData(ContentResponseSchema.parse(response.data));
            return true;
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred while linking video.");
            return false;
        } finally {
            setIsUploading(false);
        }
    }, []);

    return {
        isUploading,
        error,
        successData,
        uploadFile,
        uploadYouTubeLink,
        resetState,
    };
};