import BaseRepository from "@/repository/base.repository";
import { endpoint } from "@/utils/endpoint";
import { useState, useTransition } from "react";
import type { CreateQuizPayload, PaginatedQuizzes, QuizQueryParams } from "@/types/quiz.types";

export const useStaffQuiz = () => {
    const [isPending, startTransition] = useTransition();
    const [data, setData] = useState<PaginatedQuizzes | null>(null);
    const [error, setError] = useState<string | null>(null);

    const repository = new BaseRepository();

    const fetchQuizzes = async (params?: QuizQueryParams | string) => {
        setError(null);
        startTransition(async () => {
            try {
                let baseUrl = endpoint?.staff?.dashboard?.assessment.quiz.quizzes;
                let url = baseUrl;

                if (typeof params === 'string' && params.startsWith('http')) {
                    url = params;
                } else if (typeof params === 'object') {
                    const queryParams = new URLSearchParams();
                    if (params.page) queryParams.append("page", params.page.toString());
                    if (params.search) queryParams.append("search", params.search);
                    if (params.ordering) queryParams.append("ordering", params.ordering);

                    const queryString = queryParams.toString();
                    if (queryString) {
                        url = `${url}?${queryString}`;
                    }
                }

                const response = await repository.get(url);
                setData(response.data as PaginatedQuizzes);
            } catch (err: any) {
                setError(err?.response?.data?.message || "Failed to fetch quizzes. Please try again.");
            }
        });
    };


    const createQuiz = async (payload: CreateQuizPayload) => {
        return new Promise((resolve, reject) => {
            startTransition(async () => {
                try {
                    let baseUrl = endpoint?.staff?.dashboard?.assessment?.quiz?.quizzes;
                    const response = await repository.post(baseUrl, payload);
                    resolve(response.data);
                } catch (err: any) {
                    reject(err?.response?.data?.message || "Failed to create quiz.");
                }
            });
        });
    };

    return {
        data,
        error,
        isPending,
        fetchQuizzes,
        createQuiz,
    };
};