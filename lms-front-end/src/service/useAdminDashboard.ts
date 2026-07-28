import BaseRepository from "@/repository/base.repository"
import { endpoint } from "@/utils/endpoint"
import { useTransition } from "react"

export const useAdminDashboard = () => {
    const [isPending, startTransition] = useTransition()
    const repository = new BaseRepository()

    const syncAll = async () => {
        startTransition(async () => {
            try {
                const response = await repository.post(endpoint.sync.all)
                console.log("response data: ", response)
                return response.data;

            } catch (error) {
                return error;
            }
        })
    }

    return {
        syncAll,
        isPending,
    }
}