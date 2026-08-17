import { z } from "zod";

export const courseSchema = z.object({
    course_external_id: z.number(),
    course_title: z.string(),
    course_code: z.string(),
    department_name: z.string(),
    updated_at: z.string(),
});

export const paginatedCourseSchema = z.object({
    count: z.number(),
    next: z.string().nullable(),
    previous: z.string().nullable(),
    results: z.array(courseSchema),
});

export type Course = z.infer<typeof courseSchema>;
export type PaginatedCourses = z.infer<typeof paginatedCourseSchema>;