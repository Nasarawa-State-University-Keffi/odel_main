import {z} from "zod"

export const programmeTypeSchema = z.object({
    id: z.number(),
    upStreamId: z.number(),
    name: z.string(),
    code: z.string(),
    last_synced_at: z.string()
})



export type ProgrammeType = z.infer<typeof programmeTypeSchema>
