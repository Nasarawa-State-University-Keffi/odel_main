import { z } from "zod"

export const userSchema = z.object({
    full_name: z.string(),
    email: z.string(),
    level: z.string(),
    roles: z.array(z.string()),
    profile_picture: z.string().optional(),
})

export type User = z.infer<typeof userSchema>