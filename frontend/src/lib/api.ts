import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://test.nsuk.edu.ng/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
    (config) => {
        const token = Cookies.get('admin_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for handling errors
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {

        // Check if the error is 401 and the request was NOT to the login endpoint

        if (error.response?.status === 401 && !error.config.url?.includes('/authenticate')) {

            // Unauthorized - clear token and redirect to login
            Cookies.remove('admin_token');
            Cookies.remove('admin_refresh_token');
            Cookies.remove('admin_user');
            Cookies.remove('pending_mfa_user');
            window.location.href = '/api/auth/admin/login';
        }
        return Promise.reject(error);
    }
);

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
    firstName?: string;
    lastName?: string;
    fullName?: string;
    roles: string[];
    mfa: boolean;
    profileImage?: string;
    department?: string;
    lastLogin?: string;
}

// HANDLES AUTHENTICATION ENDPOINT

export const authAPI = {
    login: async (credentials: AuthCredentials): Promise<AuthResponse> => {
        const response = await apiClient.post<AuthResponse>('/authenticate', credentials);
        return response.data;
    },

    // HANDLES MFA ENDPOINT

    verifyMFA: async (data: MFAVerification): Promise<MFAVerificationResponse> => {
        // verifying the OTP sent
        const response = await apiClient.put<MFAVerificationResponse>('/verify-mfa', data);
        return response.data;
    },

    // HANDLES CURRENT USER ENDPOINT
    getCurrentUser: async (): Promise<CurrentUser> => {
        const response = await apiClient.get<CurrentUser>('/get-current-user');
        return response.data;
    },

    // HANDLES LOGOUT FUNCTIONALITY

    logout: async (): Promise<void> => {
        Cookies.remove('admin_token');
        Cookies.remove('admin_refresh_token');
        Cookies.remove('admin_user');
        Cookies.remove('pending_mfa_user');
    },
};

export default apiClient;
