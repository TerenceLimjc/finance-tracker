import { useQuery } from '@tanstack/react-query';
import { categoryService } from '@/services/categoryService';

/**
 * Fetches all available categories. Long cache time — categories rarely change.
 */
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getCategories(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
