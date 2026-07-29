import BaseRepository from "@/repository/base.repository"
import type { StaffDashboard } from "@/types/staff.types"
import { endpoint } from "@/utils/endpoint"
import { useState, useTransition } from "react"

export const useStaffDashboard = () => {

    const [dashboardData, setDashboardData] = useState<StaffDashboard | null>(null)
    const [isPending, startTransition] = useTransition()
    const repository = new BaseRepository()


    const fetchStaffData = async (external_id: string) => {
        startTransition(async () => {
            try {
                const response = await repository.get(`${endpoint.staff.dashboard.staff}/${external_id}/?programme_type_code=ODEL&session=2024/2025&semester=First`)
                if (response.success) {
                    setDashboardData(response.data as StaffDashboard)
                }
                return response.data;
            } catch (error) {
                return error;
            }
        })
    }

    return {
        fetchStaffData,
        dashboardData,
        isPending
    }
}
