import axios from 'axios';

/**
 * Pre-configured Axios instance.
 * All API calls should go through this client.
 */
export const apiClient = axios.create({
    baseURL: '/api',
    timeout: 30_000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Response interceptor — normalise error shape
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const message =
            error.response?.data?.message ?? error.message ?? 'An unknown error occurred';
        return Promise.reject(new Error(message));
    },
);
