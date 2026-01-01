import axios from "axios";
import Cookies from "js-cookie";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});


// REQUEST INTERCEPTOR
apiClient.interceptors.request.use(
    (config) => {
        const token = Cookies.get("admin_token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);


// FRIENDLY ERROR PARSER
const getFriendlyErrorMessage = (error: any): string | null => {
    const status = error.response?.status;
    const rawMessage: string = error.response?.data?.message || "";

    //  DUPLICATE PHONE NUMBER
    if (
        status === 400 &&
        rawMessage.includes("Duplicate entry") &&
        rawMessage.includes("user_phone_unique")
    ) {
        return "This phone number is already registered. Please use another one.";
    }

    // DUPLICATE EMAIL 
    if (
        status === 400 &&
        rawMessage.includes("Duplicate entry") &&
        rawMessage.includes("email")
    ) {
        return "This email address is already registered.";
    }

    // VALIDATION ERROR (422) - SPECIFIC FIELDS
    if (status === 422) {
        if (rawMessage.toLowerCase().includes("phone")) {
            return "This phone number is already registered.";
        }
        if (rawMessage.toLowerCase().includes("email")) {
            return "An account with this email already exists.";
        }
    }

    // GENERIC HANDLERS
    // Only return generic messages if no specific backend message is available
    if (status === 400 && !rawMessage) {
        return "Invalid request. Please check your data and try again.";
    }

    if (status === 404 && !rawMessage) {
        return "The requested resource was not found.";
    }

    if (status === 429) {
        return "Too many requests. Please wait a moment before trying again.";
    }

    if (status === 500 && !rawMessage) {
        return "An internal server error occurred. Please try again later.";
    }

    return null;
};


// RESPONSE INTERCEPTOR
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const friendlyMessage = getFriendlyErrorMessage(error);

        if (friendlyMessage) {
            error.message = friendlyMessage;

            if (error.response?.data) {
                error.response.data.message = friendlyMessage;
            }
        } else if (error.response?.data?.message) {
            // Propagate backend message if no friendly message is defined
            error.message = error.response.data.message;
        }

        const isAuthPage =
            window.location.pathname.includes("/api/v2/application/register") ||
            window.location.pathname.includes("/api/auth/login") ||
            window.location.pathname.includes("/api/auth/forgot-password");

        if (
            error.response?.status === 401 &&
            !error.config?.url?.includes("/authenticate") &&
            !isAuthPage
        ) {
            Cookies.remove("admin_token");
            Cookies.remove("admin_refresh_token");
            Cookies.remove("admin_user");
            Cookies.remove("pending_mfa_user");

            window.location.href = "/api/auth/admin/login";
        }

        return Promise.reject(error);
    }
);

// TYPES
export interface AuthCredentials {
    username: string;
    password: string;
    applicant: boolean;
}

export interface AuthResponse {
    jwt: string;
    refreshToken: string;
    applicant: any | null;
    userId: string;
    roles: string[];
    mfa: boolean;
    old: boolean;
    message: string | null;
}

export interface MFAVerification {
    userId: string;
    code: string;
}

export interface MFAVerificationResponse {
    success?: boolean;
    message?: string;
    jwt?: string;
    refreshToken?: string;
}

export interface CurrentUser {
    userId: string;
    username: string;
    email: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    roles: string[];
    mfa: boolean;
    profileImage?: string;
    department?: string;
    lastLogin?: string;
}


// AUTH API
export const authAPI = {
    login: async (credentials: AuthCredentials): Promise<AuthResponse> => {
        const response = await apiClient.post<AuthResponse>(
            "/authenticate",
            credentials
        );
        return response.data;
    },

    verifyMFA: async (
        data: MFAVerification
    ): Promise<MFAVerificationResponse> => {
        const response = await apiClient.put<MFAVerificationResponse>(
            "/verify-mfa",
            data
        );
        return response.data;
    },

    getCurrentUser: async (): Promise<CurrentUser> => {
        const response = await apiClient.get<any>("/get-current-user");
        return response.data.data;
    },

    logout: async (): Promise<void> => {
        Cookies.remove("admin_token");
        Cookies.remove("admin_refresh_token");
        Cookies.remove("admin_user");
        Cookies.remove("pending_mfa_user");
    },
};

export default apiClient;
