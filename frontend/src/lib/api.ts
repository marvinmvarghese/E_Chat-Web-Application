import axios from "axios";

// Create Axios Instance
// Assuming Backend is running on port 8000
const api = axios.create({
    baseURL: "http://localhost:8000",
    headers: {
        "Content-Type": "application/json",
    },
});

// Request Interceptor to add Token
api.interceptors.request.use(
    (config) => {
        // We will access localStorage directly here as a simple solution
        // equivalent to what Zustand persist would do, or we can just read from storage
        if (typeof window !== "undefined") {
            // We'll trust that the store persists 'auth-storage' by default if we use persist middleware
            // But for simplicity, let's look for a token in localStorage item 'token'
            // Or we can manually manage it. Let's use a manual key 'echat_token' for clarity.
            const token = localStorage.getItem("echat_token");
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
