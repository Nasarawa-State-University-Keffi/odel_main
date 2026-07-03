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
                sessionStorage.setItem("accessToken", "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlcyI6W3siYXV0aG9yaXR5IjoiU1RVREVOVCJ9XSwic3ViIjoiRlQyMkJDTVAwNjc3IiwianRpIjoiYmFmMDIyZWUtOWQyYy00MjBlLWIwYWYtZTZjZjA0NzNlMDhkIiwiaWF0IjoxNzgzMDk3MTQxLCJleHAiOjE3ODMyNjk5NDF9.5HdFJGRx5dOJNUCWKDPG5VIe-PiuUj8RxNUrml64f3c")
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