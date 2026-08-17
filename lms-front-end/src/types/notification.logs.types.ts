import { z } from "zod";

export const NotificationLogStatusSchema = z.enum([
    "sent",
    "failed",
    "pending",
    "queued"
]).or(z.string());

export const NotificationLogSchema = z.object({
    id: z.string().uuid(),
    recipient: z.string().email().or(z.string()),
    subject: z.string(),
    body_text: z.string().nullable().optional(),
    body_html: z.string().nullable().optional(),
    status: NotificationLogStatusSchema,
    error_message: z.string().nullable().optional(),
    backend_used: z.string(),
    sent_at: z.string().nullable().optional(),
    created_at: z.string(),
});

export const NotificationLogPaginationSchema = z.object({
    count: z.number(),
    next: z.string().nullable().optional(),
    previous: z.string().nullable().optional(),
    results: z.array(NotificationLogSchema),
});

export type NotificationLog = z.infer<typeof NotificationLogSchema>;
export type NotificationLogPagination = z.infer<typeof NotificationLogPaginationSchema>;

export interface NotificationLogFilterParams {
    status?: string;
    date_from?: string;
    date_to?: string;
    search?: string;
    page?: number;
}