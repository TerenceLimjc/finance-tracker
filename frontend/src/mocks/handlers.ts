/**
 * MSW request handlers for dev-mode API mocking.
 * Intercepts all /api/* requests and returns realistic mock data.
 */
import { http, HttpResponse, delay } from 'msw';
import {
    MOCK_CATEGORIES,
    MOCK_TRANSACTIONS,
    MOCK_SUMMARY_MARCH,
    MOCK_UPLOADS,
} from './mockData';
import type { MonthlySummary, TransactionPage } from '@/types/transaction';
import type { UploadHistoryPage } from '@/types/upload';

// In-memory mutable state so inline category edits persist within the session
let transactions = MOCK_TRANSACTIONS.map((t) => ({ ...t }));
let uploads = MOCK_UPLOADS.map((u) => ({ ...u }));

// ─── /api/categories ──────────────────────────────────────────────────────────
const categoriesHandler = http.get('/api/categories', async () => {
    await delay(120);
    return HttpResponse.json(MOCK_CATEGORIES);
});

// ─── /api/transactions ────────────────────────────────────────────────────────
const transactionsHandler = http.get('/api/transactions', async ({ request }) => {
    await delay(200);
    const url = new URL(request.url);
    const month = url.searchParams.get('month') ?? '2026-03';
    const categoryId = url.searchParams.get('categoryId');
    const searchText = (url.searchParams.get('searchText') ?? '').toLowerCase();
    const sortField = (url.searchParams.get('sortField') ?? 'transactionDate') as 'transactionDate' | 'amount';
    const sortOrder = url.searchParams.get('sortOrder') ?? 'desc';
    const page = parseInt(url.searchParams.get('page') ?? '1', 10);
    const pageSize = parseInt(url.searchParams.get('pageSize') ?? '25', 10);

    // Filter
    let filtered = transactions.filter((t) => t.transactionDate.startsWith(month));
    if (categoryId) {
        filtered = filtered.filter((t) => t.categoryId === parseInt(categoryId, 10));
    }
    if (searchText) {
        filtered = filtered.filter(
            (t) =>
                t.description.toLowerCase().includes(searchText) ||
                (t.merchant ?? '').toLowerCase().includes(searchText),
        );
    }

    // Sort
    filtered.sort((a, b) => {
        let diff = 0;
        if (sortField === 'amount') {
            diff = a.amount - b.amount;
        } else {
            diff = a.transactionDate.localeCompare(b.transactionDate);
        }
        return sortOrder === 'asc' ? diff : -diff;
    });

    // Paginate
    const total = filtered.length;
    const data = filtered.slice((page - 1) * pageSize, page * pageSize);

    return HttpResponse.json<TransactionPage>({ data, total, page, pageSize });
});

// ─── /api/transactions/:id (category update) ──────────────────────────────────
const updateCategoryHandler = http.put('/api/transactions/:id', async ({ request, params }) => {
    await delay(150);
    const { id } = params;
    const body = await request.json() as { categoryId: number };
    const idx = transactions.findIndex((t) => t.id === parseInt(id as string, 10));
    if (idx !== -1) {
        const cat = MOCK_CATEGORIES.find((c) => c.id === body.categoryId);
        transactions[idx] = {
            ...transactions[idx],
            categoryId: body.categoryId,
            categoryName: cat?.name ?? null,
        };
    }
    return HttpResponse.json({ success: true });
});

// ─── /api/analytics/spending ──────────────────────────────────────────────────
const spendingHandler = http.get('/api/analytics/spending', async ({ request }) => {
    await delay(220);
    const url = new URL(request.url);
    const month = url.searchParams.get('month') ?? '2026-03';

    if (month === '2026-03') {
        // Recompute totals from in-memory transactions so category edits reflect in chart
        const monthTxs = transactions.filter((t) => t.transactionDate.startsWith('2026-03'));
        const totalSpend = monthTxs.reduce((sum, t) => sum + Math.abs(t.amount), 0);

        const categoryMap = new Map<number, { name: string; total: number; count: number }>();
        for (const t of monthTxs) {
            if (!t.categoryId || !t.categoryName) continue;
            const entry = categoryMap.get(t.categoryId) ?? { name: t.categoryName, total: 0, count: 0 };
            entry.total += Math.abs(t.amount);
            entry.count += 1;
            categoryMap.set(t.categoryId, entry);
        }

        const categories = Array.from(categoryMap.entries()).map(([id, val]) => ({
            categoryId: id,
            categoryName: val.name,
            total: parseFloat(val.total.toFixed(2)),
            percentage: parseFloat(((val.total / totalSpend) * 100).toFixed(1)),
            transactionCount: val.count,
        }));

        return HttpResponse.json<MonthlySummary>({
            ...MOCK_SUMMARY_MARCH,
            totalSpend: parseFloat(totalSpend.toFixed(2)),
            transactionCount: monthTxs.length,
            categories,
        });
    }

    // Return zeroed summary for other months
    return HttpResponse.json<MonthlySummary>({
        month,
        totalSpend: 0,
        transactionCount: 0,
        changeAmount: 0,
        changePercent: 0,
        categories: [],
    });
});

// ─── /api/uploads ─────────────────────────────────────────────────────────────
const uploadsHandler = http.get('/api/uploads', async () => {
    await delay(180);
    return HttpResponse.json<UploadHistoryPage>({
        data: uploads,
        total: uploads.length,
    });
});

// ─── /api/uploads (POST — file upload) ───────────────────────────────────────
const uploadFileHandler = http.post('/api/uploads', async () => {
    await delay(800);
    const newUpload = {
        id: uploads.length + 1,
        filename: `dbs_new_${Date.now()}.csv`,
        originalFilename: 'NewStatement.csv',
        fileSize: 9_500,
        fileType: 'text/csv',
        uploadDate: new Date().toISOString(),
        processingStatus: 'done' as const,
        transactionCount: 12,
        dateRangeStart: '2026-03-01',
        dateRangeEnd: '2026-03-15',
        bankInfo: 'DBS Bank',
        isDuplicate: false,
        errorMessage: null,
    };
    uploads = [newUpload, ...uploads];
    return HttpResponse.json(newUpload, { status: 201 });
});

// ─── /api/uploads/:id (DELETE) ────────────────────────────────────────────────
const deleteUploadHandler = http.delete('/api/uploads/:id', async ({ params }) => {
    await delay(200);
    const { id } = params;
    uploads = uploads.filter((u) => u.id !== parseInt(id as string, 10));
    return HttpResponse.json({ success: true });
});

export const handlers = [
    categoriesHandler,
    transactionsHandler,
    updateCategoryHandler,
    spendingHandler,
    uploadsHandler,
    uploadFileHandler,
    deleteUploadHandler,
];
