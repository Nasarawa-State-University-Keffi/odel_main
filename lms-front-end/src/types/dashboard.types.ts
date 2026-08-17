import { z } from "zod"
import { userSchema } from "./user.types"

export const dashboardSchema = z.object({
    user: userSchema,
    courses: z.array(z.object({
        id: z.number(),
        course_code: z.string(),
        course_title: z.string(),
    })),
    course_count: z.number(),
    pending_quizzes: z.array(z.any()).optional(),
    upcoming_assignments: z.array(z.any()).optional(),
})

export type Dashboard = z.infer<typeof dashboardSchema>