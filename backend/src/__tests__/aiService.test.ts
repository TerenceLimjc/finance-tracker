import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { ParsedTransaction } from '../processors/baseProcessor';

// Mock openai to prevent real API calls even when a key is accidentally set
vi.mock('openai', () => ({
    default: vi.fn().mockImplementation(() => ({
        chat: {
            completions: {
                create: vi.fn().mockResolvedValue({
                    choices: [{ message: { content: '{"items":[]}' } }],
                }),
            },
        },
    })),
}));

import { AiService } from '../services/aiService';

// ── Test fixtures ─────────────────────────────────────────────────────────────

const DEFAULT_CATEGORIES = [
    { id: 1, name: 'Food & Dining' },
    { id: 2, name: 'Transport' },
    { id: 3, name: 'Entertainment' },
    { id: 4, name: 'Utilities' },
    { id: 5, name: 'Shopping' },
    { id: 6, name: 'Health' },
    { id: 7, name: 'Travel' },
    { id: 8, name: 'Income' },
    { id: 9, name: 'Other' },
    { id: 10, name: 'Groceries' },
];

function makeTx(overrides: Partial<ParsedTransaction> = {}): ParsedTransaction {
    return {
        transactionDate: '2025-12-08',
        amount: -10,
        description: 'TEST',
        ...overrides,
    };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AiService', () => {
    let svc: AiService;

    beforeEach(() => {
        svc = new AiService();
        // Remove any leaked API key so Tier 2 (OpenAI) is not invoked
        delete process.env.OPENAI_API_KEY;
    });

    // ── Tier 1: keyword / rule matching ───────────────────────────────────────

    describe('Tier 1 — keyword matching', () => {
        it('1. GRAB* RIDE → Transport, confidence >= 0.80', async () => {
            const results = await svc.categorise(
                [makeTx({ description: 'GRAB* RIDE' })],
                DEFAULT_CATEGORIES,
            );
            const transportId = DEFAULT_CATEGORIES.find((c) => c.name === 'Transport')!.id;
            expect(results[0].categoryId).toBe(transportId);
            expect(results[0].categoryConfidence).toBeGreaterThanOrEqual(0.80);
        });

        it('2. NETFLIX.COM → Entertainment, confidence >= 0.95 (exact brand seed)', async () => {
            const results = await svc.categorise(
                [makeTx({ description: 'NETFLIX.COM' })],
                DEFAULT_CATEGORIES,
            );
            const entertainmentId = DEFAULT_CATEGORIES.find((c) => c.name === 'Entertainment')!.id;
            expect(results[0].categoryId).toBe(entertainmentId);
            expect(results[0].categoryConfidence).toBeGreaterThanOrEqual(0.95);
        });

        it('3. UNKNOWN VENDOR 1234 → categoryId undefined (no match)', async () => {
            const results = await svc.categorise(
                [makeTx({ description: 'UNKNOWN VENDOR 1234' })],
                DEFAULT_CATEGORIES,
            );
            expect(results[0].categoryId).toBeUndefined();
        });

        it('4. merchant "NTUC FAIRPRICE" → Groceries or Food & Dining', async () => {
            const results = await svc.categorise(
                [makeTx({ merchant: 'NTUC FAIRPRICE', description: 'PURCHASE' })],
                DEFAULT_CATEGORIES,
            );
            const allowedIds = DEFAULT_CATEGORIES
                .filter((c) => ['Groceries', 'Food & Dining'].includes(c.name))
                .map((c) => c.id);
            expect(allowedIds).toContain(results[0].categoryId);
        });
    });

    // ── OpenAI behaviour ──────────────────────────────────────────────────────

    describe('OpenAI integration', () => {
        it('5. no OPENAI_API_KEY → returns Tier-1 results only, no errors thrown', async () => {
            delete process.env.OPENAI_API_KEY;
            const txs = [
                makeTx({ description: 'UNKNOWN VENDOR A' }),
                makeTx({ description: 'UNKNOWN VENDOR B' }),
            ];
            // Should resolve (not throw) for both transactions
            await expect(svc.categorise(txs, DEFAULT_CATEGORIES)).resolves.toHaveLength(2);
        });
    });

    // ── Array contract ────────────────────────────────────────────────────────

    describe('Array contract', () => {
        it('6. input 3 transactions → output array length === 3', async () => {
            const txs = [
                makeTx({ description: 'GRAB* RIDE' }),
                makeTx({ description: 'UNKNOWN VENDOR X' }),
                makeTx({ description: 'NETFLIX.COM' }),
            ];
            const results = await svc.categorise(txs, DEFAULT_CATEGORIES);
            expect(results).toHaveLength(3);
        });

        it('7. categoryId resolves to the correct id from the provided categories array', async () => {
            const customCategories = [
                { id: 42, name: 'Transport' },
                { id: 99, name: 'Entertainment' },
            ];
            const results = await svc.categorise(
                [makeTx({ description: 'GRAB* RIDE' })],
                customCategories,
            );
            // GRAB* RIDE → Transport → id 42 from customCategories
            expect(results[0].categoryId).toBe(42);
        });
    });
});
