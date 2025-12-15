import api, { setAccessToken, clearAccessToken, initializeToken } from './api';

export interface User {
    id: string;
    email: string;
    fullName?: string;
    studentCode?: string;
    phone?: string;
    avatarUrl?: string;
    auth_role?: string;
    role?: string;
    isActive?: boolean;
    emailVerified?: boolean;
    memberships?: Array<{ clubId: string; role: string; status: string }>;
}

interface LoginResponse {
    success: boolean;
    accessToken: string;
    user: User;
}

interface RegisterData {
    email: string;
    password: string;
    fullName: string;
    studentCode?: string;
    phone?: string;
}

export const authService = {
    // Check if user is already logged in (token in storage)
    async checkAuth(): Promise<boolean> {
        const token = await initializeToken();
        return !!token;
    },

    async login(email: string, password: string): Promise<LoginResponse> {
        const response = await api<LoginResponse>('/users/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });

        if (response.accessToken) {
            await setAccessToken(response.accessToken);
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

    async logout() {
        await clearAccessToken();
    }
};
