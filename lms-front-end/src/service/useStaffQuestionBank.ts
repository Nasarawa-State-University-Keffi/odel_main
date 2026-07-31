
import { useState, useCallback, useTransition } from "react";
import type { PaginatedCategories, CategoryQueryParams, CreateCategoryPayload, QuestionBankCategory, PaginatedQuestionsResponse, QuestionPayload, QuestionItem } from "@/types/questionBank.types";
import BaseRepository from "@/repository/base.repository";
import { endpoint } from "@/utils/endpoint";


export const useStaffQuestionBank = () => {
    const [isPending, startTransition] = useTransition();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const repository = new BaseRepository()

    // Fetch Categories with Query Params
    const fetchCategories = useCallback(async (params: CategoryQueryParams = {}) => {
        setIsLoading(true);
        setError(null);

        return new Promise<PaginatedCategories>((resolve, reject) => {
            startTransition(async () => {
                try {
                    const query = new URLSearchParams();
                    if (params.page) query.append("page", params.page.toString());
                    if (params.search) query.append("search", params.search);
                    if (params.ordering) query.append("ordering", params.ordering);

                    const url = `${endpoint.staff.dashboard.assessment.question_bank.categories.base}?${query.toString()}`;
                    const response = await repository.get(url);

                    resolve(response.data as PaginatedCategories);
                } catch (err: any) {
                    const errorMessage =
                        err?.response?.data?.message ||
                        "Failed to load question bank categories.";
                    setError(errorMessage);
                    reject(errorMessage);
                } finally {
                    setIsLoading(false);
                }
            });
        });
    }, []);

    const createCategory = async (payload: CreateCategoryPayload): Promise<QuestionBankCategory> => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await repository.post(endpoint.staff.dashboard.assessment.question_bank.categories.base, payload);
            return response.data as QuestionBankCategory;
        } catch (err: any) {
            const errorMessage =
                err?.response?.data?.message ||
                err?.response?.data?.detail ||
                "Failed to create category.";
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const deleteCategory = async (id: string): Promise<void> => {
        setIsLoading(true);
        try {
            await repository.delete(`${endpoint.staff.dashboard.assessment.question_bank.categories.base}${id}/`);
        } catch (err: any) {
            throw err?.response?.data?.message || "Failed to delete category.";
        } finally {
            setIsLoading(false);
        }
    };


    const fetchCategoryById = async (id: string): Promise<QuestionBankCategory> => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await repository.get(`${endpoint.staff.dashboard.assessment.question_bank.categories.base}${id}/`);
            return response.data as QuestionBankCategory;
        } catch (err: any) {
            const errorMessage = err?.response?.data?.message || "Failed to fetch category details.";
            setError(errorMessage);
            throw errorMessage;
        } finally {
            setIsLoading(false);
        }
    };

    const updateCategory = async (id: string, payload: CreateCategoryPayload): Promise<QuestionBankCategory> => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await repository.put(`${endpoint.staff.dashboard.assessment.question_bank.categories.base}${id}/`, payload);
            return response.data as QuestionBankCategory;
        } catch (err: any) {
            const errorMessage =
                err?.response?.data?.message ||
                err?.response?.data?.detail ||
                "Failed to update category.";
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const fetchQuestions = async (params?: { page?: number; search?: string; category?: string }): Promise<PaginatedQuestionsResponse> => {
        setIsLoading(true);
        try {
            const queryParams = new URLSearchParams();
            if (params?.page) queryParams.append("page", String(params.page));
            if (params?.search) queryParams.append("search", params.search);
            if (params?.category) queryParams.append("category", params.category);

            const response = await repository.get(`${endpoint.staff.dashboard.assessment.question_bank.questions.base}?${queryParams.toString()}`);
            return response.data as PaginatedQuestionsResponse;
        } catch (err: any) {
            throw err.response?.data || "Failed to fetch questions";
        } finally {
            setIsLoading(false);
        }
    };

    const fetchQuestionById = async (id: string): Promise<QuestionItem> => {
        setIsLoading(true);
        try {
            const response = await repository.get(`${endpoint.staff.dashboard.assessment.question_bank.questions.base}${id}/`);
            return response.data as QuestionItem;
        } catch (err: any) {
            throw err.response?.data || "Failed to fetch question";
        } finally {
            setIsLoading(false);
        }
    };

    const createQuestion = async (payload: any): Promise<any> => {
        setIsLoading(true);
        try {
            const response = await repository.post(endpoint.staff.dashboard.assessment.question_bank.questions.base, payload);
            return response.data;
        } catch (err: any) {
            throw err.response?.data || "Failed to create question";
        } finally {
            setIsLoading(false);
        }
    };

    const updateQuestion = async (id: string, payload: QuestionPayload) => {
        setIsLoading(true);
        try {
            const response = await repository.put(endpoint.staff.dashboard.assessment.question_bank.questions.base + id, payload);
            return response.data;
        } catch (error: any) {
            throw error.response?.data || "Failed to update question.";
        } finally {
            setIsLoading(false);
        }
    };

    // 6. Delete question (DELETE)
    const deleteQuestion = async (id: string) => {
        setIsLoading(true);
        try {
            const response = await repository.delete(endpoint.staff.dashboard.assessment.question_bank.questions.base + id);
            return response.data;
        } catch (error: any) {
            throw error.response?.data || "Failed to delete question.";
        } finally {
            setIsLoading(false);
        }
    };



    return {
        fetchCategories,
        createCategory,
        deleteCategory,
        fetchCategoryById,
        updateCategory,
        fetchQuestions,
        createQuestion,
        isLoading: isLoading || isPending,
        updateQuestion,
        deleteQuestion,
        fetchQuestionById,
        error
    };
};