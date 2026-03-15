import { apiClient } from './apiClient';
import type { Category } from '@/types/transaction';

export const categoryService = {
  /**
   * Fetch all available categories.
   */
  async getCategories(): Promise<Category[]> {
    const { data } = await apiClient.get('/categories');
    return data;
  },
};
