import { create } from 'zustand';
import dayjs from 'dayjs';

interface FilterState {
    /** Selected month in YYYY-MM format */
    selectedMonth: string;
    /** Category ID currently filtered; null = no filter */
    activeCategoryId: number | null;
    /** Spender name currently filtered; null = no filter */
    activeSpender: string | null;
    /** Free-text search string */
    searchText: string;
    /** Sort field */
    sortField: 'transactionDate' | 'amount';
    /** Sort direction */
    sortOrder: 'asc' | 'desc';
    /** Current page (1-indexed) */
    page: number;
    /** Rows per page */
    pageSize: number;

    // Actions
    setMonth: (month: string) => void;
    goToPrevMonth: () => void;
    goToNextMonth: () => void;
    setActiveCategory: (categoryId: number | null) => void;
    toggleCategory: (categoryId: number) => void;
    setActiveSpender: (spender: string | null) => void;
    toggleSpender: (spender: string) => void;
    setSearchText: (text: string) => void;
    setSort: (field: 'transactionDate' | 'amount', order: 'asc' | 'desc') => void;
    setPage: (page: number) => void;
    resetFilters: () => void;
}

export const useFilterStore = create<FilterState>((set, get) => ({
    selectedMonth: dayjs().format('YYYY-MM'),
    activeCategoryId: null,
    activeSpender: null,
    searchText: '',
    sortField: 'transactionDate',
    sortOrder: 'desc',
    page: 1,
    pageSize: 25,

    setMonth: (month) => set({ selectedMonth: month, page: 1, activeCategoryId: null, activeSpender: null }),

    goToPrevMonth: () => {
        const prev = dayjs(get().selectedMonth + '-01').subtract(1, 'month').format('YYYY-MM');
        set({ selectedMonth: prev, page: 1, activeCategoryId: null, activeSpender: null });
    },

    goToNextMonth: () => {
        const next = dayjs(get().selectedMonth + '-01').add(1, 'month').format('YYYY-MM');
        set({ selectedMonth: next, page: 1, activeCategoryId: null, activeSpender: null });
    },

    setActiveCategory: (categoryId) => set({ activeCategoryId: categoryId, page: 1 }),

    toggleCategory: (categoryId) => {
        const current = get().activeCategoryId;
        set({ activeCategoryId: current === categoryId ? null : categoryId, page: 1 });
    },

    setActiveSpender: (spender) => set({ activeSpender: spender, page: 1 }),

    toggleSpender: (spender) => {
        const current = get().activeSpender;
        set({ activeSpender: current === spender ? null : spender, page: 1 });
    },

    setSearchText: (text) => set({ searchText: text, page: 1 }),

    setSort: (field, order) => set({ sortField: field, sortOrder: order, page: 1 }),

    setPage: (page) => set({ page }),

    resetFilters: () =>
        set({
            activeCategoryId: null,
            activeSpender: null,
            searchText: '',
            sortField: 'transactionDate',
            sortOrder: 'desc',
            page: 1,
        }),
}));
