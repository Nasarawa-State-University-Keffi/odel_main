import BaseRepository from "@/repository/base.repository";
import { endpoint } from "@/utils/endpoint";
import { useState, useTransition } from "react";
import type { Assignment, CreateAssignmentPayload, PaginatedAssignments, PaginatedSubmissions, SubmissionQueryParams, UpdateAssignmentPayload } from "@/types/assignment.types";

export const useStaffAccessment = () => {
    const [isPending, startTransition] = useTransition();
    const [data, setData] = useState<PaginatedAssignments | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [submissionsData, setSubmissionsData] = useState<PaginatedSubmissions | null>(null);
    const [submissionsError, setSubmissionsError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const repository = new BaseRepository();
    interface AssignmentQueryParams {
        page?: number;
        search?: string;
        ordering?: string;
    }

    const fetchAssignments = async (params?: AssignmentQueryParams | string) => {
        setError(null);
        startTransition(async () => {
            try {
                let url = endpoint.staff.dashboard.assessment.assignment.assignment;

                if (typeof params === 'string' && params.startsWith('http')) {
                    url = params;
                }
                // Handle query parameter objects
                else if (typeof params === 'object') {
                    const queryParams = new URLSearchParams();
                    if (params.page) queryParams.append("page", params.page.toString());
                    if (params.search) queryParams.append("search", params.search);
                    if (params.ordering) queryParams.append("ordering", params.ordering);

                    const queryString = queryParams.toString();
                    if (queryString) {
                        url = `${url}${url.endsWith('/') ? '' : '/'}`;
                        url = `${url}?${queryString}`;
                    }
                }

                const response = await repository.get(url);
                setData(response.data as PaginatedAssignments);
            } catch (err: any) {
                setError(err?.response?.data?.message || "Failed to fetch assignments. Please try again.");
            }
        });
    };

    const fetchAssignmentById = async (id: string) => {
        return new Promise<Assignment>((resolve, reject) => {
            startTransition(async () => {
                try {
                    let baseUrl = endpoint.staff.dashboard.assessment.assignment.assignment;
                    const url = `${baseUrl}${id}/`;

                    const response = await repository.get(url);
                    resolve(response.data as Assignment);
                } catch (err: any) {
                    reject(err?.response?.data?.message || "Failed to fetch assignment details.");
                }
            });
        });
    };

    const createAssignment = async (payload: CreateAssignmentPayload) => {
        return new Promise((resolve, reject) => {
            startTransition(async () => {
                try {
                    const response = await repository.post(endpoint.staff.dashboard.assessment.assignment.assignment, payload);
                    resolve(response.data);
                } catch (err: any) {
                    reject(err?.response?.data?.message || "Failed to create assignment.");
                }
            });
        });
    };

    const fetchSubmissions = async (params?: SubmissionQueryParams) => {
        setSubmissionsError(null);
        startTransition(async () => {
            try {
                // Build query string
                const queryParams = new URLSearchParams();
                if (params?.page) queryParams.append("page", params.page.toString());
                if (params?.search) queryParams.append("search", params.search);
                if (params?.ordering) queryParams.append("ordering", params.ordering);

                const queryString = queryParams.toString();
                const url = `${endpoint.staff.dashboard.assessment.assignment.submissions}${queryString ? `?${queryString}` : ''}`;

                const response = await repository.get(url);
                setSubmissionsData(response.data as PaginatedSubmissions);
            } catch (err: any) {
                setSubmissionsError(err?.response?.data?.message || "Failed to fetch submissions. Please try again.");
            }
        });
    };

    const updateAssignment = async (
        id: string,
        payload: UpdateAssignmentPayload,
        options: { isFullReplacement?: boolean } = {}
    ) => {
        return new Promise((resolve, reject) => {
            startTransition(async () => {
                try {
                    let baseUrl = endpoint.staff.dashboard.assessment.assignment.assignment;
                    const url = `${baseUrl}${id}/`;
                    const response = options.isFullReplacement
                        ? await repository.put(url, payload)
                        : await repository.patch(url, payload);

                    resolve(response.data);
                } catch (err: any) {
                    reject(err?.response?.data?.message || "Failed to update assignment.");
                }
            });
        });
    };

    const deleteAssignment = async (id: string) => {
        setDeletingId(id);
        setError(null);
        return new Promise<void>((resolve, reject) => {
            startTransition(async () => {
                try {
                    let baseUrl = endpoint.staff.dashboard.assessment.assignment.assignment;
                    const url = `${baseUrl}${baseUrl.endsWith('/') ? '' : '/'}${id}/`;

                    await repository.delete(url);

                    setData((prev) => {
                        if (!prev) return null;
                        return {
                            ...prev,
                            count: Math.max(0, prev.count - 1),
                            results: prev.results.filter((item) => item.id !== id),
                        };
                    });

                    resolve();
                } catch (err: any) {
                    const msg = err?.response?.data?.message || "Failed to delete assignment.";
                    setError(msg);
                    reject(msg);
                } finally {
                    setDeletingId(null);
                }
            });
        });
    };

    return {
        data,
        error,
        fetchAssignments,
        createAssignment,
        isPending,
        submissionsData,
        submissionsError,
        fetchSubmissions,
        updateAssignment,
        fetchAssignmentById,
        deletingId,
        deleteAssignment,
    };
};