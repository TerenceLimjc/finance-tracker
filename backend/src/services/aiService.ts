import type { ParsedTransaction } from '../processors/baseProcessor';

export interface CategorisedTransaction extends ParsedTransaction {
    categoryId: number | undefined;
    categoryConfidence: number | undefined;
}

// ─── Tier 1: Keyword / Rule Matching ─────────────────────────────────────────

const KEYWORD_RULES: Array<{ pattern: RegExp; categoryName: string }> = [
    { pattern: /grab|gojek|taxi|mrt|bus|ez.?link|parking/i, categoryName: 'Transport' },
    { pattern: /ntuc|fairprice|cold.?storage|giant|sheng.?siong|mcdonalds|kfc|starbucks|kopitiam|hawker/i, categoryName: 'Food & Dining' },
    { pattern: /netflix|spotify|disney|youtube|cinema|golden.?village/i, categoryName: 'Entertainment' },
    { pattern: /sp.?services|sp.?digital|singtel|starhub|m1|electricity|telco|broadband/i, categoryName: 'Utilities' },
    { pattern: /shopee|lazada|amazon|uniqlo|zara|guardian|watsons/i, categoryName: 'Shopping' },
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
    { pattern: /^GRAB/i, categoryName: 'Transport' },
    { pattern: /^SHEIN/i, categoryName: 'Shopping' },
    { pattern: /^NETFLIX/i, categoryName: 'Entertainment' },
    { pattern: /^SPOTIFY/i, categoryName: 'Entertainment' },
    { pattern: /^AMAZON/i, categoryName: 'Shopping' },
    { pattern: /^NTUC/i, categoryName: 'Groceries' },
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

// ─── Tier 2: OpenAI Batched Categorisation ───────────────────────────────────

const OPENAI_BATCH_SIZE = 50;

interface OpenAIResultItem {
    id: number;
    category: string;
    confidence: number;
}

async function categoriseWithOpenAI(
    items: Array<{ id: number; description: string; merchant?: string }>,
    categoryNames: string[],
): Promise<Map<number, { categoryName: string; confidence: number }>> {
    const results = new Map<number, { categoryName: string; confidence: number }>();

    if (!process.env.OPENAI_API_KEY) return results;

    // Lazy import to avoid errors when key is not set
    const { default: OpenAI } = await import('openai');
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';

    for (let i = 0; i < items.length; i += OPENAI_BATCH_SIZE) {
        const batch = items.slice(i, i + OPENAI_BATCH_SIZE);
        const prompt = `Classify each bank transaction into exactly one category.
Categories: ${categoryNames.join(', ')}

Transactions (JSON array):
${JSON.stringify(batch.map((t) => ({ id: t.id, description: t.description, merchant: t.merchant })))}

Respond with a JSON array: [{ "id": number, "category": string, "confidence": number }]`;

        try {
            const response = await client.chat.completions.create({
                model,
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: 'json_object' },
            });

            const raw = response.choices[0]?.message?.content ?? '{}';
            const parsed: unknown = JSON.parse(raw);

            // Accept both { items: [...] } wrapper and plain array
            const arr: unknown = Array.isArray(parsed)
                ? parsed
                : (parsed as Record<string, unknown>).items ??
                Object.values(parsed as Record<string, unknown>).find(Array.isArray);

            if (Array.isArray(arr)) {
                for (const item of arr as OpenAIResultItem[]) {
                    if (typeof item.id === 'number' && typeof item.category === 'string') {
                        results.set(item.id, {
                            categoryName: item.category,
                            confidence: typeof item.confidence === 'number' ? item.confidence : 0.85,
                        });
                    }
                }
            }
        } catch {
            // OpenAI call failed — leave this batch uncategorised
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
 *   2. OpenAI batched categorisation (runs when Tier 1 confidence < 0.7 and API key present)
 *   3. Embedding similarity (future — stub only, activated by ENABLE_EMBEDDINGS=true)
 */
export class AiService {
    async categorise(
        transactions: ParsedTransaction[],
        categories: Array<{ id: number; name: string }>,
    ): Promise<CategorisedTransaction[]> {
        // Assign a temporary numeric index so we can correlate OpenAI responses
        const indexed = transactions.map((t, idx) => ({ t, idx }));

        // ── Tier 1 ────────────────────────────────────────────────────────────
        const results: CategorisedTransaction[] = indexed.map(({ t }) => ({
            ...t,
            categoryId: undefined,
            categoryConfidence: undefined,
        }));

        const lowConfidenceItems: Array<{ id: number; description: string; merchant?: string }> = [];

        for (const { t, idx } of indexed) {
            const searchText = [t.merchant, t.description].filter(Boolean).join(' ');
            const { categoryName, confidence } = matchTier1(searchText);

            if (categoryName && confidence >= 0.7) {
                results[idx].categoryId = resolveCategoryId(categoryName, categories);
                results[idx].categoryConfidence = confidence;
            } else {
                // Queue for Tier 2
                lowConfidenceItems.push({ id: idx, description: t.description, merchant: t.merchant });
            }
        }

        // ── Tier 2 ────────────────────────────────────────────────────────────
        if (lowConfidenceItems.length > 0 && process.env.OPENAI_API_KEY) {
            const categoryNames = categories.map((c) => c.name);
            const openAIResults = await categoriseWithOpenAI(lowConfidenceItems, categoryNames);

            for (const [idx, { categoryName, confidence }] of openAIResults) {
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

        return results;
    }
}

