import { z } from 'zod'

export const entitySchema = z.object({
    id: z.number().optional(),
    name: z.string().min(3, "Name must be at least 3 characters long").max(50, "Name is too long"),
});


export const paginatedResponseSchema = z.object({
    count: z.number(),
    next: z.string().nullable(),
    previous: z.string().nullable(),
    results: z.array(entitySchema),
});

export type Entity = z.infer<typeof entitySchema>;
export type PaginatedResponse = z.infer<typeof paginatedResponseSchema>;
