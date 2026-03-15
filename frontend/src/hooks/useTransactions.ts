import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionService } from '@/services/transactionService';
import { useFilterStore } from '@/store/filterStore';

/**
 * Fetches the paginated transaction list for the currently selected filters.
 */
export function useTransactions() {
  const filters = useFilterStore((s) => ({
    month: s.selectedMonth,
    categoryId: s.activeCategoryId ?? undefined,
    searchText: s.searchText || undefined,
    sortField: s.sortField,
    sortOrder: s.sortOrder,
    page: s.page,
    pageSize: s.pageSize,
  }));

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
