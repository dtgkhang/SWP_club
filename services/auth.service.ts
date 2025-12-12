import api, { setAccessToken } from './api';

export interface User {
    id: string;
    email: string;
    fullName: string;
    studentCode?: string;
    phone?: string;
    avatarUrl?: string;
    role: 'ADMIN' | 'USER';
    isActive: boolean;
    emailVerified: boolean;
}

interface LoginResponse {
    message: string;
    accessToken: string;
    user: User; // Assuming BE returns user info on login, if not we fetch it
}

interface RegisterData {
    email: string;
    password: string;
    fullName: string;
    studentCode?: string;
    phone?: string;
}

export const authService = {
    async login(email: string, password: string): Promise<LoginResponse> {
        const response = await api<LoginResponse>('/users/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });

        if (response.accessToken) {
            setAccessToken(response.accessToken);
        }

        return response;
    },

    async register(data: RegisterData): Promise<{ message: string }> {
        return api('/users/register', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async getProfile(): Promise<{ user: User }> {
        return api<{ user: User }>('/users/getprofile');
    },

    logout() {
        setAccessToken(null);
    }
};
