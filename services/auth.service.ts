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

    async loginWithGoogle(email: string): Promise<LoginResponse> {
        const response = await api<LoginResponse>('/users/login-with-google', {
            method: 'POST',
            body: JSON.stringify({ email }),
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
    },

    // Get events where user is assigned as staff
    async getMyStaffEvents(): Promise<any[]> {
        try {
            // Get user profile to get userId
            const profileRes = await api<{ user: User }>('/users/getprofile');
            const userId = profileRes.user?.id;
            if (!userId) return [];

            // Get all events with staff data (includeInactive to see all)
            const eventsRes = await api<{ success: boolean; data: any[] }>('/events?includeInactive=true');
            const events = eventsRes.data || [];

            // Filter events where current user is in staff array
            const staffEvents = events.filter((event: any) =>
                event.staff?.some((s: any) => s.userId === userId)
            );

            return staffEvents;
        } catch (error) {
            console.log('Error fetching staff events:', error);
            return [];
        }
    }
};
