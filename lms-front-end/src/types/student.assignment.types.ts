import { z } from "zod";

export const CourseSchema = z.object({
    course_external_id: z.number(),
    course_title: z.string(),
    course_code: z.string(),
    department_name: z.string().nullable().optional(),
    updated_at: z.string(),
});


export const AssignmentSchema = z.object({
    id: z.string().uuid(),
    course: CourseSchema,
    content_files: z.array(z.any()),
    title: z.string(),
    description: z.string(),
    open_at: z.string(),
    due_at: z.string(),
    close_at: z.string(),
    max_attempts: z.number(),
    allow_late_submission: z.boolean(),
    is_published: z.boolean(),
    max_marks: z.string(),
    created_at: z.string(),
    created_by: z.number(),
});

// 3. Paginated List Schema (For the List Page)
export const PaginatedAssignmentsSchema = z.object({
    count: z.number(),
    next: z.string().nullable(),
    previous: z.string().nullable(),
    results: z.array(AssignmentSchema),
});

export const ContentFileSchema = z.object({
    id: z.string().uuid().optional(),
    title: z.string().optional(),
    content_type: z.string().optional(),
    url: z.string(),
    created_at: z.string().optional(),
});

// 5. Assignment Detail Schema (For the Detail Page)
export const AssignmentDetailSchema = z.object({
    id: z.string().uuid(),
    course: CourseSchema,
    content_files: z.array(ContentFileSchema).optional().default([]),
    title: z.string(),
    description: z.string(),
    open_at: z.string(),
    due_at: z.string(),
    close_at: z.string(),
    max_attempts: z.number(),
    allow_late_submission: z.boolean(),
    is_published: z.boolean(),
    max_marks: z.string(),
    created_at: z.string(),
    created_by: z.number(),
});

// Exports
export type Course = z.infer<typeof CourseSchema>;
export type Assignment = z.infer<typeof AssignmentSchema>;
export type PaginatedAssignments = z.infer<typeof PaginatedAssignmentsSchema>;
export type ContentFile = z.infer<typeof ContentFileSchema>;
export type AssignmentDetail = z.infer<typeof AssignmentDetailSchema>;