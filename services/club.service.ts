import api from './api';

export interface Club {
    id: string;
    name: string;
    slug: string;
    description?: string;
    logoUrl?: string;
    coverUrl?: string;
    membershipFeeEnabled?: boolean;
    membershipFeeAmount?: number;
    isActive?: boolean;
    createdAt?: string;
    leader?: {
        fullName?: string;
        email?: string;
    };
    _count?: {
        memberships?: number;
        events?: number;
    };
    socialLinks?: Array<{ platform?: string; url?: string }>;
}

// BE Response format for getAllClubs
interface ClubListResponse {
    success: boolean;
    data: Club[];
    pagination: {
        currentPage: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

// BE Response format for getClubDetail
interface ClubDetailResponse {
    success: boolean;
    data: Club;
}

export const clubService = {
    async getAllClubs(page = 1, limit = 20, search?: string): Promise<{ clubs: Club[]; pagination: ClubListResponse['pagination'] }> {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', limit.toString());
        if (search) params.append('search', search);

        const response = await api<ClubListResponse>(`/clubs?${params.toString()}`);
        return {
            clubs: response.data || [],
            pagination: response.pagination
        };
    },

    async getClubDetail(slugOrId: string): Promise<Club | null> {
        const response = await api<ClubDetailResponse>(`/clubs/${slugOrId}`);
        return response.data || null;
    },

    async applyToClub(clubId: string, applicationData?: string): Promise<{ success: boolean; message?: string }> {
        return api<{ success: boolean; message?: string }>(`/clubs/${clubId}/apply`, {
            method: 'POST',
            body: JSON.stringify({ applicationData }),
        });
    },

    async getMyApplications(page = 1, limit = 10): Promise<{ applications: any[]; pagination: any }> {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', limit.toString());

        const response = await api<{ success: boolean; data: any[]; pagination: any }>(`/clubs/applications/my?${params.toString()}`);
        return {
            applications: response.data || [],
            pagination: response.pagination
        };
    }
};
