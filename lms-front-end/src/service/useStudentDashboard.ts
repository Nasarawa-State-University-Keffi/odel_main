import { useState, useTransition } from "react"
import BaseRepository from "@/repository/base.repository"
import { endpoint } from "@/utils/endpoint"
import type { Dashboard } from "@/types/dashboard.types";

export const useStudentDashboard = () => {

    const [isPending, startTransition] = useTransition();
    const [dashboardData, setDashboardData] = useState<Dashboard | null>(null);
    const repository = new BaseRepository()


    const fetchDashboard = () => {
        startTransition(async () => {
            try {
                const response = await repository.get(endpoint.dashboard.student)
                console.log(response)
                setDashboardData(response.data as Dashboard)
                return response;
            } catch (error) {
                console.log(error)
                return error;
            }
        });
    };


    return {
        fetchDashboard,
        isPending,
        dashboardData,
    }
}