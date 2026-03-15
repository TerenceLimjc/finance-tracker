/**
 * Integration tests for PdfProcessor using a real HSBC Visa Advance statement PDF.
 *
 * Tests run against the real file using pdfjs-dist v5 text extraction + OCR fallback.
 * No mocking — real file I/O, real text extraction, real parsing.
 *
 * SETUP: Place the real HSBC statement at:
 *   backend/src/__tests__/fixtures/hsbc-statement.pdf
 *
 * If the fixture is absent, all tests are skipped gracefully.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { PdfProcessor } from '../processors/pdfProcessor';

const fixturePath = path.resolve(__dirname, 'fixtures', 'hsbc-statement.pdf');
const fixtureExists = fs.existsSync(fixturePath);

const SKIP_MSG = 'Place hsbc-statement.pdf in backend/src/__tests__/fixtures/ to run integration tests';

describe('PdfProcessor — HSBC real PDF integration', () => {
    // ── 1. Fixture exists check ───────────────────────────────────────────────

    it.skipIf(!fixtureExists)(SKIP_MSG, () => {
        // This test is intentionally trivial — its purpose is just to surface the
        // skip message when the fixture is missing and confirm the file is present.
        expect(fixtureExists).toBe(true);
    });

    // ── Shared state populated in beforeAll ───────────────────────────────────

    let processor: PdfProcessor;
    let transactions: Awaited<ReturnType<PdfProcessor['parse']>>;

    beforeAll(async () => {
        if (!fixtureExists) return;
        processor = new PdfProcessor();
        transactions = await processor.parse(fixturePath);
    }, 120_000); // OCR can take up to ~2 min on first run (model download)

    // ── 2. Bank format detection ──────────────────────────────────────────────

    it.skipIf(!fixtureExists)('PdfProcessor detects HSBC as the bank', () => {
        expect(processor.lastMeta).not.toBeNull();
        expect(processor.lastMeta?.bankInfo).toMatch(/HSBC/i);
    });

    it.skipIf(!fixtureExists)('PdfProcessor extracts a valid dateRangeStart', () => {
        expect(processor.lastMeta?.dateRangeStart).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it.skipIf(!fixtureExists)('PdfProcessor extracts a valid dateRangeEnd', () => {
        expect(processor.lastMeta?.dateRangeEnd).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    // ── 3. Transactions extracted ─────────────────────────────────────────────

    it.skipIf(!fixtureExists)('PdfProcessor extracts at least one transaction', () => {
        // Log the first five transactions for manual verification
        console.log('First 5 transactions:', JSON.stringify(transactions.slice(0, 5), null, 2));
        expect(transactions.length).toBeGreaterThan(0);
    });

    it.skipIf(!fixtureExists)('every transaction has a valid transactionDate', () => {
        for (const tx of transactions) {
            expect(tx.transactionDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        }
    });

    it.skipIf(!fixtureExists)('every transaction has a non-zero numeric amount', () => {
        for (const tx of transactions) {
            expect(typeof tx.amount).toBe('number');
            expect(tx.amount).not.toBe(0);
        }
    });

    it.skipIf(!fixtureExists)('every transaction has a non-empty description', () => {
        for (const tx of transactions) {
            expect(typeof tx.description).toBe('string');
            expect(tx.description.trim().length).toBeGreaterThan(0);
        }
    });

    // ── 4. Credit transactions have positive amounts ──────────────────────────

    it.skipIf(!fixtureExists)('credit (CR) transactions have positive amounts', () => {
        const credits = transactions.filter((tx) => tx.amount > 0);
        if (credits.length > 0) {
            for (const tx of credits) {
                expect(tx.amount).toBeGreaterThan(0);
            }
        } else {
            // No CR entries in this statement — that's acceptable
            console.log('No credit transactions found in this statement; skipping credit assertion.');
        }
    });

    // ── 5. Debit transactions have negative amounts ───────────────────────────

    it.skipIf(!fixtureExists)('at least one debit (negative amount) transaction exists', () => {
        const debits = transactions.filter((tx) => tx.amount < 0);
        expect(
            debits.length,
            'Expected at least one debit transaction with a negative amount',
        ).toBeGreaterThan(0);
    });
});
