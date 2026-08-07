import { z } from "zod";

export const InAppNotificationTypeSchema = z.enum([
    "ASSIGNMENT_POSTED",
    "ANNOUNCEMENT_POSTED",
    "GRADE_RELEASED",
    "SYSTEM_ALERT"
]).or(z.string());

export const InAppNotificationSchema = z.object({
    id: z.string().uuid(),
    notification_type: InAppNotificationTypeSchema,
    title: z.string(),
    message: z.string(),
    assignment_id: z.string().uuid().nullable().optional(),
    course_id: z.number().nullable().optional(),
    action_url: z.string().nullable().optional(),
    is_read: z.boolean(),
    read_at: z.string().nullable().optional(),
    created_at: z.string(),
});

export const InAppNotificationPaginationSchema = z.object({
    count: z.number(),
    next: z.string().nullable().optional(),
    previous: z.string().nullable().optional(),
    results: z.array(InAppNotificationSchema),
});

export const UnreadCountSchema = z.object({
    unread_count: z.number(),
});

export type InAppNotification = z.infer<typeof InAppNotificationSchema>;
export type InAppNotificationPagination = z.infer<typeof InAppNotificationPaginationSchema>;
export type UnreadCount = z.infer<typeof UnreadCountSchema>;

export interface InAppNotificationFilterParams {
    is_read?: boolean;
    ordering?: string;
    page?: number;
    search?: string;
}