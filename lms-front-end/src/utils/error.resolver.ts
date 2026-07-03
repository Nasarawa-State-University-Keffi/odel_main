import { Slide, toast } from "react-toastify";

// Helper to handle Blob to JSON conversion safely
const parseBlobError = async (blob: Blob): Promise<string> => {
    try {
        const text = await blob.text();
        const parsed = JSON.parse(text);
        return parsed.error || parsed.message || "An error occurred with the file";
    } catch {
        return "Failed to process file response";
    }
};

export const processError = async (error: any): Promise<string> => {
    // 1. Handle Network/Setup Errors immediately
    if (!error.response) {
        return error.request
            ? "Error! Server is not responding"
            : error.message || "An unexpected error occurred";
    }

    const { status, data, config } = error.response;

    // 2. Handle specific status codes using a map for clean readability
    const statusHandlers: Record<number, () => string> = {
        401: () => {
            if (config.url?.includes("/authenticate")) return "Invalid username or password";
            if (config.url?.includes("/refresh-token")) {
                window.location.reload();
                return "Session expired";
            }
            return "Session expired, login required";
        },
        403: () => "Access denied. Reload if the message persists",
        // Consolidated your duplicate 500 logic here:
        500: () => "Ongoing maintenance or server error. Contact the support team",
    };

    if (statusHandlers[status]) {
        return statusHandlers[status]();
    }

    // 3. Handle data structures (Blob, custom error objects)
    if (data instanceof Blob) {
        return await parseBlobError(data);
    }

    return data?.message || data?.error || data || "An unknown error occurred";
};

// --- Toasts ---
// Notice how we abstract the shared config to keep it DRY (Don't Repeat Yourself)
const toastConfig = {
    position: "top-right" as const,
    hideProgressBar: false,
    closeOnClick: false,
    pauseOnHover: true,
    draggable: true,
    transition: Slide,
    theme: "light",
};

export const toastError = (message: string) => {
    toast.error(message, { ...toastConfig, autoClose: 1500 });
};

export const toastSuccess = (message: string) => {
    toast.success(message, { ...toastConfig, autoClose: 1000 });
};