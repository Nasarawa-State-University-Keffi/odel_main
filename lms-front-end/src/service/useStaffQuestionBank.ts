// src/service/useStaffQuestionBank.ts
import { useState, useCallback, useTransition } from "react";
import type { PaginatedCategories, CategoryQueryParams, CreateCategoryPayload, QuestionBankCategory } from "@/types/questionBank.types";
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



    return {
        fetchCategories,
        createCategory,
        deleteCategory,
        fetchCategoryById,
        updateCategory,
        isLoading: isLoading || isPending,
        error
    };
};