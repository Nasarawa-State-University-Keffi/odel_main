import { z } from "zod";

export const NotificationSettingSchema = z.object({
    id: z.string().uuid(),
    backend_choice: z.string(),
    is_active: z.boolean(),
    config: z.union([
        z.record(z.string(), z.any()),
        z.string(),
        z.null()
    ]).optional(),
    created_at: z.string(),
    updated_at: z.string(),
});

export const NotificationSettingPaginationSchema = z.object({
    count: z.number(),
    next: z.string().nullable().optional(),
    previous: z.string().nullable().optional(),
    results: z.array(NotificationSettingSchema),
});


export const CreateNotificationSettingSchema = z.object({
    backend_choice: z.string().min(1, "Backend choice is required"),
    is_active: z.boolean().default(true),
    config: z.record(z.string(), z.any()).optional().default({}),
});


export const UpdateNotificationSettingSchema = z.object({
    backend_choice: z.string().min(1, "Backend choice is required"),
    is_active: z.boolean(),
    config: z.record(z.string(), z.any()).optional().default({}),
});

export type UpdateNotificationSettingPayload = z.infer<typeof UpdateNotificationSettingSchema>;
export type CreateNotificationSettingPayload = z.infer<typeof CreateNotificationSettingSchema>;
export type NotificationSetting = z.infer<typeof NotificationSettingSchema>;
export type NotificationSettingPagination = z.infer<typeof NotificationSettingPaginationSchema>;