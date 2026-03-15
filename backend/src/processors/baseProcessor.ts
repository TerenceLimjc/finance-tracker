/**
 * BaseProcessor interface.
 * All file processors (PDF, CSV, Excel) must implement this contract.
 */
export interface ParsedTransaction {
    transactionDate: string; // YYYY-MM-DD
    amount: number;          // negative = expense, positive = income/credit
    description: string;
    merchant?: string;
    cardholderName?: string; // per-section cardholder (e.g. supplementary card holders)
}

export interface BaseProcessor {
    /**
     * Parse the file at the given path and return raw transaction rows.
     */
    parse(filePath: string): Promise<ParsedTransaction[]>;
}

// ─── Column detection (ML-1) ──────────────────────────────────────────────────

export interface ColumnMap {
    dateCol: string;
    descriptionCol: string;
    merchantCol?: string;
    /** Single signed amount column (positive or negative) */
    amountCol?: string;
    /** Separate debit column — value is always positive, represents money out */
    debitCol?: string;
    /** Separate credit column — value is always positive, represents money in */
    creditCol?: string;
}

const KNOWN_LAYOUTS: Array<{ dateCol: string; descriptionCol: string; debitCol?: string; creditCol?: string; amountCol?: string }> = [
    // DBS CSV
    { dateCol: 'Transaction Date', descriptionCol: 'Reference', debitCol: 'Debit', creditCol: 'Credit' },
    // OCBC CSV
    { dateCol: 'Date', descriptionCol: 'Description', debitCol: 'Withdrawals', creditCol: 'Deposits' },
    // UOB CSV
    { dateCol: 'Transaction Date', descriptionCol: 'Description', debitCol: 'Debit Amount', creditCol: 'Credit Amount' },
    // Generic signed amount
    { dateCol: 'Date', descriptionCol: 'Description', amountCol: 'Amount' },
    { dateCol: 'Date', descriptionCol: 'Merchant', amountCol: 'Amount' },
];

/**
 * Detects column layout from CSV/Excel headers.
 * ML Engineer (ML-1): extend KNOWN_LAYOUTS or improve heuristics as needed.
 */
export function detectColumns(headers: string[]): ColumnMap | null {
    const normalised = headers.map((h) => h.trim());

    for (const layout of KNOWN_LAYOUTS) {
        const has = (col: string | undefined) => col === undefined || normalised.includes(col);
        if (
            normalised.includes(layout.dateCol) &&
            normalised.includes(layout.descriptionCol) &&
            has(layout.debitCol) &&
            has(layout.creditCol) &&
            has(layout.amountCol)
        ) {
            return {
                dateCol: layout.dateCol,
                descriptionCol: layout.descriptionCol,
                merchantCol: undefined,
                amountCol: layout.amountCol,
                debitCol: layout.debitCol,
                creditCol: layout.creditCol,
            };
        }
    }
    return null;
}

/**
 * Normalises a raw date string to YYYY-MM-DD.
 * Handles DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, D MMM YYYY.
 */
export function normaliseDate(raw: string): string {
    const s = raw.trim();

    // YYYY-MM-DD already
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

    // DD/MM/YYYY or DD-MM-YYYY
    const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmy) {
        const [, d, m, y] = dmy;
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }

    // D MMM YYYY  or  DD MMM YYYY
    const months: Record<string, string> = {
        jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
        jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
    };
    const mdy = s.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/);
    if (mdy) {
        const [, d, mon, y] = mdy;
        const m = months[mon.toLowerCase()];
        if (m) return `${y}-${m}-${d.padStart(2, '0')}`;
    }

    // ISO fallback
    const parsed = new Date(s);
    if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().slice(0, 10);
    }

    throw new Error(`Cannot parse date: "${raw}"`);
}

/**
 * Converts debit/credit string pair into a signed float.
 * Debit = money out = negative. Credit = money in = positive.
 */
export function normaliseAmount(debit: string, credit: string): number {
    const parse = (v: string) => parseFloat(v.replace(/[^0-9.\-]/g, '')) || 0;
    const d = parse(debit);
    const c = parse(credit);
    if (c > 0) return c;
    if (d > 0) return -d;
    return 0;
}
