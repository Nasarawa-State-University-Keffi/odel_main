import BaseRepository from "@/repository/base.repository";
import type { Semester, Session } from "@/types/academic.types";
import { endpoint } from "@/utils/endpoint";
import { useState, useTransition } from "react"

export const useAcademicSetup = (academicType: 'semesters' | 'sessions' = "semesters") => {
    const [semester, setSemester] = useState<Semester[] | null>(null);
    const [session, setSession] = useState<Session[] | null>(null);
    const [error, setError] = useState<unknown>(null)

    const [isPending, startTransition] = useTransition();
    const repository = new BaseRepository();

    const fetchSemester = async () => {
        startTransition(async () => {
            try {
                const response = await repository.get(endpoint.semester);
                if (response.success) {
                    setSemester(response.data as Semester[]);
                    console.log("semesters: ", response.data)
                }
            } catch (error) {
                setError(error)
            }
        })
    }

    const fetchSession = async () => {
        startTransition(async () => {
            try {
                const response = await repository.get(endpoint.session);
                if (response.success) {
                    console.log("sessions: ", response.data)
                    setSession(response.data as Session[]);
                }
            } catch (error) {
                setError(error)
            }
        })
    }



    const createItem = async (data: { name: string }) => {
        try {
            const endpointPath = academicType === 'semesters' ? endpoint.semester : endpoint.session;
            const response = await repository.post(endpointPath, data)
            return response;
        } catch (error) {
            throw error;
        }
    };

    const updateItem = async (id: number, updatedData: { name: string }) => {
        try {
            const endpointPath = academicType === 'semesters' ? endpoint.semester : endpoint.session;
            const response = await repository.put(`${endpointPath}/${id}`, updatedData);
            return response;
        } catch (error) {
            throw error;
        }

    };

    const deleteItem = async (id: number) => {
        try {
            const endpointPath = academicType === 'semesters' ? endpoint.semester : endpoint.session;
            const response = await repository.delete(`${endpointPath}/${id}`);
            return response;
        } catch (error) {
            return { success: false };
        }
    };

    return {
        fetchSemester,
        fetchSession,
        createItem,
        updateItem,
        deleteItem,
        isPending,
        semester,
        setSemester,
        session,
        setSession,
        error
    }
}