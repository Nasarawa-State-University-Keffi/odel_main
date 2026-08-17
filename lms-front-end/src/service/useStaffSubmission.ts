import BaseRepository from "@/repository/base.repository";
import type { PaginatedSubmissions, SubmissionQueryParams } from "@/types/assignment.types";
import { StaffGradeResponseSchema, StaffSubmissionDetailSchema, type StaffSubmissionDetail } from "@/types/staff.submission.types";
import { endpoint } from "@/utils/endpoint";
import { useCallback, useState, useTransition } from "react";

export const useStaffSubmission = () => {
    const [isPending, startTransition] = useTransition()
    const [submissionsData, setSubmissionsData] = useState<PaginatedSubmissions | null>(null);
    const [submissionsError, setSubmissionsError] = useState<string | null>(null);

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isGrading, setIsGrading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [submission, setSubmission] = useState<StaffSubmissionDetail | null>(null);

    const repository = new BaseRepository();

    const fetchSubmissions = async (params?: SubmissionQueryParams) => {
        setSubmissionsError(null);
        startTransition(async () => {
            try {
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


    const fetchSubmission = useCallback(async (id: string) => {
        setIsLoading(true);
        setError(null);
        try {
            // Assuming your endpoint object has this base path structure
            const url = `/staff/assessment/submissions/${id}/`;
            const response = await repository.get(url);

            const rawPayload = typeof response.data === "object" && response?.data && "id" in response.data ? response.data : (response?.data ?? response);
            const validatedData = StaffSubmissionDetailSchema.parse(rawPayload);

            setSubmission(validatedData);
        } catch (err: any) {
            console.error("Fetch Submission Error:", err);
            setError(err?.response?.data?.detail || "Failed to load submission details.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    const submitGrade = useCallback(async (id: string, marks: string) => {
        setIsGrading(true);
        setError(null);
        try {
            const url = `/staff/assessment/submissions/${id}/grade/`;
            const payload = { marks };

            const response = await repository.post(url, payload);
            const rawPayload = typeof response.data === "object" && response?.data && "id" in response.data ? response.data : (response?.data ?? response);
            const validatedGrade = StaffGradeResponseSchema.parse(rawPayload);

            // Update local submission state to reflect the new grade
            setSubmission((prev) => prev ? {
                ...prev,
                status: "graded",
                marks: validatedGrade.marks,
                graded_at: validatedGrade.graded_at
            } : null);

            return true;
        } catch (err: any) {
            console.error("Submit Grade Error:", err);
            setError(err?.response?.data?.detail || "Failed to submit grade.");
            throw err;
        } finally {
            setIsGrading(false);
        }
    }, []);

    return {
        fetchSubmissions,
        isPending,
        submissionsData,
        submissionsError,
        fetchSubmission,
        submitGrade,
        isLoading,
        isGrading,
        error,
        submission

    }
}