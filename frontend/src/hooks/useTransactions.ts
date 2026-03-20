import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useShallow } from 'zustand/react/shallow';
import { transactionService } from '@/services/transactionService';
import { useFilterStore } from '@/store/filterStore';

/**
 * Fetches the paginated transaction list for the currently selected filters.
 * useShallow performs a shallow equality check so the selector object doesn't
 * trigger an infinite re-render loop on every render.
 */
export function useTransactions() {
    const filters = useFilterStore(
        useShallow((s) => ({
            month: s.selectedMonth,
            categoryId: s.activeCategoryId ?? undefined,
            spender: s.activeSpender ?? undefined,
            searchText: s.searchText || undefined,
            sortField: s.sortField,
            sortOrder: s.sortOrder,
            page: s.page,
            pageSize: s.pageSize,
        })),
    );

    return useQuery({
        queryKey: ['transactions', filters],
        queryFn: () => transactionService.getTransactions(filters),
    });
}

/**
 * Fetches the monthly summary (totals + category breakdown) for the selected month.
 */
export function useMonthlySummary() {
    const month = useFilterStore((s) => s.selectedMonth);

    return useQuery({
        queryKey: ['monthlySummary', month],
        queryFn: () => transactionService.getMonthlySummary(month),
    });
}

/**
 * Category breakdown scoped to a specific spender.
 * Only fires when spender is non-null. Used to cross-filter the Category chart.
 */
export function useCategoryBreakdown(spender: string | null) {
    const month = useFilterStore((s) => s.selectedMonth);

    return useQuery({
        queryKey: ['monthlySummary', month, { spender }],
        queryFn: () => transactionService.getMonthlySummary(month, { spender: spender! }),
        enabled: spender !== null,
    });
}

/**
 * Spender breakdown scoped to a specific category.
 * Only fires when categoryId is non-null. Used to cross-filter the Spender chart.
 */
export function useSpenderBreakdown(categoryId: number | null) {
    const month = useFilterStore((s) => s.selectedMonth);

    return useQuery({
        queryKey: ['monthlySummary', month, { categoryId }],
        queryFn: () => transactionService.getMonthlySummary(month, { categoryId: categoryId! }),
        enabled: categoryId !== null,
    });
}

/**
 * Mutation to reassign the category of a transaction inline.
 */
export function useUpdateCategory() {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: ({ transactionId, categoryId }: { transactionId: number; categoryId: number }) =>
            transactionService.updateCategory(transactionId, categoryId),
        onSuccess: () => {
            // Invalidate both transactions and the monthly summary so chart updates too
            qc.invalidateQueries({ queryKey: ['transactions'] });
            qc.invalidateQueries({ queryKey: ['monthlySummary'] });
        },
    });
}

/**
 * Mutation to delete a single transaction.
 */
export function useDeleteTransaction() {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: (transactionId: number) => transactionService.deleteTransaction(transactionId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['transactions'] });
            qc.invalidateQueries({ queryKey: ['monthlySummary'] });
        },
    });
}
