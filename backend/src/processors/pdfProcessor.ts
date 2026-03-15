import fs from 'fs';
import pdfParse from 'pdf-parse';
import type { BaseProcessor, ParsedTransaction } from './baseProcessor';

export interface PdfMeta {
    bankInfo: string | null;
    cardholderName: string | null;
    dateRangeStart: string | null; // YYYY-MM-DD
    dateRangeEnd: string | null;   // YYYY-MM-DD
}

// ─── Date utilities ───────────────────────────────────────────────────────────

const MONTHS: Record<string, number> = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

function parseDateWithYear(str: string): Date | null {
    const m = str.trim().match(/^(\d{2})\s+([A-Za-z]{3})\s+(\d{4})$/);
    if (!m) return null;
    const month = MONTHS[m[2].toLowerCase()];
    if (month === undefined) return null;
    return new Date(parseInt(m[3], 10), month, parseInt(m[1], 10));
}

function parseDDMon(ddMon: string, year: number): Date | null {
    const m = ddMon.trim().match(/^(\d{2})\s+([A-Za-z]{3})$/);
    if (!m) return null;
    const month = MONTHS[m[2].toLowerCase()];
    if (month === undefined) return null;
    return new Date(year, month, parseInt(m[1], 10));
}

function dateToYYYYMMDD(d: Date): string {
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${y}-${mo}-${da}`;
}

/**
 * Resolves a "DD MMM" date string to a full Date using the statement period.
 * Handles cross-year statements (e.g. Dec 2025 → Jan 2026).
 */
function resolveDDMonDate(ddMon: string, periodStart: Date, periodEnd: Date): Date | null {
    const d1 = parseDDMon(ddMon, periodStart.getFullYear());
    if (d1 && d1 >= periodStart && d1 <= periodEnd) return d1;
    // Try end year for cross-year statements
    const d2 = parseDDMon(ddMon, periodEnd.getFullYear());
    return d2 ?? d1;
}

// ─── Amount utilities ─────────────────────────────────────────────────────────

function parseHSBCAmount(raw: string, isCR: boolean): number {
    const abs = parseFloat(raw.replace(/,/g, ''));
    return isCR ? +abs : -abs;
}

function parseUOBAmount(raw: string): number {
    const isCR = /CR$/i.test(raw.trim());
    const abs = parseFloat(raw.replace(/[,\sCR]/gi, ''));
    return isCR ? +abs : -abs;
}

// ─── Format detection ─────────────────────────────────────────────────────────

function detectBankFormat(text: string): 'hsbc-visa-advance' | 'uob-one-card' | 'generic' {
    if (/HSBC\s+VISA\s+ADVANCE/i.test(text)) return 'hsbc-visa-advance';
    if (/UOB\s+ONE\s+CARD|United\s+Overseas\s+Bank/i.test(text)) return 'uob-one-card';
    return 'generic';
}

// ─── HSBC Visa Advance parser ─────────────────────────────────────────────────

const HSBC_SKIP_PATTERNS = [
    /HSBC\s+VISA\s+ADVANCE/i,
    /[A-Z\s]+\d{4}-XXXX-XXXX-\d{4}/,
    /Previous\s+Statement\s+Balance/i,
    /Continued\s+on\s+next\s+page/i,
    /Statement\s+of\s+Account/i,
    /Account\s+Summary/i,
    /POST\s+DATE\s+TRAN\s+DATE/i,
    /^(AMOUNT|DESCRIPTION|SGD)\s*$/i,
    /^\s*Page\s+\d+/i,
];

const HSBC_TX_LINE = /^(\d{2}\s+[A-Za-z]{3})\s{2,}(\d{2}\s+[A-Za-z]{3})\s{2,}(.+?)\s{2,}([\d,]+\.\d{2})(CR)?$/;
const HSBC_CONTINUATION_PATTERN = /^\s{2,}[A-Z\s]+\s{2,}[A-Z]{2}\s*$/;

interface ParseResult {
    transactions: ParsedTransaction[];
    meta: PdfMeta;
}

function parseHSBC(text: string): ParseResult {
    const meta: PdfMeta = { bankInfo: null, cardholderName: null, dateRangeStart: null, dateRangeEnd: null };

    // Extract statement period: "From 06 DEC 2025 to 05 JAN 2026"
    const PERIOD_PATTERN = /From\s+(\d{2}\s+[A-Z]{3}\s+\d{4})\s+to\s+(\d{2}\s+[A-Z]{3}\s+\d{4})/i;
    const periodMatch = text.match(PERIOD_PATTERN);
    let periodStart: Date | null = null;
    let periodEnd: Date | null = null;
    if (periodMatch) {
        periodStart = parseDateWithYear(periodMatch[1]);
        periodEnd = parseDateWithYear(periodMatch[2]);
        if (periodStart) meta.dateRangeStart = dateToYYYYMMDD(periodStart);
        if (periodEnd) meta.dateRangeEnd = dateToYYYYMMDD(periodEnd);
    }

    // Extract card number — use last four digits
    const CARD_PATTERN = /(\d{4}-\d{4}-\d{4}-(\d{4}))/;
    const cardMatch = text.match(CARD_PATTERN);
    const lastFour = cardMatch?.[2] ?? 'XXXX';
    meta.bankInfo = `HSBC Visa Advance *${lastFour}`;

    // Extract cardholder name: all-caps line not containing "HSBC" or "VISA"
    const NAME_PATTERN = /^([A-Z][A-Z\s]+)$/m;
    meta.cardholderName =
        text
            .split('\n')
            .map((l) => l.trim())
            .find((l) => NAME_PATTERN.test(l) && !l.includes('HSBC') && !l.includes('VISA')) ?? null;

    const start = periodStart ?? new Date(2000, 0, 1);
    const end = periodEnd ?? new Date(2099, 11, 31);
    const transactions: ParsedTransaction[] = [];

    for (const line of text.split('\n')) {
        try {
            const trimmed = line.trim();
            if (!trimmed) continue;
            if (HSBC_SKIP_PATTERNS.some((p) => p.test(trimmed))) continue;
            if (HSBC_CONTINUATION_PATTERN.test(line)) continue;

            const match = trimmed.match(HSBC_TX_LINE);
            if (!match) continue;

            const [, , tranDate, description, amountRaw, crFlag] = match;
            const resolved = resolveDDMonDate(tranDate.trim(), start, end);
            if (!resolved) continue;

            transactions.push({
                transactionDate: dateToYYYYMMDD(resolved),
                description: description.trim(),
                amount: parseHSBCAmount(amountRaw, !!crFlag),
            });
        } catch {
            // skip malformed line
        }
    }

    return { transactions, meta };
}

// ─── UOB One Card parser ──────────────────────────────────────────────────────

const UOB_SKIP_PATTERNS = [
    /United\s+Overseas\s+Bank/i,
    /UOB\s+ONE\s+CARD\s*$/i,
    /^\d{4}-\d{4}-\d{4}-\d{4}\s+[A-Z\s]+(\(continued\))?$/i,
    /^Post\s+Date\s+Trans\s+Date/i,
    /PREVIOUS\s+BALANCE/i,
    /SUB\s+TOTAL/i,
    /TOTAL\s+BALANCE\s+FOR/i,
    /End\s+of\s+Transaction\s+Details/i,
    /^\s*Page\s+\d+\s+of\s+\d+/i,
    /Credit\s+Card\(s\)\s+Statement/i,
    /^Summary$/i,
    /Card\s+Name\s+Card\s+Number/i,
    /Amount\s+to\s+Pay\s+SGD/i,
    /Minimum\s+Payment/i,
    /Due\s+Date/i,
    /Statement\s+Date/i,
    /Total\s+Credit\s+Limit/i,
];

const UOB_TX_LINE =
    /^(\d{2}\s+[A-Za-z]{3})\s{2,}(\d{2}\s+[A-Za-z]{3})\s{2,}(.+?)\s{2,}([\d,]+\.\d{2}(?:\s+CR)?)\s*$/i;
const UOB_CONTINUATION_PATTERN = /^Ref\s+No\.\s*:/i;

function parseUOB(text: string): ParseResult {
    const meta: PdfMeta = { bankInfo: null, cardholderName: null, dateRangeStart: null, dateRangeEnd: null };

    // Extract statement date: "Statement Date 06 JAN 2026"
    const STMT_DATE_PATTERN = /Statement\s+Date\s+(\d{2}\s+[A-Z]{3}\s+\d{4})/i;
    const stmtMatch = text.match(STMT_DATE_PATTERN);
    let periodEnd: Date | null = null;
    let periodStart: Date | null = null;
    if (stmtMatch) {
        periodEnd = parseDateWithYear(stmtMatch[1]);
        if (periodEnd) {
            meta.dateRangeEnd = dateToYYYYMMDD(periodEnd);
            periodStart = new Date(periodEnd.getTime() - 31 * 24 * 60 * 60 * 1000);
            meta.dateRangeStart = dateToYYYYMMDD(periodStart);
        }
    }

    // Extract card number and name on card
    const CARD_ROW_PATTERN = /UOB\s+ONE\s+CARD\s+([\d-]+)\s+([A-Z\s]+?)\s+[\d,.]+/i;
    const cardMatch = text.match(CARD_ROW_PATTERN);
    const lastFour = cardMatch?.[1].slice(-4) ?? 'XXXX';
    meta.bankInfo = `UOB One Card *${lastFour}`;

    // Extract cardholder name from address block: "MR TERENCE LIM JUN CHAI"
    const ADDR_NAME_PATTERN = /^(MR|MRS|MS|DR)\s+([A-Z\s]+)$/m;
    const addrMatch = text.match(ADDR_NAME_PATTERN);
    if (addrMatch) {
        meta.cardholderName = `${addrMatch[1]} ${addrMatch[2].trim()}`;
    } else {
        meta.cardholderName = cardMatch?.[2]?.trim() ?? null;
    }

    const start = periodStart ?? new Date(2000, 0, 1);
    const end = periodEnd ?? new Date(2099, 11, 31);
    const transactions: ParsedTransaction[] = [];

    for (const line of text.split('\n')) {
        try {
            const trimmed = line.trim();
            if (!trimmed) continue;
            if (UOB_SKIP_PATTERNS.some((p) => p.test(trimmed))) continue;
            if (UOB_CONTINUATION_PATTERN.test(trimmed)) continue;

            const match = trimmed.match(UOB_TX_LINE);
            if (!match) continue;

            const [, , transDate, description, amountRaw] = match;
            const resolved = resolveDDMonDate(transDate.trim(), start, end);
            if (!resolved) continue;

            transactions.push({
                transactionDate: dateToYYYYMMDD(resolved),
                description: description.trim(),
                amount: parseUOBAmount(amountRaw),
            });
        } catch {
            // skip malformed line
        }
    }

    return { transactions, meta };
}

// ─── Generic fallback parser ──────────────────────────────────────────────────

function parseGeneric(text: string): ParseResult {
    const meta: PdfMeta = { bankInfo: null, cardholderName: null, dateRangeStart: null, dateRangeEnd: null };
    const transactions: ParsedTransaction[] = [];
    const lines = text.split('\n');

    // Find header line containing "Date" and "Amount"; start parsing after it
    let startIndex = 0;
    for (let i = 0; i < lines.length; i++) {
        if (/date/i.test(lines[i]) && /amount/i.test(lines[i])) {
            startIndex = i + 1;
            break;
        }
    }

    const tryParseDate = (str: string): Date | null => {
        // DD/MM/YYYY
        let m = str.match(/(\d{2})\/(\d{2})\/(\d{4})/);
        if (m) return new Date(parseInt(m[3], 10), parseInt(m[2], 10) - 1, parseInt(m[1], 10));
        // DD-MM-YYYY
        m = str.match(/(\d{2})-(\d{2})-(\d{4})/);
        if (m) return new Date(parseInt(m[3], 10), parseInt(m[2], 10) - 1, parseInt(m[1], 10));
        // DD MMM YYYY
        m = str.match(/(\d{2})\s+([A-Za-z]{3})\s+(\d{4})/);
        if (m) {
            const month = MONTHS[m[2].toLowerCase()];
            if (month !== undefined) return new Date(parseInt(m[3], 10), month, parseInt(m[1], 10));
        }
        return null;
    };

    for (let i = startIndex; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        if (!trimmed) continue;

        try {
            const txDate = tryParseDate(trimmed);
            if (!txDate) continue;

            const amounts = [...trimmed.matchAll(/[\d,]+\.\d{2}/g)];
            if (amounts.length === 0) continue;

            const lastAmountMatch = amounts[amounts.length - 1];
            const lastAmountStr = lastAmountMatch[0];
            const amountIdx = trimmed.lastIndexOf(lastAmountStr);
            const afterAmount = trimmed.slice(amountIdx + lastAmountStr.length);
            const isCR = /CR/i.test(afterAmount);
            const abs = parseFloat(lastAmountStr.replace(/,/g, ''));
            const amount = isCR ? +abs : -abs;

            // Description: strip date patterns and amount from line
            const desc = trimmed
                .replace(/\d{2}[\/\-]\d{2}[\/\-]\d{4}/, '')
                .replace(/\d{2}\s+[A-Za-z]{3}\s+\d{4}/, '')
                .replace(/[\d,]+\.\d{2}\s*(CR|DR)?/gi, '')
                .trim();

            transactions.push({
                transactionDate: dateToYYYYMMDD(txDate),
                description: desc || trimmed,
                amount,
            });
        } catch {
            // skip malformed line
        }
    }

    return { transactions, meta };
}

// ─── PdfProcessor ─────────────────────────────────────────────────────────────

/**
 * PdfProcessor
 *
 * Uses pdf-parse to extract transaction rows from bank-statement PDFs.
 * Supports HSBC Visa Advance, UOB One Card, and a generic fallback.
 * After parse(), this.lastMeta contains bankInfo, cardholderName, and date range.
 */
export class PdfProcessor implements BaseProcessor {
    /** Populated after parse() — contains bank metadata extracted from the statement header. */
    lastMeta: PdfMeta | null = null;

    async parse(filePath: string): Promise<ParsedTransaction[]> {
        const buffer = await fs.promises.readFile(filePath);
        const data = await pdfParse(buffer);
        const text = data.text;

        const format = detectBankFormat(text);
        let result: ParseResult;

        switch (format) {
            case 'hsbc-visa-advance':
                result = parseHSBC(text);
                break;
            case 'uob-one-card':
                result = parseUOB(text);
                break;
            default:
                result = parseGeneric(text);
        }

        this.lastMeta = result.meta;
        return result.transactions;
    }
}
