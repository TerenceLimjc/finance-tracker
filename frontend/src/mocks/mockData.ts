/**
 * Realistic mock data for MSW dev-mode handlers.
 * Mirrors the exact shapes from frontend/src/types/.
 */
import type { Category, Transaction, MonthlySummary } from '@/types/transaction';
import type { Upload } from '@/types/upload';

// ─── Categories ────────────────────────────────────────────────────────────────
export const MOCK_CATEGORIES: Category[] = [
    { id: 1, name: 'Food/Dining', parentId: null, color: '#ff7875', icon: '🍔', isCustom: false },
    { id: 2, name: 'Transport', parentId: null, color: '#69b1ff', icon: '🚗', isCustom: false },
    { id: 3, name: 'Shopping', parentId: null, color: '#ffd666', icon: '🛍️', isCustom: false },
    { id: 4, name: 'Bills', parentId: null, color: '#b37feb', icon: '📄', isCustom: false },
    { id: 5, name: 'Entertainment', parentId: null, color: '#5cdbd3', icon: '🎬', isCustom: false },
    { id: 6, name: 'Health', parentId: null, color: '#ff9c6e', icon: '💊', isCustom: false },
    { id: 7, name: 'Travel', parentId: null, color: '#85a5ff', icon: '✈️', isCustom: false },
    { id: 8, name: 'Other', parentId: null, color: '#d9d9d9', icon: '📦', isCustom: false },
];

// ─── Transactions (March 2026) ──────────────────────────────────────────────────
export const MOCK_TRANSACTIONS: Transaction[] = [
    { id: 1, uploadId: 1, transactionDate: '2026-03-01', amount: -4.50, description: 'Kopi at Ya Kun', merchant: 'Ya Kun Kaya Toast', cardholderName: 'You Yin', categoryId: 1, categoryName: 'Food/Dining', categoryConfidence: 0.95, userNotes: null },
    { id: 2, uploadId: 1, transactionDate: '2026-03-02', amount: -38.90, description: 'Grab to Orchard', merchant: 'Grab', cardholderName: 'Terence Lim', categoryId: 2, categoryName: 'Transport', categoryConfidence: 0.98, userNotes: null },
    { id: 3, uploadId: 1, transactionDate: '2026-03-03', amount: -129.00, description: 'NTUC FairPrice Groceries', merchant: 'NTUC FairPrice', cardholderName: 'You Yin', categoryId: 1, categoryName: 'Food/Dining', categoryConfidence: 0.91, userNotes: null },
    { id: 4, uploadId: 1, transactionDate: '2026-03-04', amount: -89.90, description: 'Uniqlo T-Shirts', merchant: 'Uniqlo', cardholderName: 'Terence Lim', categoryId: 3, categoryName: 'Shopping', categoryConfidence: 0.97, userNotes: null },
    { id: 5, uploadId: 1, transactionDate: '2026-03-05', amount: -18.50, description: 'Netflix Subscription', merchant: 'Netflix', cardholderName: 'You Yin', categoryId: 5, categoryName: 'Entertainment', categoryConfidence: 0.99, userNotes: null },
    { id: 6, uploadId: 1, transactionDate: '2026-03-06', amount: -250.00, description: 'SP Services Electricity', merchant: 'SP Services', cardholderName: 'Terence Lim', categoryId: 4, categoryName: 'Bills', categoryConfidence: 0.99, userNotes: null },
    { id: 7, uploadId: 1, transactionDate: '2026-03-07', amount: -14.80, description: 'McDonald\'s Lunch', merchant: 'McDonald\'s', cardholderName: 'You Yin', categoryId: 1, categoryName: 'Food/Dining', categoryConfidence: 0.96, userNotes: null },
    { id: 8, uploadId: 1, transactionDate: '2026-03-08', amount: -22.40, description: 'EZ-Link Top Up', merchant: 'EZ-Link', cardholderName: 'Terence Lim', categoryId: 2, categoryName: 'Transport', categoryConfidence: 0.94, userNotes: null },
    { id: 9, uploadId: 1, transactionDate: '2026-03-09', amount: -55.00, description: 'Guardian Pharmacy', merchant: 'Guardian', cardholderName: 'You Yin', categoryId: 6, categoryName: 'Health', categoryConfidence: 0.88, userNotes: null },
    { id: 10, uploadId: 1, transactionDate: '2026-03-10', amount: -199.00, description: 'Shopee Electronics', merchant: 'Shopee', cardholderName: 'Terence Lim', categoryId: 3, categoryName: 'Shopping', categoryConfidence: 0.85, userNotes: null },
    { id: 11, uploadId: 1, transactionDate: '2026-03-11', amount: -12.90, description: 'Starbucks Coffee', merchant: 'Starbucks', cardholderName: 'You Yin', categoryId: 1, categoryName: 'Food/Dining', categoryConfidence: 0.97, userNotes: null },
    { id: 12, uploadId: 1, transactionDate: '2026-03-12', amount: -320.00, description: 'SingTel Mobile Plan', merchant: 'SingTel', cardholderName: 'Terence Lim', categoryId: 4, categoryName: 'Bills', categoryConfidence: 0.99, userNotes: null },
    { id: 13, uploadId: 1, transactionDate: '2026-03-13', amount: -75.00, description: 'Cinema Tickets', merchant: 'Golden Village', cardholderName: 'You Yin', categoryId: 5, categoryName: 'Entertainment', categoryConfidence: 0.93, userNotes: null },
    { id: 14, uploadId: 1, transactionDate: '2026-03-14', amount: -18.00, description: 'Watsons Health Products', merchant: 'Watsons', cardholderName: 'Terence Lim', categoryId: 6, categoryName: 'Health', categoryConfidence: 0.90, userNotes: null },
    { id: 15, uploadId: 1, transactionDate: '2026-03-15', amount: -580.00, description: 'SQ Flight to Bangkok', merchant: 'Singapore Airlines', cardholderName: 'You Yin', categoryId: 7, categoryName: 'Travel', categoryConfidence: 0.99, userNotes: null },
    { id: 16, uploadId: 1, transactionDate: '2026-03-16', amount: -32.00, description: 'Kopitiam Food Court', merchant: 'Kopitiam', cardholderName: 'Terence Lim', categoryId: 1, categoryName: 'Food/Dining', categoryConfidence: 0.94, userNotes: null },
    { id: 17, uploadId: 1, transactionDate: '2026-03-17', amount: -45.00, description: 'Parking at Vivocity', merchant: 'Wilson Parking', cardholderName: 'You Yin', categoryId: 2, categoryName: 'Transport', categoryConfidence: 0.89, userNotes: null },
    { id: 18, uploadId: 1, transactionDate: '2026-03-18', amount: -28.80, description: 'Spotify Family Plan', merchant: 'Spotify', cardholderName: 'Terence Lim', categoryId: 5, categoryName: 'Entertainment', categoryConfidence: 0.99, userNotes: null },
    { id: 19, uploadId: 1, transactionDate: '2026-03-19', amount: -110.00, description: 'Zara Clothing', merchant: 'Zara', cardholderName: 'You Yin', categoryId: 3, categoryName: 'Shopping', categoryConfidence: 0.92, userNotes: null },
    { id: 20, uploadId: 1, transactionDate: '2026-03-20', amount: -9.90, description: 'Amazon Prime Video', merchant: 'Amazon', cardholderName: 'Terence Lim', categoryId: 5, categoryName: 'Entertainment', categoryConfidence: 0.99, userNotes: null },
];

// ─── Monthly Summary (March 2026) ──────────────────────────────────────────────
export const MOCK_SUMMARY_MARCH: MonthlySummary = {
    month: '2026-03',
    totalSpend: 2053.60,
    transactionCount: 20,
    changeAmount: 213.40,
    changePercent: 11.6,
    categories: [
        { categoryId: 1, categoryName: 'Food/Dining', total: 200.10, percentage: 9.7, transactionCount: 6 },
        { categoryId: 2, categoryName: 'Transport', total: 106.30, percentage: 5.2, transactionCount: 3 },
        { categoryId: 3, categoryName: 'Shopping', total: 398.90, percentage: 19.4, transactionCount: 3 },
        { categoryId: 4, categoryName: 'Bills', total: 570.00, percentage: 27.8, transactionCount: 2 },
        { categoryId: 5, categoryName: 'Entertainment', total: 135.20, percentage: 6.6, transactionCount: 4 },
        { categoryId: 6, categoryName: 'Health', total: 73.00, percentage: 3.6, transactionCount: 2 },
        { categoryId: 7, categoryName: 'Travel', total: 580.00, percentage: 28.2, transactionCount: 1 },
    ],
    spenders: [
        { spenderName: 'You Yin', total: 1044.70, percentage: 50.9, transactionCount: 10 },
        { spenderName: 'Terence Lim', total: 1008.90, percentage: 49.1, transactionCount: 10 },
    ],
};

// ─── Upload History ─────────────────────────────────────────────────────────────
export const MOCK_UPLOADS: Upload[] = [
    {
        id: 1,
        filename: 'dbs_mar2026_abc123.csv',
        originalFilename: 'DBS_Statement_Mar2026.csv',
        fileSize: 14_320,
        fileType: 'text/csv',
        uploadDate: '2026-03-15T10:22:00Z',
        processingStatus: 'done',
        transactionCount: 20,
        dateRangeStart: '2026-03-01',
        dateRangeEnd: '2026-03-20',
        bankInfo: 'DBS Bank',
        isDuplicate: false,
        errorMessage: null,
    },
    {
        id: 2,
        filename: 'dbs_feb2026_def456.csv',
        originalFilename: 'DBS_Statement_Feb2026.csv',
        fileSize: 18_950,
        fileType: 'text/csv',
        uploadDate: '2026-02-28T09:15:00Z',
        processingStatus: 'done',
        transactionCount: 34,
        dateRangeStart: '2026-02-01',
        dateRangeEnd: '2026-02-28',
        bankInfo: 'DBS Bank',
        isDuplicate: false,
        errorMessage: null,
    },
    {
        id: 3,
        filename: 'ocbc_jan2026_ghi789.csv',
        originalFilename: 'OCBC_Statement_Jan2026.csv',
        fileSize: 12_100,
        fileType: 'text/csv',
        uploadDate: '2026-01-31T14:05:00Z',
        processingStatus: 'done',
        transactionCount: 27,
        dateRangeStart: '2026-01-01',
        dateRangeEnd: '2026-01-31',
        bankInfo: 'OCBC Bank',
        isDuplicate: false,
        errorMessage: null,
    },
];
