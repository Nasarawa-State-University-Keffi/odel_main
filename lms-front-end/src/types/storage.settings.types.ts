
import { z } from "zod";

export const StorageSettingSchema = z.object({
    id: z.number(),
    backend: z.string(),
    is_active: z.boolean(),
    created_at: z.string(),
    updated_at: z.string(),
});

export const StorageSettingPaginationSchema = z.object({
    count: z.number(),
    next: z.string().nullable().optional(),
    previous: z.string().nullable().optional(),
    results: z.array(StorageSettingSchema),
});

export interface CreateStorageSettingPayload {
    backend: string;
    is_active: boolean;
}

export type StorageSetting = z.infer<typeof StorageSettingSchema>;
export type StorageSettingPagination = z.infer<typeof StorageSettingPaginationSchema>;