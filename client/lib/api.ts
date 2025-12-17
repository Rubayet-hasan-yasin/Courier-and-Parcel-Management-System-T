import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export const API_URL = process.env.NEXT_PUBLIC_API_URL;

const axiosInstance: AxiosInstance = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

axiosInstance.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('access_token');
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

axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('access_token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
        }

        const message = error.response?.data?.message || error.message || 'An error occurred';
        return Promise.reject(new Error(message));
    }
);

export const api = {
    get: <T>(url: string, config?: AxiosRequestConfig) =>
        axiosInstance.get<T>(url, config).then((res) => res.data),

    post: <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
        axiosInstance.post<T>(url, data, config).then((res) => res.data),

    patch: <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
        axiosInstance.patch<T>(url, data, config).then((res) => res.data),

    put: <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
        axiosInstance.put<T>(url, data, config).then((res) => res.data),

    delete: <T>(url: string, config?: AxiosRequestConfig) =>
        axiosInstance.delete<T>(url, config).then((res) => res.data),
};

export default axiosInstance;
