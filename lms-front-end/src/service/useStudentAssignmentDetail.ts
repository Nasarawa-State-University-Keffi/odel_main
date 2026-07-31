// service/useStudentAssignmentDetail.ts
import { useState, useCallback } from "react";
import BaseRepository from "@/repository/base.repository";
import { endpoint } from "@/utils/endpoint";
import { AssignmentDetailSchema, type AssignmentDetail } from "@/types/student.assignment.types";
import { z } from "zod";

export const useStudentAssignmentDetail = (id: string | undefined) => {
    const [data, setData] = useState<AssignmentDetail | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const repository = new BaseRepository();

    const fetchAssignmentDetail = useCallback(async () => {
        if (!id) return;
        setIsLoading(true);
        setError(null);

        try {
            // Hardcoded compulsory parameters as requested
            const sessionParam = encodeURIComponent("2024/2025");
            const semesterParam = encodeURIComponent("First");

            const url = `${endpoint.student.dashboard.assessment.assignment.base}${id}/?session=${sessionParam}&semester=${semesterParam}`;

            const response = await repository.get(url);
            
            // Safely unwrap data
            const rawPayload = response?.data && typeof response.data === 'object' && "id" in response.data ? response.data : (response?.data ?? response);

            // Validate against Zod Schema
            const validatedData = AssignmentDetailSchema.parse(rawPayload);
            setData(validatedData as AssignmentDetail);

        } catch (err: any) {
            console.error("Assignment Detail Fetch Error:", err);
            if (err instanceof z.ZodError) {
                setError("Data validation error: Unexpected server response format.");
            } else {
                setError(err?.response?.data?.detail || err?.message || "Failed to fetch assignment details.");
            }
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    return {
        data,
        isLoading,
        error,
        fetchAssignmentDetail,
    };
};