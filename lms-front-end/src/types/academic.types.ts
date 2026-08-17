import { z } from 'zod'

export const semesterSchema = z.object({
    name: z.string(),
    id: z.number()
})

export const sessionSchema = z.object({
    name: z.string(),
    id: z.number()
})

export type Semester = z.infer<typeof semesterSchema>
export type Session = z.infer<typeof sessionSchema>

