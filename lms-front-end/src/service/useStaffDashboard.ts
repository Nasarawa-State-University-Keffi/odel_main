import BaseRepository from "@/repository/base.repository"
import { endpoint } from "@/utils/endpoint"
import { useTransition } from "react"

export const useStaffDashboard = () => {
    const [isPending, startTransition] = useTransition()
    const repository = new BaseRepository()


    const fetchStaffData = async (external_id: string) => {
        startTransition(async () => {
            try {
                const response = await repository.get(`${endpoint.staff.dashboard.staff}/${external_id}/?programme_type_code=UG`)
                console.log("response returned", response)
                return response.data;
            } catch (error) {
                return error;
            }
        })
    }

    return {
        fetchStaffData,
        isPending
    }
}
