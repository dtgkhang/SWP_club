import api, { setAccessToken } from './api';

export interface User {
    id: string;
    email: string;
    fullName?: string;
    studentCode?: string;
    phone?: string;
    avatarUrl?: string;
    auth_role?: string; // BE returns auth_role (e.g., STUDENT, STAFF, ADMIN)
    role?: string; // Alias for auth_role used in some contexts
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
