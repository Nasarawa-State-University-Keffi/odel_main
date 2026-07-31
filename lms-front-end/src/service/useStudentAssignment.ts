import { useState, useCallback } from "react";
import BaseRepository from "@/repository/base.repository";
import { endpoint } from "@/utils/endpoint";
import type { PaginatedAssignments } from "@/types/assignment.types";
import { PaginatedAssignmentsSchema } from "@/types/student.assignment.types";
import { z } from "zod";

interface FetchAssignmentsParams {
    page?: number;
    search?: string;
}

export const useStudentAssignment = () => {
    const [data, setData] = useState<PaginatedAssignments | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);

    const repository = new BaseRepository();

    const fetchAssignment = useCallback(async (params: FetchAssignmentsParams = {}) => {
        const { page = 1, search = "" } = params;
        setIsLoading(true);
        setError(null);

        try {
            const queryParams = new URLSearchParams();
            if (page) queryParams.append("page", page.toString());
            if (search) queryParams.append("search", search);

            const queryString = queryParams.toString() ? `?${queryParams.toString()}&session=2024%2F2025&semester=First` : "?session=2024%2F2025&semester=First";
            const url = `${endpoint.student.dashboard.assessment.assignment.base}${queryString}`;

            const response = await repository.get(url);

            const rawPayload = response?.data && typeof response.data === 'object' && "results" in response.data ? response.data : (response?.data ?? response);

            const validatedData = PaginatedAssignmentsSchema.parse(rawPayload);

            setData(validatedData as PaginatedAssignments);
            setCurrentPage(page);
        } catch (err: any) {
            console.error("Assignment Fetch Error:", err);

            if (err instanceof z.ZodError) {
                setError("Data validation error: Unexpected server response format.");
            } else {
                setError(err?.response?.data?.detail || err?.message || "Failed to fetch assignments. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        data,
        isLoading,
        error,
        currentPage,
        fetchAssignment,
    };
};