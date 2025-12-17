import { api } from './api';

export interface User {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'delivery_agent' | 'customer';
    phone?: string;
    address?: string;
    isActive: boolean;
}

export interface AuthResponse {
    access_token: string;
    user: User;
    message: string;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', { email, password });

    if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', response.access_token);
        localStorage.setItem('user', JSON.stringify(response.user));
    }

    return response;
}

export async function register(data: {
    name: string;
    email: string;
    password: string;
    role?: string;
    phone?: string;
    address?: string;
}): Promise<User> {
    const user = await api.post<User>('/auth/register', data);
    return user;
}

export async function logout(): Promise<void> {
    try {
        await api.post('/auth/logout');
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token');
            localStorage.removeItem('user');
        }
    }
}

export function getCurrentUser(): User | null {
    if (typeof window !== 'undefined') {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                return JSON.parse(userStr);
            } catch {
                return null;
            }
        }
    }
    return null;
}

export function isAuthenticated(): boolean {
    if (typeof window !== 'undefined') {
        return !!localStorage.getItem('access_token');
    }
    return false;
}

export function getUserRole(): string | null {
    const user = getCurrentUser();
    return user?.role || null;
}
