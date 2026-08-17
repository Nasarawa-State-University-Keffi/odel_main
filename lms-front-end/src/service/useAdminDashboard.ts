import BaseRepository from "@/repository/base.repository"
import { endpoint } from "@/utils/endpoint"
import { useState, useTransition } from "react"

export const useAdminDashboard = () => {
    const [isLoading, setIsLoading] = useState(false)

    const repository = new BaseRepository()

    const syncAll = async () => {
        try {
            setIsLoading(false)
            const response = await repository.post(endpoint.sync.all);
            if (response.success) {

            }
            return response;

        } catch (error) {
            return error;
        }
        finally {
            setIsLoading(false)
        }
    }

    return {
        syncAll,
        isLoading
    }
}