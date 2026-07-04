import BaseRepository from "@/repository/base.repository";
import type { SigninFormData } from "@/types/auth.types";
import { endpoint } from "@/utils/endpoint";
import { useTransition } from "react";

export const useAuth = () => {
    const [isPending, startTransition] = useTransition();
    const repository = new BaseRepository();

    const handleSignin = (data: SigninFormData) => {
        startTransition(async () => {
            try {
                // const response = await repository.post(endpoint.auth.signin, data);
                // return response;
                sessionStorage.setItem("accessToken", "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlcyI6W3siYXV0aG9yaXR5IjoiU1RVREVOVCJ9XSwic3ViIjoiRlQyMkJDTVAwNjc3IiwianRpIjoiMTU2Mzc3ZTAtMDBmNy00ZDRhLTk2MDctYjM4N2Y2ZmM1NzQ4IiwiaWF0IjoxNzgzMTcwNzA5LCJleHAiOjE3ODMzNDM1MDl9.YfP-yUJJplFRiwf3AEEbaEh83JAB3XHfYq6MUvQQT0E")
            } catch (error) {
                return error;
            }
        });
    };

    return {
        handleSignin,
        isPending,
    }
}