import BaseRepository from "@/repository/base.repository";
import { endpoint } from "@/utils/endpoint";
import { useState, useTransition } from "react";
import type { CreateQuestionSlotPayload, CreateQuizPayload, PaginatedQuizzes, Quiz, QuizQueryParams, QuizQuestionSlot, UpdateQuizPayload } from "@/types/quiz.types";

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


    const fetchQuizById = async (id: string) => {
        return new Promise<Quiz>((resolve, reject) => {
            startTransition(async () => {
                try {
                    let baseUrl = endpoint.staff.dashboard.assessment.quiz.quizzes;
                    const url = `${baseUrl}${id}/`;

                    const response = await repository.get(url);
                    resolve(response.data as Quiz);
                } catch (err: any) {
                    reject(err?.response?.data?.message || "Failed to fetch quiz details.");
                }
            });
        });
    };

    const updateQuiz = async (
        id: string,
        payload: UpdateQuizPayload,
        options: { isFullReplacement?: boolean } = {}
    ) => {
        return new Promise((resolve, reject) => {
            startTransition(async () => {
                try {
                    let baseUrl = endpoint.staff.dashboard.assessment.quiz.quizzes;
                    const url = `${baseUrl}${id}/`;

                    const response = options.isFullReplacement
                        ? await repository.put(url, payload)
                        : await repository.patch(url, payload);

                    resolve(response.data);
                } catch (err: any) {
                    reject(err?.response?.data?.message || "Failed to update quiz.");
                }
            });
        });
    };


    const addQuestionSlot = async (payload: CreateQuestionSlotPayload) => {
        return new Promise<QuizQuestionSlot>((resolve, reject) => {
            startTransition(async () => {
                try {
                    const url = endpoint?.staff?.dashboard?.assessment.quiz.questions;
                    const response = await repository.post(url, payload);
                    resolve(response.data as QuizQuestionSlot);
                } catch (err: any) {
                    const errorMessage =
                        err?.response?.data?.message ||
                        err?.response?.data?.detail ||
                        (typeof err?.response?.data === "object" ? JSON.stringify(err.response.data) : null) ||
                        "Failed to add question to quiz.";
                    reject(errorMessage);
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
        fetchQuizById,
        updateQuiz,
        addQuestionSlot,
    };
};