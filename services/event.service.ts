import api from './api';

export interface Event {
    id: string;
    clubId: string;
    title: string;
    description?: string;
    type: 'PUBLIC' | 'INTERNAL';
    pricingType: 'FREE' | 'PAID';
    format?: 'ONLINE' | 'OFFLINE';
    onlineLink?: string;
    price?: number;
    capacity?: number;
    startTime?: string;
    endTime?: string;
    location?: string;
    imageUrl?: string; // Event cover image
    isActive?: boolean;
    createdAt?: string;
    club?: {
        id: string;
        name: string;
        slug: string;
        logoUrl?: string;
    };
    createdBy?: {
        id: string;
        fullName?: string;
    };
    _count?: {
        tickets?: number;
    };
}

// BE Response format
interface EventListResponse {
    success: boolean;
    count: number;
    data: Event[];
}

interface EventDetailResponse {
    success: boolean;
    data: Event;
}

interface RegisterEventResponse {
    success: boolean;
    message: string;
    data: {
        eventId: string;
        eventTitle: string;
        type: 'FREE' | 'PAID';
        // For FREE events
        tickets?: Array<{
            id: string;
            qrCode: string;
            ticketType: string;
            status: string;
        }>;
        // For PAID events
        paymentLink?: string;
        qrCode?: string; // QR code data URL (base64) for PayOS payment
        orderCode?: number;
        amount?: number;
        transactionId?: string;
    };
}

export const eventService = {
    async getAllEvents(filters?: { clubId?: string; type?: string; pricingType?: string; search?: string }): Promise<Event[]> {
        const params = new URLSearchParams();
        if (filters?.clubId) params.append('clubId', filters.clubId);
        if (filters?.type) params.append('type', filters.type);
        if (filters?.pricingType) params.append('pricingType', filters.pricingType);
        if (filters?.search) params.append('search', filters.search);

        const queryString = params.toString();
        const response = await api<EventListResponse>(`/events${queryString ? `?${queryString}` : ''}`);
        return response.data || [];
    },

    async getEventDetail(eventId: string): Promise<Event | null> {
        const response = await api<EventDetailResponse>(`/events/${eventId}`);
        return response.data || null;
    },

    async registerEvent(eventId: string, quantity = 1, ticketType?: string): Promise<RegisterEventResponse['data']> {
        const response = await api<RegisterEventResponse>(`/events/${eventId}/register`, {
            method: 'POST',
            body: JSON.stringify({ quantity, ticketType }),
        });
        return response.data;
    },

    async getMyTickets(): Promise<any[]> {
        const response = await api<{ success: boolean; data: { tickets: any[]; total: number } }>('/tickets/my-tickets');
        return response.data?.tickets || [];
    },

    async checkIn(qrCode: string): Promise<any> {
        const response = await api<{ success: boolean; message: string; data: any }>('/checkin/qr', {
            method: 'POST',
            body: JSON.stringify({ qrCode }),
        });
        return response;
    },

    async submitFeedback(eventId: string, rating: number, comment?: string): Promise<any> {
        const response = await api<{ success: boolean; message: string; data: any }>(`/events/${eventId}/feedback`, {
            method: 'POST',
            body: JSON.stringify({ rating, comment }),
        });
        return response;
    },

    async getEventFeedbacks(eventId: string): Promise<any[]> {
        const response = await api<{ success: boolean; data: any[] }>(`/events/${eventId}/feedback`);
        return response.data || [];
    },

    async getMyFeedback(eventId: string): Promise<any | null> {
        try {
            const feedbacks = await this.getEventFeedbacks(eventId);
            // The API returns user's own feedback if they have one
            return feedbacks.find((f: any) => f.isOwn) || null;
        } catch {
            return null;
        }
    },

    // ========== Staff APIs ==========

    /**
     * Get event participants list (Staff/Leader only)
     * @param eventId Event ID
     * @param filters Optional filters (checkedIn, search)
     */
    async getEventParticipants(
        eventId: string,
        filters?: { checkedIn?: boolean; search?: string }
    ): Promise<{
        participants: Array<{
            id: string;
            user: {
                id: string;
                fullName?: string;
                email?: string;
                studentCode?: string;
                phone?: string;
            };
            ticket?: {
                id: string;
                qrCode?: string;
                ticketType: string;
                status: string;
            };
            checkedInAt?: string;
            registeredAt?: string;
        }>;
        total: number;
        checkedInCount: number;
    }> {
        const params = new URLSearchParams();
        if (filters?.checkedIn !== undefined) {
            params.append('checkedIn', filters.checkedIn.toString());
        }
        if (filters?.search) {
            params.append('search', filters.search);
        }

        const queryString = params.toString();
        const response = await api<{
            success: boolean;
            data: {
                participants: any[];
                total: number;
                checkedInCount: number;
            };
        }>(`/events/${eventId}/participants${queryString ? `?${queryString}` : ''}`);

        return response.data || { participants: [], total: 0, checkedInCount: 0 };
    },

    /**
     * Check-in by email (for ONLINE events or backup for OFFLINE events)
     * @param eventId Event ID
     * @param email Attendee's email
     */
    async checkInByEmail(eventId: string, email: string): Promise<{
        success: boolean;
        message: string;
        isAlreadyCheckedIn?: boolean;
        data?: {
            user?: {
                id: string;
                fullName?: string;
                email?: string;
                studentCode?: string;
            };
            checkedInAt?: string;
        };
    }> {
        const response = await api<{
            success: boolean;
            message: string;
            data: any;
        }>('/checkin/email', {
            method: 'POST',
            body: JSON.stringify({ eventId, email }),
        });
        return {
            success: response.success,
            message: response.message,
            isAlreadyCheckedIn: response.data?.isAlreadyCheckedIn,
            data: response.data,
        };
    }
};

