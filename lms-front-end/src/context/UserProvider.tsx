import React, { createContext, useContext, useEffect, useRef, useState, useTransition } from "react";
import type { UserDto } from "../types/user.types";
import BaseRepository from "@/repository/base.repository";
import { endpoint } from "@/utils/endpoint";
import { setGlobalCsrfToken } from "@/api/client";
import { useLocation } from "react-router-dom";

interface UserContextType {
    user: UserDto | null;
    setUser: (user: UserDto | null) => void;
    isLoading: boolean;
}

const UserContext = createContext<UserContextType>({
    user: null,
    setUser: () => { },
    isLoading: true,
});

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const repository = new BaseRepository();
    const [user, setUser] = useState<UserDto | null>(null);
    const [isLoading, setIsLoading] = useState(true)

    // declare useLocation and useRef
    const location = useLocation()
    const hasFetched = useRef(false);


    const fetchMyData = async () => {
        setIsLoading(true);
        try {
            const response = await repository.get(endpoint.auth.me);
            if (response.success) {
                const userData = response.data as UserDto;
                setUser(userData);
                if (userData.csrfToken) {
                    setGlobalCsrfToken(userData.csrfToken);
                }
            }
        } catch (error) {
            console.log("Error fetching user data: ", error);
        } finally {
            setIsLoading(false);
        }
    };


    useEffect(() => {
        const isDashboardRoute = location.pathname.includes('dashboard') || location.pathname.includes('student');
        if (isDashboardRoute && (!hasFetched.current)) {
            (async () => {
                await fetchMyData();
                hasFetched.current = true;
            })();
        } else if (!isDashboardRoute) {
            setIsLoading(false);
        }
    }, [location.pathname, user]);



    return (
        <UserContext.Provider value={{ user, setUser, isLoading }}>
            {children}
        </UserContext.Provider>
    );
};




export const useUserContext = () => useContext(UserContext);
