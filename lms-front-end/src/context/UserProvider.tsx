import React, { createContext, useContext, useEffect, useRef, useState, useTransition } from "react";
import type { UserDto } from "../types/user.types";
import BaseRepository from "@/repository/base.repository";
import { endpoint } from "@/utils/endpoint";
import { setGlobalCsrfToken } from "@/api/client";
import { useLocation } from "react-router-dom";

interface UserContextType {
    user: UserDto | null;
    setUser: (user: UserDto | null) => void;
    isPending: boolean;
}

const UserContext = createContext<UserContextType>({
    user: null,
    setUser: () => { },
    isPending: false,
});

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const repository = new BaseRepository();
    const [user, setUser] = useState<UserDto | null>(null);
    const [isPending, startTransition] = useTransition()

    // declare useLocation and useRef
    const location = useLocation()
    const hasFetched = useRef(false);


    const fetchMyData = async () => {
        startTransition(async () => {
            try {
                const response = await repository.get(endpoint.auth.me);
                if (response.success) {

                    const userData = response.data as UserDto;
                    setUser(userData);

                    console.log("THIS IS THE DATA: ", userData)
                    if (userData.csrfToken) {
                        setGlobalCsrfToken(userData.csrfToken);
                    }
                }
                return response;
            } catch (error) {
                console.log("Error fetching user data: ", error);
                return error;
            }
        });
    }


    useEffect(() => {

        const isDashboardRoute = location.pathname.includes('dashboard');
        if (isDashboardRoute && (!hasFetched.current)) {
            (async () => {
                await fetchMyData();
                hasFetched.current = true;
            })();
        }
    }, [location.pathname, user]);



    return (
        <UserContext.Provider value={{ user, setUser, isPending }}>
            {children}
        </UserContext.Provider>
    );
};




export const useUserContext = () => useContext(UserContext);
