import { useTransition } from "react";
import { useState, useEffect } from "react";
import BaseRepository from "@/repository/base.repository";
import type { SigninFormData } from "@/types/auth.types";
import { endpoint } from "@/utils/endpoint";
import type { UserDto } from "@/types/auth.types";
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
    const [user, setUser] = useState<User | null>(null);


    const handleSignin = (data: SigninFormData) => {
        startTransition(async () => {
            try {
                window.location.href = import.meta.env.VITE_API_BASE_URL + `/api${endpoint.auth.signin}`;
            } catch (error) {
                return error;
            }
        });
    };

    // // In useStudentDashboard.ts
    // const myData = async () => {
    //     startTransition(async () => {
    //         try {
    //             const response = await repository.get(endpoint.auth.me);
    //             if (response.success) {
    //                 console.log("THIS IS THE DATA: ", response.data)
    //                 const userData = response.data as UserDto;
    //                 setUser(userData);
    //                 if (userData.csrfToken) {
    //                     setGlobalCsrfToken(userData.csrfToken);
    //                 }
    //             }
    //             return response;
    //         } catch (error) {
    //             return error;
    //         }
    //     });
    // };


    return {
        handleSignin,
        isPending,
        user,
        //myData,
    }
}







