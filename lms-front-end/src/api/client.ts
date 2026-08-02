import { processError, toastError } from "@/utils/error.resolver";
import axios, {
    type AxiosInstance,
    type AxiosRequestConfig,
    type AxiosResponse,
    type InternalAxiosRequestConfig,
    type AxiosError,
} from "axios";

// --- Types & Interfaces ---

export interface ApiResponse<T = unknown> {
    success: boolean;
    message: string;
    data: T | null;
    errors?: Record<string, string[]>;
}

export interface ApiClientConfig {
    baseURL: string;
    timeout?: number;
    headers?: Record<string, string>;
}

interface DownloadOptions {
    isPdf?: boolean;
}

// Global variable to hold the CSRF token retrieved from /auth/me
let globalCsrfToken: string | null = null;

class ApiClient {
    #instance: AxiosInstance;

    constructor(config: ApiClientConfig) {
        this.#instance = axios.create({
            baseURL: config.baseURL,
            timeout: config.timeout || 30000,
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                ...config.headers,
            },
            withCredentials: true,
        });

        this.#setupInterceptors();
    }

    #setupInterceptors(): void {
        // REQUEST INTERCEPTOR
        this.#instance.interceptors.request.use(
            (config: InternalAxiosRequestConfig) => {
                const method = (config.method || "GET").toUpperCase();

                // Attach CSRF token only for unsafe methods as required by Django/Authentik docs
                if (["POST", "PUT", "PATCH", "DELETE"].includes(method) && globalCsrfToken) {
                    config.headers["X-CSRFToken"] = globalCsrfToken;
                }

                return config;
            },
            (error: unknown) => Promise.reject(error)
        );

        // RESPONSE INTERCEPTOR
        this.#instance.interceptors.response.use(
            (response: AxiosResponse) => response,
            (error: AxiosError) => {
                if (!error.response) return Promise.reject(error);

                const { status } = error.response;

                // If the backend rejects the session cookie, force the user to log in again
                if (status === 401 || status === 403) {
                    // Prevent redirect loops if they are already on the login page
                    if (window.location.pathname !== "/") {
                        window.location.href = "/login";
                    }
                }

                if (status >= 500) {
                    console.error("Server error:", error.response.data);
                }

                return Promise.reject(error);
            }
        );
    }

    public async request<T = unknown>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
        try {
            const response: AxiosResponse = await this.#instance.request(config);
            return {
                success: true,
                message: response.data.message || "Operation completed successfully",
                data: response.data.data || response.data,
            };
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                const status = error.response?.status;
                const errorData = error.response?.data as any;

                if (status === 429) {
                    toastError(errorData || "Too many requests please try again later");
                    return { success: false, message: errorData, data: null };
                }

                // Don't show toast errors for 401/403, the interceptor handles the redirect
                if (errorData && status !== 401 && status !== 403) {
                    toastError(errorData.message || "An error occurred");
                    return { success: false, message: errorData.message, data: null, ...errorData };
                }
            }

            const errorMessage = await processError(error);
            return {
                success: false,
                message: errorMessage || "An error occurred",
                data: null,
            };
        }
    }

    // --- REST Methods ---

    public get<T = unknown>(url: string, params?: unknown): Promise<ApiResponse<T>> {
        return this.request<T>({ method: "GET", url, params });
    }

    public post<T = unknown>(url: string, data?: unknown): Promise<ApiResponse<T>> {
        return this.request<T>({ method: "POST", url, data });
    }

    public put<T = unknown>(url: string, data?: unknown): Promise<ApiResponse<T>> {
        return this.request<T>({ method: "PUT", url, data });
    }

    public patch<T = unknown>(url: string, data?: unknown): Promise<ApiResponse<T>> {
        return this.request<T>({ method: "PATCH", url, data });
    }

    public delete<T = unknown>(url: string, params?: unknown): Promise<ApiResponse<T>> {
        return this.request<T>({ method: "DELETE", url, params });
    }

    public upload<T = unknown>(url: string, formData: FormData): Promise<ApiResponse<T>> {
        return this.request<T>({
            method: "POST",
            url,
            data: formData,
            headers: { "Content-Type": "multipart/form-data" },
        });
    }

    public async download(
        url: string,
        filename: string,
        params: unknown = {},
        options: DownloadOptions = { isPdf: false }
    ): Promise<boolean> {
        try {
            const response = await this.#instance.get(url, {
                params,
                responseType: "blob",
            });

            const blobConfig = options.isPdf ? { type: "application/pdf" } : undefined;
            const blob = new Blob([response.data], blobConfig);

            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement("a");

            link.href = downloadUrl;
            link.download =
                options.isPdf && !filename.endsWith(".pdf") ? `${filename}.pdf` : filename;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);

            return true;
        } catch (error) {
            console.error("Download failed:", error);
            return false;
        }
    }
}

// --- Utilities & Exports ---

// Use this function inside your useAuth hook after calling /auth/me
export const setGlobalCsrfToken = (token: string): void => {
    globalCsrfToken = token;
};

// Logout requires a POST request with the CSRF token now, per the docs
export const logout = async (): Promise<void> => {
    try {
        await client.post('/auth/logout');
    } catch (error) {
        console.error("Logout request failed", error);
    } finally {
        setGlobalCsrfToken("");
        window.location.href = "/login";
    }
};

const apiConfig: ApiClientConfig = {
    // Make sure this points to your backend origin
    baseURL: (import.meta.env.VITE_API_BASE_URL || "https://odel-lms-api.nsuk.edu.ng") + "/api",
};

const client = new ApiClient(apiConfig);
export default client;