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

export interface QuestionAnswer {
    id: string;
    question: string;
    answer_text: string;
    fraction: string;
    feedback: string;
    order: number;
}

export interface QuestionItem {
    id: string;
    category: string;
    category_name: string;
    qtype: string;
    qtype_display: string;
    name: string;
    question_text: string;
    general_feedback: string;
    default_mark: string;
    penalty: string;
    version: number;
    answers: QuestionAnswer[];
    created_at: string;
    updated_at: string;
}

export interface PaginatedQuestionsResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: QuestionItem[];
}



export interface QuestionPayload {
    category: string;
    qtype: "multichoice" | "truefalse" | "shortanswer";
    name: string;
    question_text: string;
    general_feedback?: string;
    default_mark: string | number;
    penalty: string | number;
    answers: QuestionAnswer[];
}

export interface Question extends QuestionPayload {
    id: string;
    created_at?: string;
    updated_at?: string;
}

export interface Category {
    id: string;
    name: string;
    description?: string;
}