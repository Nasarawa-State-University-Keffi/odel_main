import { z } from "zod"

// export const userSchema = z.object({
//     full_name: z.string(),
//     email: z.string(),
//     level: z.string(),
//     roles: z.array(z.string()),
//     profile_picture: z.string().optional(),
// })

// export type User = z.infer<typeof userSchema>



export const userSchema = z.object({
    id: z.number(),
    external_id: z.string(),
    username: z.string(),
    email: z.string().email(),

    // Name variants returned by the API
    full_name: z.string(),
    first_name: z.string(),
    firstName: z.string(),
    last_name: z.string(),
    lastName: z.string(),

    // Booleans and Arrays
    is_active: z.boolean(),
    is_staff: z.boolean(),
    roles: z.array(z.string()),

    // Security and Timestamps
    csrfToken: z.string(),
    last_synced_at: z.string(),

    // Nullable fields (based on your payload)
    level: z.union([z.string(), z.number()]).nullable(),
    profile_picture: z.string().nullable(),
    programme: z.string().nullable(),
});

export type UserDto = z.infer<typeof userSchema>;

export const ROLES = {
    ADMIN: "ADMIN",
    STAFF: "STAFF",
    STUDENT: "PORTAL_USERS",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
