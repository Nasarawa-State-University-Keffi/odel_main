import { useState, useTransition } from "react"
import { type ProgrammeType } from "../types/programme_type.types"
import BaseRepository from "@/repository/base.repository"
import { endpoint } from "@/utils/endpoint"

export const useProgrammeType = () => {
    const [programmeTypes, setProgrammeTypes] = useState<ProgrammeType[] | null>(null)
    const [isPending, startTransition] = useTransition()
    const repository = new BaseRepository()

    const fetchProgrammeType = async () => {
        startTransition(async () => {
            try {
                const response = await repository.get(endpoint.programme_type);
                console.log("this is the programme data: ", response.data)
                setProgrammeTypes(response.data as ProgrammeType[]);
            } catch (err: any) {
                console.error("Failed to fetch programme types:", err);
            }
        });
    }


    return {
        programmeTypes,
        isPending,
        fetchProgrammeType,
    }
}
