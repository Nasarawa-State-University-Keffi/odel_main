import { z } from "zod";

export const QuizSchema = z.object({
    id: z.string().uuid(),
    course_external_id: z.number(),
    name: z.string(),
    description: z.string(),
    time_open: z.string().datetime(),
    time_close: z.string().datetime(),
    time_limit: z.number(),
    max_grade: z.string(),
    shuffle_questions: z.boolean(),
    max_attempts: z.number(),
    show_feedback: z.boolean(),
    questions_count: z.number(),
    total_marks: z.number(),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
});

export const PaginatedQuizzesSchema = z.object({
    count: z.number(),
    next: z.string().nullable().optional(),
    previous: z.string().nullable().optional(),
    results: z.array(QuizSchema),
});

// Add this interface to your existing quiz.types.ts
export interface CreateQuizPayload {
    name: string;
    description: string;
    time_open: string; 
    time_close: string; 
    time_limit: number;
    max_grade: string;
    shuffle_questions: boolean;
    max_attempts: number;
    show_feedback: boolean;
    course_id: string;
}

export type Quiz = z.infer<typeof QuizSchema>;
export type PaginatedQuizzes = z.infer<typeof PaginatedQuizzesSchema>;

export interface QuizQueryParams {
    page?: number;
    search?: string;
    ordering?: string;
}