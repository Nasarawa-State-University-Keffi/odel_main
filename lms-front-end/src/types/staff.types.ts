import {z} from "zod"

export const staffDashboardSchema = z.object({
    total_courses: z.array(z.object({
        course_external_id: z.number(),
        course_code: z.string(),
        course_title: z.string()
    })),
    total_courses_count: z.number(),
    total_assignments: z.any(),
    total_assignments_count: z.number(),
    total_quizzes: z.any(),
    total_quizzes_count: z.number()


})


export type StaffDashboard = z.infer<typeof staffDashboardSchema>