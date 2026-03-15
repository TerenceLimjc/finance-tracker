import { describe, it, expect, beforeEach, vi } from 'vitest';

// ── Hoist mocks so they're available inside vi.mock factories ─────────────────
const mockReadFile = vi.hoisted(() => vi.fn().mockResolvedValue(Buffer.from('')));
const mockPdfParse = vi.hoisted(() => vi.fn());

// Mock the Node `fs` module — `import fs from 'fs'` will receive the `default`
// property of this factory result.
vi.mock('fs', () => ({
    default: {
        promises: {
            readFile: mockReadFile,
        },
    },
}));

// Mock pdf-parse so no real binary parsing happens
vi.mock('pdf-parse', () => ({
    default: mockPdfParse,
}));

import { PdfProcessor } from '../processors/pdfProcessor';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Builds minimal synthetic HSBC statement text. */
function hsbcText(...txLines: string[]): string {
    return [
        'HSBC VISA ADVANCE',
        'From 06 DEC 2025 to 05 JAN 2026',
        ...txLines,
    ].join('\n');
}

/** Builds minimal synthetic UOB statement text. */
function uobText(...txLines: string[]): string {
    return [
        'UOB ONE CARD',
        'Statement Date 19 DEC 2025',
        ...txLines,
    ].join('\n');
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PdfProcessor', () => {
    let processor: PdfProcessor;

    beforeEach(() => {
        processor = new PdfProcessor();
        mockReadFile.mockResolvedValue(Buffer.from(''));
        mockPdfParse.mockReset();
    });

    /** Convenience: configure mock to return `text` then call parse(). */
    async function parse(text: string) {
        mockPdfParse.mockResolvedValueOnce({ text });
        return processor.parse('/fake/statement.pdf');
    }

    // ── HSBC Visa Advance ─────────────────────────────────────────────────────

    describe('HSBC Visa Advance', () => {
        it('1. text containing "HSBC VISA ADVANCE" → bankInfo includes "HSBC"', async () => {
            await parse(hsbcText());
            expect(processor.lastMeta?.bankInfo).toContain('HSBC');
        });

        it('2. debit transaction line → amount -11.95, description preserved', async () => {
            // Format: "POST_DATE  TRAN_DATE  DESCRIPTION  AMOUNT[CR]"
            const txs = await parse(hsbcText(
                "08 Dec  06 Dec  MCDONALD'S (PGS)         11.95",
            ));
            expect(txs).toHaveLength(1);
            expect(txs[0].amount).toBe(-11.95);
            expect(txs[0].description).toBe("MCDONALD'S (PGS)");
        });

        it('3. CR suffix → amount is positive', async () => {
            const txs = await parse(hsbcText(
                '12 Jan  10 Jan  REFUND MERCHANT          131.29CR',
            ));
            expect(txs).toHaveLength(1);
            expect(txs[0].amount).toBe(131.29);
        });

        it('4. cross-year statement — "06 Jan" tran date resolves to 2026-01-06', async () => {
            // Period: 06 DEC 2025 to 05 JAN 2026
            // "06 Jan" in start-year (2025) = 2025-01-06, outside period → use end-year 2026
            const txs = await parse(hsbcText(
                '12 Jan  06 Jan  YEAR CROSSTEST           50.00',
            ));
            expect(txs).toHaveLength(1);
            expect(txs[0].transactionDate).toBe('2026-01-06');
        });

        it('5. skip-pattern lines ("HSBC VISA ADVANCE", "POST DATE  TRAN DATE") produce 0 transactions', async () => {
            const txs = await parse(
                ['HSBC VISA ADVANCE', 'POST DATE  TRAN DATE'].join('\n'),
            );
            expect(txs).toHaveLength(0);
        });

        it('11. lastMeta.bankInfo is not null after parsing', async () => {
            await parse(hsbcText(
                "08 Dec  06 Dec  MCDONALD'S (PGS)         11.95",
            ));
            expect(processor.lastMeta).not.toBeNull();
            expect(processor.lastMeta!.bankInfo).not.toBeNull();
        });
    });

    // ── UOB One Card ──────────────────────────────────────────────────────────

    describe('UOB One Card', () => {
        it('6. text containing "UOB ONE CARD" → routes to UOB parser (bankInfo includes "UOB")', async () => {
            await parse(uobText());
            expect(processor.lastMeta?.bankInfo).toContain('UOB');
        });

        it('7. debit transaction → amount -188.86', async () => {
            const txs = await parse(uobText(
                '09 DEC  06 DEC  SHOPEE SINGAPORE         188.86',
            ));
            expect(txs).toHaveLength(1);
            expect(txs[0].amount).toBe(-188.86);
            expect(txs[0].description).toBe('SHOPEE SINGAPORE');
        });

        it('8. " CR" suffix → amount +1137.63', async () => {
            const txs = await parse(uobText(
                '19 DEC  19 DEC  CASHBACK                 1,137.63 CR',
            ));
            expect(txs).toHaveLength(1);
            expect(txs[0].amount).toBe(1137.63);
        });
    });

    // ── Generic fallback ──────────────────────────────────────────────────────

    describe('Generic fallback', () => {
        it('9. DD/MM/YYYY date format, no bank markers → 1 transaction parsed', async () => {
            const text = ['Date  Amount', '15/03/2026  Some Merchant  50.00'].join('\n');
            const txs = await parse(text);
            expect(txs.length).toBeGreaterThanOrEqual(1);
            expect(txs[0].amount).toBe(-50.00);
            expect(txs[0].description).toContain('Some Merchant');
        });
    });

    // ── Edge cases ────────────────────────────────────────────────────────────

    describe('Edge cases', () => {
        it('10. blank PDF text → returns empty array without throwing', async () => {
            const txs = await parse('');
            expect(txs).toEqual([]);
        });
    });
});
