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

export const transactionService = {
    async getTransaction(transactionId: string): Promise<Transaction> {
        const response = await api<{ success: boolean; data: Transaction }>(`/transactions/${transactionId}`);
        return response.data;
    }
};
