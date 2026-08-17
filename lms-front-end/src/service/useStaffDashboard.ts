import BaseRepository from "@/repository/base.repository"
import type { StaffDashboard } from "@/types/staff.types"
import { endpoint } from "@/utils/endpoint"
import { useState, useTransition } from "react"

export const useStaffDashboard = () => {

    const [dashboardData, setDashboardData] = useState<StaffDashboard | null>(null)
    const [isPending, startTransition] = useTransition()
    const repository = new BaseRepository()
    const [error, setError] = useState<unknown>(null)


    const fetchStaffData = async (external_id: string, session: string, semester: string) => {
        startTransition(async () => {
            try {
                const response = await repository.get(
                    `${endpoint.staff.dashboard.staff}/${external_id}/?programme_type_code=ODEL&session=${encodeURIComponent(session)}&semester=${encodeURIComponent(semester)}`
                );
                if (response.success) {
                    setDashboardData(response.data as StaffDashboard);
                }
            } catch (error) {
                setError(error);
            }
        });
    }

    return {
        fetchStaffData,
        dashboardData,
        isPending,
        error
    }
}
