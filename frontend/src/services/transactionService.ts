import { apiClient } from './apiClient';
import type {
    TransactionFilters,
    TransactionPage,
    MonthlySummary,
} from '@/types/transaction';

export const transactionService = {
    /**
     * Fetch a paginated, filtered list of transactions for a given month.
     */
    async getTransactions(filters: TransactionFilters): Promise<TransactionPage> {
        const { data } = await apiClient.get('/transactions', { params: filters });
        return data;
    },

    /**
     * Update the category of a single transaction (inline category edit).
     */
    async updateCategory(transactionId: number, categoryId: number): Promise<void> {
        await apiClient.put(`/transactions/${transactionId}`, { categoryId });
    },

    /**
     * Fetch the monthly summary (totals, category breakdown, MoM change).
     */
    async getMonthlySummary(month: string): Promise<MonthlySummary> {
        const { data } = await apiClient.get('/analytics/spending', { params: { month } });
        return data;
    },
};
