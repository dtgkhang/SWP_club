import api from './api';

export interface Event {
    id: string;
    clubId: string;
    title: string;
    description?: string;
    type: 'PUBLIC' | 'INTERNAL';
    pricingType: 'FREE' | 'PAID';
    price?: number;
    capacity?: number;
    startTime?: string;
    endTime?: string;
    location?: string;
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
    }
};
