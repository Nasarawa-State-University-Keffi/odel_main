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
                const response = await repository.get(endpoint.student.dashboard.student)
                setDashboardData(response.data as Dashboard)
                return response;
            } catch (error) {
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