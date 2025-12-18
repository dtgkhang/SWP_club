import api from './api';

export interface Transaction {
    id: string;
    type: 'MEMBERSHIP' | 'EVENT_TICKET';
    amount: number;
    status: 'PENDING' | 'SUCCESS' | 'CANCELLED' | 'FAILED';
    paymentMethod: string;
    paymentReference: string; // Order Code
    qrCode?: string;
    confirmedAt?: string;
    payosData?: any;
    tickets?: any[];
}

export interface CheckStatusResponse {
    transactionId: string;
    status: 'PENDING' | 'SUCCESS' | 'CANCELLED' | 'FAILED';
    previousStatus?: string;
    payosStatus?: string;
    syncedAt?: string;
}

export interface TransactionListItem extends Transaction {
    club?: {
        id: string;
        name: string;
        logoUrl?: string;
    };
    referenceMembership?: {
        club?: {
            name: string;
        };
    };
    referenceTicket?: {
        event?: {
            title: string;
        };
    };
    createdAt: string;
}

interface TransactionListResponse {
    success: boolean;
    data: TransactionListItem[];
    pagination: {
        currentPage: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

export const transactionService = {
    async getMyTransactions(filters?: {
        type?: 'MEMBERSHIP' | 'EVENT_TICKET' | 'TOPUP' | 'REFUND';
        status?: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
        page?: number;
        limit?: number;
    }): Promise<{ transactions: TransactionListItem[]; pagination: TransactionListResponse['pagination'] }> {
        const params = new URLSearchParams();
        if (filters?.type) params.append('type', filters.type);
        if (filters?.status) params.append('status', filters.status);
        params.append('page', (filters?.page || 1).toString());
        params.append('limit', (filters?.limit || 20).toString());

        const response = await api<TransactionListResponse>(`/transactions/my?${params.toString()}`);
        return {
            transactions: response.data || [],
            pagination: response.pagination
        };
    },

    async getTransaction(transactionId: string): Promise<Transaction> {
        const response = await api<{ success: boolean; data: Transaction }>(`/transactions/${transactionId}`);
        return response.data;
    },

    /**
     * Check and sync payment status from PayOS
     * This is needed when webhook cannot reach the server (e.g., localhost)
     * It will actively query PayOS API and update the database if payment is successful
     */
    async checkAndSyncPaymentStatus(transactionId: string): Promise<CheckStatusResponse> {
        const response = await api<{ success: boolean; data: CheckStatusResponse }>(
            `/transactions/${transactionId}/check-status`,
            { method: 'POST' }
        );
        return response.data;
    },

    /**
     * Cancel a pending payment
     * This will cancel the payment on PayOS and update the transaction status to CANCELLED
     */
    async cancelPayment(transactionId: string): Promise<{ success: boolean; message: string }> {
        const response = await api<{ success: boolean; message: string }>(
            `/transactions/${transactionId}/cancel`,
            { method: 'POST' }
        );
        return response;
    }
};
