import { processError, toastError } from "@/utils/error.resolver";
import axios, {
    type AxiosInstance,
    type AxiosRequestConfig,
    type AxiosResponse,
    type InternalAxiosRequestConfig,
    type AxiosError,
} from "axios";
import { jwtDecode } from "jwt-decode";

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

interface JwtPayload {
    exp: number;
    [key: string]: any;
}

// Extending to support the custom _retry flag for the interceptor
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
    _retry?: boolean;
}

interface DownloadOptions {
    isPdf?: boolean;
}

class ApiClient {
    // Using native JS private fields for proper encapsulation
    #instance: AxiosInstance;
    #tokenRefreshTimeout: ReturnType<typeof setTimeout> | null = null;

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
        this.#setupTokenRefresh();
    }

    //   async #refreshAccessToken(): Promise<string | null> {
    //     try {
    //       const refreshToken = sessionStorage.getItem("refreshToken");
    //       if (!refreshToken) return null;

    //       const response = await axios.post(
    //         `${this.#instance.defaults.baseURL}/user/refresh-token`,
    //         { refreshToken },
    //         { headers: { "Content-Type": "application/json" } }
    //       );

    //       if (response.data?.success && response.data?.data?.accessToken) {
    //         const newAccessToken = response.data.data.accessToken;
    //         sessionStorage.setItem("accessToken", newAccessToken);
    //         this.#setupTokenRefresh();

    //         return newAccessToken;
    //       }
    //       return null;
    //     } catch (error) {
    //       console.error("Failed to refresh token:", error);
    //       logout();
    //       return null;
    //     }
    //   }

    #setupTokenRefresh(): void {
        // if (this.#tokenRefreshTimeout) {
        //   clearTimeout(this.#tokenRefreshTimeout);
        // }

        const accessToken = sessionStorage.getItem("accessToken");
        if (!accessToken) return;

        try {
            const decodedToken = jwtDecode<JwtPayload>(accessToken);
            const expirationTime = decodedToken.exp * 1000;
            const currentTime = Date.now();

            // Set time to refresh (5 seconds before expiration)
            const timeUntilRefresh = Math.max(0, expirationTime - currentTime - 5000);

            this.#tokenRefreshTimeout = setTimeout(async () => {
                //const newToken = await this.#refreshAccessToken();
                //if (newToken) this.#setupTokenRefresh();
            }, timeUntilRefresh);
        } catch (error) {
            console.error("Error setting up token refresh:", error);
        }
    }

    #setupInterceptors(): void {
        this.#instance.interceptors.request.use(
            (config: InternalAxiosRequestConfig) => {
                const token = sessionStorage.getItem("accessToken");
                const isAuthRoute =
                    config.url?.includes("authenticate") || config.url?.includes("refresh-token");

                if (token && !isAuthRoute) {
                    config.headers.Authorization = `Bearer ${token}`;
                    config.withCredentials = true;
                } else {
                    config.withCredentials = false;
                }
                return config;
            },
            (error: unknown) => Promise.reject(error)
        );

        this.#instance.interceptors.response.use(
            (response: AxiosResponse) => response,
            async (error: AxiosError) => {
                if (!error.response) return Promise.reject(error);

                const { status, config } = error.response;
                const originalRequest = config as CustomAxiosRequestConfig;
                // const isRefreshRoute = originalRequest.url?.includes("refresh-token");

                // Handle expired token
                if (status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;
                    //const newAccessToken = await this.#refreshAccessToken();
                    const newAccessToken = sessionStorage.getItem("accessToken");

                    if (newAccessToken) {
                        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                        return this.#instance(originalRequest);
                    } else {
                        logout();
                    }
                }

                // If refresh token itself fails
                if (status === 401) {
                    logout();
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

                if (errorData && status !== 401) {
                    toastError(errorData.message);
                    // Return the full structured error Data
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

    // Consolidated download method handling regular files and PDFs cleanly
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

            // Prevent memory leaks
            window.URL.revokeObjectURL(downloadUrl);

            return true;
        } catch (error) {
            console.error("Download failed:", error);
            return false;
        }
    }
}

// --- Utilities & Exports ---

export const storeAuthTokens = (accessToken: string, refreshToken: string): void => {
    sessionStorage.setItem("accessToken", accessToken);
    sessionStorage.setItem("refreshToken", refreshToken);
};

export const isAuthenticated = (): boolean => {
    return !!sessionStorage.getItem("accessToken");
};

export const logout = (): void => {
    sessionStorage.removeItem("accessToken");
    //sessionStorage.removeItem("refreshToken");
    if (window.location.pathname !== "/auth/signin") {
        window.location.href = "/auth/signin";
    }
};

const apiConfig: ApiClientConfig = {
    baseURL: `${import.meta.env.VITE_API_BASE_URL}/api`,
};

const client = new ApiClient(apiConfig);
export default client;