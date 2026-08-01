import BaseRepository from "@/repository/base.repository";
import { SubmissionResponseSchema, type SubmissionResponse } from "@/types/assignment.types";
import { endpoint } from "@/utils/endpoint";
import { useCallback, useState } from "react";
import { z } from "zod";

export const useStudentSubmission = () => {
    const [submission, setSubmission] = useState<SubmissionResponse | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const repository = new BaseRepository();


    const createDraftSubmission = useCallback(async (assignmentId: string, files: File[]) => {
        setIsLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append("assignment_id", assignmentId);
            formData.append("session", "2024/2025");
            formData.append("semester", "First");
            files.forEach((file) => {
                formData.append("files", file);
            });

            const url = endpoint.student.dashboard.assessment.assignment.submissions.create;
            const response = await repository.upload(url, formData);

            const rawPayload = typeof response?.data === 'object' && response?.data && "id" in response.data ? response.data : (response?.data ?? response);

            const validatedData = SubmissionResponseSchema.parse(rawPayload);
            setSubmission(validatedData);
            return validatedData;

        } catch (err: any) {
            console.error("Submission Upload Error:", err);
            if (err instanceof z.ZodError) {
                const firstIssue = err.issues[0];
                setError(`Data mismatch at '${firstIssue.path.join(".")}': ${firstIssue.message}`);
            } else {
                setError(err?.response?.data?.detail || err?.message || "Failed to upload submission files.");
            }
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // 2. Finalize and lock the submission
    const finalizeSubmission = useCallback(async (submissionId: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const url = `${endpoint.student.dashboard.assessment.assignment.submissions.base}${submissionId}/submit/`;
            const payload = {
                confirm: true,
                session: "2024/2025",
                semester: "First"
            };

            await repository.post(url, payload);
            setSubmission((prev) => prev ? { ...prev, status: "submitted" } : null);
            return true;

        } catch (err: any) {
            console.error("Submission Finalize Error:", err);
            setError(err?.response?.data?.detail || err?.message || "Failed to finalize assignment.");
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        submission,
        isLoading,
        error,
        createDraftSubmission,
        finalizeSubmission,
    }
}