import { useTransition } from "react";
import BaseRepository from "@/repository/base.repository";
import type { SigninFormData } from "@/types/auth.types";
import { endpoint } from "@/utils/endpoint";
import { useNavigate } from "react-router-dom";
import { setGlobalCsrfToken } from "@/api/client";
export interface User {
    id: number;
    username: string;
    email: string;
    full_name: string;
    roles: string[];
    csrfToken: string;
}

export const useAuth = () => {
    const [isPending, startTransition] = useTransition();
    const repository = new BaseRepository();
    const navigate = useNavigate();


    const handleSignin = (data: SigninFormData) => {
        startTransition(async () => {
            try {
                window.location.href = import.meta.env.VITE_API_BASE_URL + `/api${endpoint.auth.signin}`;
            } catch (error) {
                return error;
            }
        });
    };

    const handleLogout = async () => {
        startTransition(async () => {
            try {
                const response = await repository.post(endpoint.auth.logout);
                if (response.success) {
                    setGlobalCsrfToken("")
                    navigate("/", { replace: true })
                }
                return response;
            } catch (error) {
                return error;
            }
        });
    };


    return {
        handleSignin,
        handleLogout,
        isPending,
    }
}







