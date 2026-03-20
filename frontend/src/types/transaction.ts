// Type definitions for Transaction domain

export type ProcessingStatus = 'pending' | 'processing' | 'done' | 'failed';

export interface Category {
    id: number;
    name: string;
    parentId: number | null;
    color: string;
    icon: string | null;
    isCustom: boolean;
}

export interface Transaction {
    id: number;
    uploadId: number;
    transactionDate: string; // ISO date string: YYYY-MM-DD
    amount: number;          // negative = expense, positive = income/credit
    description: string;
    merchant: string | null;
    cardholderName: string | null;
    categoryId: number | null;
    categoryName: string | null;
    categoryConfidence: number | null;
    userNotes: string | null;
}

export interface TransactionFilters {
    month: string;        // Format: YYYY-MM
    categoryId?: number;
    spender?: string;
    searchText?: string;
    sortField?: 'transactionDate' | 'amount';
    sortOrder?: 'asc' | 'desc';
    page: number;
    pageSize: number;
}

export interface TransactionPage {
    data: Transaction[];
    total: number;
    page: number;
    pageSize: number;
}

export interface CategorySpending {
    categoryId: number;
    categoryName: string;
    total: number;
    percentage: number;
    transactionCount: number;
}

export interface SpenderSpending {
    spenderName: string;
    total: number;
    percentage: number;
    transactionCount: number;
}

export interface MonthlySummary {
    month: string;
    totalSpend: number;
    transactionCount: number;
    changeAmount: number;    // vs prior month
    changePercent: number;
    categories: CategorySpending[];
    spenders: SpenderSpending[];
}
