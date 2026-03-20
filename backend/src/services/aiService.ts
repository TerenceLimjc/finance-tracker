import type { ParsedTransaction } from '../processors/baseProcessor';

export interface CategorisedTransaction extends ParsedTransaction {
    categoryId: number | undefined;
    categoryConfidence: number | undefined;
}

export interface FeedbackRule {
    merchant: string | null;
    description: string;
    categoryId: number;
    categoryName: string;
}

// ─── Tier 1: Keyword / Rule Matching ─────────────────────────────────────────

const KEYWORD_RULES: Array<{ pattern: RegExp; categoryName: string }> = [
    { pattern: /grab|gojek|taxi|mrt|bus|ez.?link|parking/i, categoryName: 'Transport' },
    { pattern: /ntuc|fairprice|cold.?storage|giant|sheng.?siong|mcdonalds|kfc|starbucks|kopitiam|hawker/i, categoryName: 'Food & Dining' },
    { pattern: /netflix|spotify|disney|youtube|cinema|golden.?village/i, categoryName: 'Entertainment' },
    { pattern: /sp.?services|sp.?digital|singtel|starhub|m1|electricity|telco|broadband/i, categoryName: 'Utilities' },
    { pattern: /shopee|lazada|uniqlo|zara|guardian|watsons/i, categoryName: 'Shopping' },
    { pattern: /clinic|pharmacy|hospital|dental/i, categoryName: 'Health' },
    { pattern: /singapore.?airlines|scoot|jetstar|airbnb|hotel|booking\.com/i, categoryName: 'Travel' },
    { pattern: /cashback|rebate|refund|reimburs/i, categoryName: 'Income' },
];

// Bank-specific seeds — exact-brand patterns (anchored at start → higher confidence)
const HSBC_KEYWORD_SEEDS: Array<{ pattern: RegExp; categoryName: string }> = [
    { pattern: /^FAIRPRICE/i, categoryName: 'Groceries' },
    { pattern: /^BUS\/MRT/i, categoryName: 'Transport' },
    { pattern: /^PARKING\.SG/i, categoryName: 'Transport' },
    { pattern: /^MCDONALD/i, categoryName: 'Food & Dining' },
    { pattern: /^PRATUNAM/i, categoryName: 'Food & Dining' },
    { pattern: /^HAWKER/i, categoryName: 'Food & Dining' },
    { pattern: /^GRAB/i, categoryName: 'Transport' },
    { pattern: /^SHEIN/i, categoryName: 'Shopping' },
    { pattern: /^NETFLIX/i, categoryName: 'Entertainment' },
    { pattern: /^SPOTIFY/i, categoryName: 'Entertainment' },
    { pattern: /^NTUC/i, categoryName: 'Groceries' },
    { pattern: /^UrbanCompany/i, categoryName: 'Utilities' },
    { pattern: /^GOMO/i, categoryName: 'Utilities' },
    { pattern: /^SIMBA/i, categoryName: 'Utilities' },
];

const UOB_KEYWORD_SEEDS: Array<{ pattern: RegExp; categoryName: string }> = [
    { pattern: /^SHOPEE/i, categoryName: 'Shopping' },
    { pattern: /^GRAB\*/i, categoryName: 'Transport' },
    { pattern: /^Grab\s+Subscription/i, categoryName: 'Entertainment' },
    { pattern: /^ESSO/i, categoryName: 'Transport' },
    { pattern: /^SP\s+Digital/i, categoryName: 'Utilities' },
    { pattern: /^UOB\s+ONE\s+CASH/i, categoryName: 'Income' },
    { pattern: /^ONE\s+CARD.*REBATE/i, categoryName: 'Income' },
    { pattern: /^OTHR/i, categoryName: 'Other' },
];

interface Tier1Result {
    categoryName: string | undefined;
    confidence: number;
}

function matchTier1(text: string): Tier1Result {
    // Exact-brand (anchored) seeds first — higher confidence
    for (const rule of [...HSBC_KEYWORD_SEEDS, ...UOB_KEYWORD_SEEDS]) {
        if (rule.pattern.test(text)) {
            return { categoryName: rule.categoryName, confidence: 0.95 };
        }
    }
    // General keyword rules
    for (const rule of KEYWORD_RULES) {
        if (rule.pattern.test(text)) {
            return { categoryName: rule.categoryName, confidence: 0.80 };
        }
    }
    return { categoryName: undefined, confidence: 0 };
}

function resolveCategoryId(
    categoryName: string,
    categories: Array<{ id: number; name: string }>,
): number | undefined {
    const lower = categoryName.toLowerCase();
    return categories.find((c) => c.name.toLowerCase() === lower)?.id;
}

// ─── Tier 2: LLM Batched Categorisation ─────────────────────────────────────
// Supports local LLMs (Ollama, LM Studio, llama.cpp) and OpenAI via the same
// openai npm package — local servers expose an OpenAI-compatible /v1 endpoint.
//
// Precedence:
//   LOCAL_LLM_BASE_URL set  → use local LLM (Ollama / LM Studio / llama.cpp)
//   OPENAI_API_KEY set      → use OpenAI
//   Neither set             → skip Tier 2
//
// Recommended local models (via Ollama):
//   qwen2.5:3b   — default; fast, excellent JSON, low memory (~2GB)
//   qwen2.5:1.5b — minimal resource use (~1GB), sufficient for short descriptions
//   phi3.5:latest — balanced quality/speed (~2.2GB)
//   llama3.2:3b  — good general purpose (~2GB)

const LLM_BATCH_SIZE = 50;
const LOCAL_LLM_BATCH_SIZE = 20; // Smaller batches improve JSON reliability for local models

interface LLMResultItem {
    id: number;
    category: string;
    confidence: number;
}

/**
 * Robustly extract a results array from raw LLM output.
 * Handles: plain arrays, object wrappers ({ results/items/... }), markdown fences.
 */
function extractLLMArray(raw: string): LLMResultItem[] {
    // Strip markdown code fences (``` or ```json)
    const stripped = raw
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```\s*$/, '')
        .trim();

    let parsed: unknown;
    try {
        parsed = JSON.parse(stripped);
    } catch {
        // Fallback: find the first JSON array embedded in the string
        const match = stripped.match(/\[[\s\S]*\]/);
        if (!match) return [];
        try {
            parsed = JSON.parse(match[0]);
        } catch {
            return [];
        }
    }

    if (Array.isArray(parsed)) return parsed as LLMResultItem[];

    if (parsed !== null && typeof parsed === 'object') {
        // Accept any wrapper object: { "results": [...] }, { "items": [...] }, etc.
        const arr = Object.values(parsed as Record<string, unknown>).find(Array.isArray);
        if (arr) return arr as LLMResultItem[];
    }

    return [];
}

/**
 * Match a transaction against feedback rules.
 * Merchant takes priority (more specific); falls back to description.
 */
function matchFeedback(
    merchant: string | undefined,
    description: string,
    feedback: FeedbackRule[],
): FeedbackRule | undefined {
    if (merchant) {
        const byMerchant = feedback.find(
            (f) => f.merchant !== null && f.merchant.toLowerCase() === merchant.toLowerCase(),
        );
        if (byMerchant) return byMerchant;
    }
    return feedback.find((f) => f.description.toLowerCase() === description.toLowerCase());
}

async function categoriseWithLLM(
    items: Array<{ id: number; description: string; merchant?: string }>,
    categoryNames: string[],
    feedbackExamples: FeedbackRule[],
): Promise<Map<number, { categoryName: string; confidence: number }>> {
    const results = new Map<number, { categoryName: string; confidence: number }>();

    const localBaseUrl = process.env.LOCAL_LLM_BASE_URL;
    const isLocal = Boolean(localBaseUrl);

    // Lazy import — avoids load-time errors when neither key is configured
    const { default: OpenAI } = await import('openai');

    const client = isLocal
        ? new OpenAI({
            baseURL: localBaseUrl,
            apiKey: process.env.LOCAL_LLM_API_KEY ?? 'local', // local servers don't validate this
        })
        : new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const model = isLocal
        ? (process.env.LOCAL_LLM_MODEL ?? 'qwen2.5:3b')
        : (process.env.OPENAI_MODEL ?? 'gpt-4o-mini');

    const batchSize = isLocal ? LOCAL_LLM_BATCH_SIZE : LLM_BATCH_SIZE;

    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const examplesBlock = feedbackExamples.length > 0
            ? `\nExamples from previous corrections (use as guidance):\n` +
            feedbackExamples.slice(0, 20).map(
                (e) => `  - "${e.merchant ?? e.description}" → ${e.categoryName}`,
            ).join('\n') + '\n'
            : '';

        const userContent =
            `Classify each bank transaction into exactly one of these categories: ${categoryNames.join(', ')}\n` +
            examplesBlock +
            `\nTransactions:\n${JSON.stringify(batch.map((t) => ({ id: t.id, description: t.description, merchant: t.merchant })))}\n\n` +
            `Respond with a JSON object: {"results": [{"id": <number>, "category": <string>, "confidence": <number>}]}`;

        try {
            const response = await client.chat.completions.create({
                model,
                messages: [
                    { role: 'system', content: 'You are a financial transaction classifier. Always respond with valid JSON only.' },
                    { role: 'user', content: userContent },
                ],
                response_format: { type: 'json_object' },
            });

            const raw = response.choices[0]?.message?.content ?? '{}';
            const arr = extractLLMArray(raw);

            for (const item of arr) {
                if (typeof item.id === 'number' && typeof item.category === 'string') {
                    results.set(item.id, {
                        categoryName: item.category,
                        confidence: typeof item.confidence === 'number' ? item.confidence : 0.75,
                    });
                }
            }
        } catch {
            // LLM call failed for this batch — leave uncategorised
        }
    }

    return results;
}

// ─── AiService ────────────────────────────────────────────────────────────────

/**
 * AiService
 *
 * Three-tier categorisation:
 *   1. Keyword / rule matching (always runs)
 *   2. LLM batched categorisation (local via LOCAL_LLM_BASE_URL, or OpenAI via OPENAI_API_KEY)
 *   3. Embedding similarity (future — stub only, activated by ENABLE_EMBEDDINGS=true)
 */
export class AiService {
    async categorise(
        transactions: ParsedTransaction[],
        categories: Array<{ id: number; name: string }>,
        feedback: FeedbackRule[] = [],
    ): Promise<CategorisedTransaction[]> {
        // Assign a temporary numeric index so we can correlate LLM responses
        const indexed = transactions.map((t, idx) => ({ t, idx }));

        const results: CategorisedTransaction[] = indexed.map(({ t }) => ({
            ...t,
            categoryId: undefined,
            categoryConfidence: undefined,
        }));

        // ── Tier 0: Keyword / rule matching ───────────────────────────────────
        // Runs first — fast, deterministic regex rules.
        const tier0Unmatched: Array<{ t: ParsedTransaction; idx: number }> = [];

        for (const { t, idx } of indexed) {
            const searchText = [t.merchant, t.description].filter(Boolean).join(' ');
            const { categoryName, confidence } = matchTier1(searchText);

            if (categoryName && confidence >= 0.7) {
                results[idx].categoryId = resolveCategoryId(categoryName, categories);
                results[idx].categoryConfidence = confidence;
            } else {
                tier0Unmatched.push({ t, idx });
            }
        }

        // ── Tier 1: Learned rules (user corrections) ─────────────────────────
        // Runs second on Tier 0 misses — exact merchant or description match (confidence 1.0).
        const lowConfidenceItems: Array<{ id: number; description: string; merchant?: string }> = [];

        for (const { t, idx } of tier0Unmatched) {
            if (feedback.length > 0) {
                const rule = matchFeedback(t.merchant, t.description, feedback);
                if (rule) {
                    results[idx].categoryId = rule.categoryId;
                    results[idx].categoryConfidence = 1.0;
                    continue;
                }
            }
            // Queue for Tier 2
            lowConfidenceItems.push({ id: idx, description: t.description, merchant: t.merchant });
        }

        // ── Tier 2 ────────────────────────────────────────────────────────────
        const tier2Enabled =
            lowConfidenceItems.length > 0 &&
            Boolean(process.env.LOCAL_LLM_BASE_URL || process.env.OPENAI_API_KEY);

        if (tier2Enabled) {
            const categoryNames = categories.map((c) => c.name);
            const llmResults = await categoriseWithLLM(lowConfidenceItems, categoryNames, feedback);

            for (const [idx, { categoryName, confidence }] of llmResults) {
                results[idx].categoryId = resolveCategoryId(categoryName, categories);
                results[idx].categoryConfidence = confidence;
            }
        }

        // ── Tier 3 ────────────────────────────────────────────────────────────
        if (process.env.ENABLE_EMBEDDINGS === 'true') {
            // TODO: implement embedding similarity
            // Store OpenAI text-embedding-3-small vectors in transaction_embeddings table.
            // For new transactions: embed description → find K nearest neighbours
            // → assign same category as majority of neighbours.
        }

        // ── Fallback: assign "Other" to anything still uncategorised ──────────
        const otherId = resolveCategoryId('Other', categories);
        for (const result of results) {
            if (result.categoryId === undefined) {
                result.categoryId = otherId;
                result.categoryConfidence = 0.5;
            }
        }

        return results;
    }
}

