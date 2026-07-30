export interface QuestionBankCategory {
    id: string;
    course_external_id: number;
    name: string;
    description: string;
    level: string;
    level_display: string;
    questions_count: number;
    available_question_types: string[];
    created_at: string;
    updated_at: string;
}

export interface PaginatedCategories {
    count: number;
    next: string | null;
    previous: string | null;
    results: QuestionBankCategory[];
}

export interface CategoryQueryParams {
    page?: number;
    search?: string;
    ordering?: string;
}

export interface CreateCategoryPayload {
    course_id: string;
    name: string;
    description: string;
    level: string;
}