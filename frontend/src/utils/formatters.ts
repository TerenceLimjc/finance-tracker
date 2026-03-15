import dayjs from 'dayjs';

/**
 * Format a number as USD currency.
 * Negative amounts are prefixed with − (not just -).
 */
export function formatCurrency(amount: number): string {
    const abs = Math.abs(amount);
    const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
    }).format(abs);
    return amount < 0 ? `-${formatted}` : `+${formatted}`;
}

/**
 * Format a number as USD with sign, without the + for negatives.
 * Used for transaction amount display.
 */
export function formatAmount(amount: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
    }).format(amount);
}

/**
 * Format a YYYY-MM-DD date string to M/D/YY for table display.
 */
export function formatDate(dateStr: string): string {
    return dayjs(dateStr).format('M/D/YY');
}

/**
 * Format a YYYY-MM month string to "March 2026" for the header.
 */
export function formatMonth(month: string): string {
    return dayjs(month + '-01').format('MMMM YYYY');
}

/**
 * Format a percentage to "35%" string.
 */
export function formatPercent(value: number): string {
    return `${Math.round(value)}%`;
}

/**
 * Format a file size in bytes to a human-readable string.
 */
export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
