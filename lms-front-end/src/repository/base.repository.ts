import client from "@/api/client";

class BaseRepository {

    get<T>(endpoint: string, params?: unknown) {
        return client.get<T>(endpoint, params);
    }

    post<T, P = unknown>(endpoint: string, data?: P) {
        return client.post<T>(endpoint, data);
    }

    put<T, P = unknown>(endpoint: string, data: P) {
        return client.put<T>(endpoint, data);
    }

    patch<T, P = unknown>(endpoint: string, data: P) {
        return client.patch<T>(endpoint, data);
    }

    delete<T>(endpoint: string, params?: unknown) {
        return client.delete<T>(endpoint, params);
    }
}

export default BaseRepository;