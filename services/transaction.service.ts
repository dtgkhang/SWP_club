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

export const transactionService = {
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
    }
};
