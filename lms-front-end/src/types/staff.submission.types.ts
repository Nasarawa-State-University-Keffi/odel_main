import { z } from "zod";

export const StaffSubmissionFileSchema = z.object({
    id: z.string().uuid(),
    url: z.string(),
    storage_path: z.string().optional().nullable(),
    original_filename: z.string(),
    file_size: z.number(),
    mime_type: z.string(),
    storage_backend: z.string().optional().nullable(),
    content_hash: z.string().optional().nullable(),
    created_at: z.string(),
    submission: z.string().uuid().optional(),
});

export const StaffSubmissionDetailSchema = z.object({
    id: z.string().uuid(),
    assignment: z.string().uuid(),
    student_external_id: z.string().nullable().optional(),
    attempt_number: z.number(),
    status: z.string(),
    submitted_at: z.string().nullable().optional(),
    graded_at: z.string().nullable().optional(),
    marks: z.union([z.string(), z.number()]).nullable().optional(),
    created_at: z.string(),
    files: z.array(StaffSubmissionFileSchema).default([]),
});

export const StaffGradeResponseSchema = z.object({
    id: z.string().uuid(),
    item_name: z.string().optional(),
    course_name: z.string().optional(),
    student_external_id: z.string().optional(),
    grade_type: z.string().optional(),
    marks: z.union([z.string(), z.number()]),
    total_possible: z.union([z.string(), z.number()]).optional(),
    percentage: z.union([z.string(), z.number()]).optional(),
    graded_at: z.string(),
    created_at: z.string(),
    updated_at: z.string(),
});

export type StaffSubmissionDetail = z.infer<typeof StaffSubmissionDetailSchema>;
export type StaffSubmissionFile = z.infer<typeof StaffSubmissionFileSchema>;
export type StaffGradeResponse = z.infer<typeof StaffGradeResponseSchema>;