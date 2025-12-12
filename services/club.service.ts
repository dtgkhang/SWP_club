import api from './api';

export interface Club {
    id: string;
    name: string;
    slug: string;
    description?: string;
    logoUrl?: string;
    coverUrl?: string;
    membershipFeeEnabled: boolean;
    membershipFeeAmount: number;
    isActive: boolean;
    // Add other fields as needed based on Schema
}

export const clubService = {
    async getAllClubs(): Promise<Club[]> {
        // Backend returns the list directly or wrapped?
        // Checking routes/clubs.js: res.json(clubs) -> Array
        // But swagger says "Danh sách CLB"
        // Let's assume it returns an array for now based on standard express practices
        return api<Club[]>('/clubs');
    },

    async getClubDetail(slugOrId: string): Promise<Club> {
        return api<Club>(`/clubs/${slugOrId}`);
    }
};
