import BaseRepository from "@/repository/base.repository";
import { endpoint } from "@/utils/endpoint";
import { useState, useTransition } from "react";
import type { CreateAssignmentPayload, PaginatedAssignments, PaginatedSubmissions, SubmissionQueryParams } from "@/types/assignment.types";

export const useStaffAccessment = () => {
    const [isPending, startTransition] = useTransition();
    const [data, setData] = useState<PaginatedAssignments | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [submissionsData, setSubmissionsData] = useState<PaginatedSubmissions | null>(null);
    const [submissionsError, setSubmissionsError] = useState<string | null>(null);
    const repository = new BaseRepository();

    const fetchAssignments = async (pageUrl?: string) => {
        setError(null);
        startTransition(async () => {
            try {
                const url = pageUrl || endpoint.staff.dashboard.accessment.assignment;
                const response = await repository.get(url);
                setData(response.data as PaginatedAssignments);
            } catch (err: any) {
                setError(err?.response?.data?.message || "Failed to fetch assignments. Please try again.");
            }
        });
    };

    const createAssignment = async (payload: CreateAssignmentPayload) => {
        return new Promise((resolve, reject) => {
            startTransition(async () => {
                try {
                    const response = await repository.post(endpoint.staff.dashboard.accessment.assignment, payload);
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
                const url = `${endpoint.staff.dashboard.accessment.submissions}${queryString ? `?${queryString}` : ''}`;

                const response = await repository.get(url);
                console.log("Submissions data:", response.data);
                setSubmissionsData(response.data as PaginatedSubmissions);
            } catch (err: any) {
                setSubmissionsError(err?.response?.data?.message || "Failed to fetch submissions. Please try again.");
            }
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
    };
};