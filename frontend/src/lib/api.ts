import axios from "axios";

// Create Axios Instance with environment-based URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const api = axios.create({
    baseURL: API_URL,
});

// Set default headers only for non-FormData requests
api.defaults.headers.common['Content-Type'] = 'application/json';

// Request Interceptor to add Token
api.interceptors.request.use(
    (config) => {
        if (typeof window !== "undefined") {
            const token = localStorage.getItem("echat_token");
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }

        // Let axios set Content-Type automatically for FormData
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor for better error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Unauthorized - clear token and redirect to login
            if (typeof window !== "undefined") {
                localStorage.removeItem("echat_token");
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);

export default api;
