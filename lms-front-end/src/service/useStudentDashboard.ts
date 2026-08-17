import { useState, useTransition } from "react"
import BaseRepository from "@/repository/base.repository"
import { endpoint } from "@/utils/endpoint"
import type { Dashboard } from "@/types/dashboard.types";


export const useStudentDashboard = () => {

    const [isPending, startTransition] = useTransition();
    const [dashboardData, setDashboardData] = useState<Dashboard | null>(null);
    const [error, setError] = useState<unknown>(null)
    const repository = new BaseRepository()



    const fetchDashboardData = async (sessionName: string, semesterName: string) => {
        startTransition(async () => {
            try {
                const url = `${endpoint.student.dashboard.student}?session=${encodeURIComponent(sessionName)}&semester=${encodeURIComponent(semesterName)}`;

                const response = await repository.get(url);

                if (response.success) {
                    setDashboardData(response.data as Dashboard);
                }
            } catch (error) {
                setError(error);
            }
        });
    };



    return {
        fetchDashboardData,
        isPending,
        error,
        dashboardData,
    }
}