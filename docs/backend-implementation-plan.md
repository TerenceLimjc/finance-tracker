# Backend Implementation Plan

**Project**: Personal Finance Tracker  
**Version**: 1.0  
**Date**: March 15, 2026  
**Status**: Ready for Implementation  
**Derived from**: Frontend service contracts + `docs/system-architecture.md`

---

## Overview

This document defines the complete backend implementation plan derived directly from the frontend's API contracts. Every endpoint, request shape, and response shape is dictated by what the frontend already calls — no guesswork.

The work is split between two engineers:

| Engineer | Responsibility |
|---|---|
| **Implementation Engineer (IE)** | Data plumbing — routes, database, file I/O, CSV/Excel parsing |
| **ML Engineer (ML)** | Intelligence layer — AI categorisation, PDF parsing, column heuristics, duplicate detection logic |

---

## API Contract (Frontend-Derived)

These are the exact endpoints the frontend calls, in priority order:

| # | Method | Endpoint | Frontend caller | Query / Body |
|---|--------|----------|----------------|--------------|
| 1 | `GET` | `/api/categories` | `TransactionTable` dropdown | — |
| 2 | `GET` | `/api/transactions` | `TransactionTable` | `month, categoryId?, searchText?, sortField, sortOrder, page, pageSize` |
| 3 | `PUT` | `/api/transactions/:id` | Inline category edit | `{ categoryId: number }` |
| 4 | `GET` | `/api/analytics/spending` | `DashboardPage` summary + pie chart | `?month=YYYY-MM` |
| 5 | `POST` | `/api/uploads` | `UploadZone` | multipart/form-data `file` |
| 6 | `GET` | `/api/uploads` | `UploadHistory` (polled every 5 s) | `?page, pageSize` |
| 7 | `DELETE` | `/api/uploads/:id` | `UploadHistory` delete button | — |

### Response Shape Reference

All shapes are defined in `frontend/src/types/`. The backend **must** match these exactly, including camelCase field names.

```typescript
// GET /api/categories → Category[]
interface Category {
    id: number;
    name: string;
    parentId: number | null;   // snake_case in DB → camelCase in response
    color: string;
    icon: string | null;
    isCustom: boolean;
}

// GET /api/transactions → TransactionPage
interface TransactionPage {
    data: Transaction[];
    total: number;
    page: number;
    pageSize: number;
}

interface Transaction {
    id: number;
    uploadId: number;
    transactionDate: string;       // YYYY-MM-DD
    amount: number;                // negative = expense
    description: string;
    merchant: string | null;
    categoryId: number | null;
    categoryName: string | null;   // JOINed from categories table
    categoryConfidence: number | null;
    userNotes: string | null;
}

// GET /api/analytics/spending → MonthlySummary
interface MonthlySummary {
    month: string;                 // YYYY-MM
    totalSpend: number;            // sum of abs(amount) for expenses
    transactionCount: number;
    changeAmount: number;          // vs prior month (signed)
    changePercent: number;         // signed percentage
    categories: CategorySpending[];
}

interface CategorySpending {
    categoryId: number;
    categoryName: string;
    total: number;
    percentage: number;
    transactionCount: number;
}

// GET /api/uploads → UploadHistoryPage
interface UploadHistoryPage {
    data: Upload[];
    total: number;
}

interface Upload {
    id: number;
    filename: string;
    originalFilename: string;
    fileSize: number;
    fileType: string;
    uploadDate: string;            // ISO datetime
    processingStatus: 'pending' | 'processing' | 'done' | 'failed';
    transactionCount: number;
    dateRangeStart: string | null;
    dateRangeEnd: string | null;
    bankInfo: string | null;
    cardholderName: string | null;     // extracted from PDF header e.g. "LIM JUN CHAI TERENCE"
    isDuplicate: boolean;          // date-range overlap with existing upload
    errorMessage: string | null;
}
```

---

## Implementation Engineer Tasks

### IE-1 · Database Bootstrap
**Files:** `backend/src/database/connection.ts`, `backend/src/database/migrations/001_initial.ts`  
**Depends on:** nothing  
**Blocks:** all other tasks

**Tasks:**
- Initialise `better-sqlite3` connection with WAL mode enabled (`PRAGMA journal_mode=WAL`)
- Export a singleton `getDb()` function used by all services
- Call `runMigrations()` at server startup (before routes register)
- Schema is already fully defined in `001_initial.ts` — wire it up

```typescript
// connection.ts — target interface
import Database from 'better-sqlite3';

let db: Database.Database;

export function getDb(): Database.Database {
    if (!db) {
        db = new Database(process.env.DB_PATH ?? './database/finance.db');
        db.pragma('journal_mode = WAL');
        db.pragma('foreign_keys = ON');
    }
    return db;
}
```

**server.ts change needed:**
```typescript
import { runMigrations } from './database/migrations/001_initial';
// In bootstrap(), before registering routes:
runMigrations();
```

---

### IE-2 · Categories Route
**Files:** `backend/src/routes/categories.ts`  
**Depends on:** IE-1  
**Blocks:** frontend category dropdown in `TransactionTable`

Simplest route — no pagination, no filtering. Seed data already inserted by migration.

```
GET /api/categories
→ SELECT id, name, parent_id, color, icon, is_custom FROM categories ORDER BY name ASC
→ Map snake_case → camelCase
→ Return Category[]
```

**SQL:**
```sql
SELECT id, name, parent_id AS parentId, color, icon,
       CASE is_custom WHEN 1 THEN 1 ELSE 0 END AS isCustom
FROM categories
ORDER BY name ASC
```

---

### IE-3 · Transactions Route
**Files:** `backend/src/routes/transactions.ts`, `backend/src/services/transactionService.ts`  
**Depends on:** IE-1  
**Blocks:** `TransactionTable` (dashboard cannot show data without this)

#### `GET /api/transactions`

Query params (all optional except `month`, `page`, `pageSize`):

| Param | Type | Default |
|---|---|---|
| `month` | `YYYY-MM` | current month |
| `categoryId` | number | — |
| `searchText` | string | — |
| `sortField` | `transactionDate \| amount` | `transactionDate` |
| `sortOrder` | `asc \| desc` | `desc` |
| `page` | number | `1` |
| `pageSize` | number | `25` |

**SQL pattern:**
```sql
SELECT
    t.id, t.upload_id AS uploadId,
    t.transaction_date AS transactionDate,
    t.amount, t.description, t.merchant,
    t.category_id AS categoryId,
    c.name AS categoryName,
    t.category_confidence AS categoryConfidence,
    t.user_notes AS userNotes
FROM transactions t
LEFT JOIN categories c ON c.id = t.category_id
WHERE t.transaction_date LIKE '2026-03-%'   -- month filter
  AND t.category_id = ?                      -- if categoryId provided
  AND (t.description LIKE ? OR t.merchant LIKE ?)  -- if searchText provided
ORDER BY t.transaction_date DESC             -- dynamic sortField + sortOrder
LIMIT 25 OFFSET 0                           -- pagination
```

Run the same WHERE clause with `COUNT(*)` for the `total` field.

**Response:**
```json
{
  "data": [...],
  "total": 47,
  "page": 1,
  "pageSize": 25
}
```

#### `PUT /api/transactions/:id`

Body: `{ categoryId: number }`

```sql
UPDATE transactions
SET category_id = ?, category_confidence = 1.0
WHERE id = ?
```

Return `204 No Content` on success.

---

### IE-4 · Analytics Route
**Files:** `backend/src/routes/analytics.ts`  
**Depends on:** IE-1  
**Blocks:** Dashboard summary cards + pie chart

Pure SQL aggregation — no ML needed.

#### `GET /api/analytics/spending?month=YYYY-MM`

**Step 1 — Current month totals:**
```sql
SELECT
    COUNT(*) AS transactionCount,
    SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) AS totalSpend
FROM transactions
WHERE transaction_date LIKE '2026-03-%'
```

**Step 2 — Prior month totals** (for MoM change):
```sql
-- Same query with month - 1 month
```

**Step 3 — Category breakdown:**
```sql
SELECT
    t.category_id AS categoryId,
    c.name AS categoryName,
    SUM(ABS(t.amount)) AS total,
    COUNT(*) AS transactionCount
FROM transactions t
JOIN categories c ON c.id = t.category_id
WHERE t.transaction_date LIKE '2026-03-%'
  AND t.amount < 0
  AND t.category_id IS NOT NULL
GROUP BY t.category_id
ORDER BY total DESC
```

**Compute in application layer:**
```typescript
const percentage = (cat.total / totalSpend) * 100;
const changeAmount = currentSpend - priorSpend;
const changePercent = priorSpend > 0 ? (changeAmount / priorSpend) * 100 : 0;
```

---

### IE-5 · Upload Route (file persistence)
**Files:** `backend/src/routes/uploads.ts`, `backend/src/services/uploadService.ts`  
**Depends on:** IE-1, IE-6 (for processing), ML-1/ML-2/ML-3 (for categorisation)  
**Note:** Route itself can be implemented before processors are ready — return `status: 'processing'` immediately and complete async

#### `POST /api/uploads`

```
1. Receive multipart file via @fastify/multipart
2. Validate: MIME type in [pdf, csv, xlsx, xls, ofx, qif], size ≤ 50 MB
3. Compute SHA-256 hash of file buffer
4. Check uploads table: if file_hash already exists → return 400 "Duplicate file" immediately (exact byte-for-byte copy)
5. Save file to uploads/{uuid}-{originalName}
6. INSERT INTO uploads (status='pending') → get insertId
7. Kick off async processFile(uploadId, filePath) — do NOT await
8. Return Upload record with status='pending' immediately (HTTP 201)
```

> **`isDuplicate` flag** is set by ML-4 date-range overlap logic during async processing — it is **not** set on file-hash duplicates (those are rejected outright in step 4).

**Async pipeline** (runs in background after response sent):
```
UPDATE status='processing'
→ Detect file type
→ Dispatch to CsvProcessor / ExcelProcessor / PdfProcessor
→ Get ParsedTransaction[]
→ AiService.categorise(transactions)
→ INSERT transactions in batch
→ UPDATE uploads SET status='done', transaction_count=N, date_range_start, date_range_end, bank_info, cardholder_name
→ Run ML-4 date-range overlap check → UPDATE uploads SET is_duplicate=1 if overlap found
→ On error: UPDATE uploads SET status='failed', error_message=?
```

#### `GET /api/uploads`

```sql
SELECT * FROM uploads ORDER BY upload_date DESC LIMIT ? OFFSET ?
```

`isDuplicate` computed at query time:
```sql
-- For each upload, check if another upload's date range overlaps
SELECT EXISTS (
    SELECT 1 FROM uploads u2
    WHERE u2.id != u1.id
      AND u2.date_range_start <= u1.date_range_end
      AND u2.date_range_end   >= u1.date_range_start
) AS isDuplicate
```

#### `DELETE /api/uploads/:id`

```sql
DELETE FROM uploads WHERE id = ?  -- CASCADE removes transactions
```
Also delete the file from `uploads/` directory.

---

### IE-6 · CSV + Excel Processors
**Files:** `backend/src/processors/csvProcessor.ts`, `backend/src/processors/excelProcessor.ts`  
**Depends on:** ML-1 (column detection heuristics)  
**Blocks:** IE-5 async pipeline

#### CSV Processor (Papa Parse)

```typescript
import Papa from 'papaparse';

// After parsing → pass headers to ML-1 column detector
// ML-1 returns: { dateCol, amountCol, descriptionCol, merchantCol? }
// or: { dateCol, debitCol, creditCol, descriptionCol }

// Normalise each row:
// - Parse date → YYYY-MM-DD
// - Parse amount: debit = negative, credit = positive
// - Trim description whitespace
// Return ParsedTransaction[]
```

#### Excel Processor (XLSX)

```typescript
import XLSX from 'xlsx';

// Read first sheet
// Convert to CSV-like rows
// Hand off to same column detection as CSV
// Return ParsedTransaction[]
```

---

## ML Engineer Tasks

### ML-1 · Column Detection Heuristics
**Files:** `backend/src/processors/baseProcessor.ts` (extend with detector utility)  
**Depends on:** nothing  
**Blocks:** IE-6

Banks use different column layouts. The detector must identify the layout from header names:

**Known patterns:**

| Bank Format | Date col | Amount cols | Description col |
|---|---|---|---|
| DBS CSV | `Transaction Date` | `Debit` + `Credit` | `Reference` |
| OCBC CSV | `Date` | `Withdrawals` + `Deposits` | `Description` |
| UOB CSV | `Transaction Date` | `Debit Amount` + `Credit Amount` | `Description` |
| Generic | `Date` | `Amount` (signed) | `Description` / `Merchant` |

**Interface to implement:**
```typescript
interface ColumnMap {
    dateCol: string;
    descriptionCol: string;
    merchantCol?: string;
    // Either single signed amount OR debit/credit split:
    amountCol?: string;
    debitCol?: string;
    creditCol?: string;
}

function detectColumns(headers: string[]): ColumnMap;
function normaliseDate(raw: string): string;          // → YYYY-MM-DD
function normaliseAmount(debit: string, credit: string): number; // → signed float
```

---

### ML-2 · AI Categorisation Service
**Files:** `backend/src/services/aiService.ts`  
**Depends on:** nothing (standalone service)  
**Blocks:** IE-5 async pipeline

Three-tier strategy, each tier runs only if the previous yields low confidence:

#### Tier 1 — Keyword/Rule Matching (free, fast, ~80% coverage)

```typescript
const KEYWORD_RULES: Array<{ pattern: RegExp; categoryName: string }> = [
    { pattern: /grab|gojek|taxi|mrt|bus|ez.?link|parking/i,                        categoryName: 'Transport' },
    { pattern: /ntuc|fairprice|cold.?storage|giant|sheng.?siong|mcdonalds|kfc|starbucks|kopitiam|hawker/i, categoryName: 'Food & Dining' },
    { pattern: /netflix|spotify|disney|youtube|cinema|golden.?village/i,            categoryName: 'Entertainment' },
    { pattern: /sp.?services|sp.?digital|singtel|starhub|m1|electricity|telco|broadband/i, categoryName: 'Utilities' },
    { pattern: /shopee|lazada|amazon|uniqlo|zara|guardian|watsons/i,                categoryName: 'Shopping' },
    { pattern: /clinic|pharmacy|hospital|dental/i,                                  categoryName: 'Health' },
    { pattern: /singapore.?airlines|scoot|jetstar|airbnb|hotel|booking\.com/i,      categoryName: 'Travel' },
    { pattern: /cashback|rebate|refund|reimburs/i,                                  categoryName: 'Income' },
];
```

Confidence score: exact brand match = 0.95, keyword match = 0.80, no match = 0.

#### Tier 2 — OpenAI Categorisation (when Tier 1 confidence < 0.7)

```typescript
// Single API call for a batch of uncategorised transactions
const prompt = `
Classify each bank transaction into exactly one category.
Categories: Food & Dining, Transport, Shopping, Utilities, Entertainment, Health, Travel, Income, Other

Transactions (JSON array):
${JSON.stringify(transactions.map(t => ({ id: t.id, description: t.description, merchant: t.merchant })))}

Respond with a JSON array: [{ "id": number, "category": string, "confidence": number }]
`;
```

Batch up to 50 transactions per API call to minimise cost.  
Set `confidence` from model's implicit certainty (0.85 for clear matches, 0.6 for ambiguous).

#### Tier 3 — Embedding Similarity (future / optional)

```typescript
// Store OpenAI text-embedding-3-small vectors in transaction_embeddings table
// For new transactions: embed description → find K nearest neighbours
// → assign same category as majority of neighbours
// Only activate if ENABLE_EMBEDDINGS=true in .env
```

**Service interface** (IE-5 calls this):
```typescript
interface AiService {
    categorise(
        transactions: ParsedTransaction[],
        categories: Category[]
    ): Promise<Array<ParsedTransaction & {
        categoryId: number;
        categoryConfidence: number;
    }>>;
}
```

---

### ML-3 · PDF Processor
**Files:** `backend/src/processors/pdfProcessor.ts`  
**Depends on:** nothing (self-contained)  
**Blocks:** IE-5 async pipeline for PDF uploads

#### Strategy

```
1. Attempt pdf-parse (fast, works for digital PDFs)
   → Extract raw text blocks
   → Apply layout parsing (see below)

2. If text extraction yields < 5 transactions:
   → Fall back to Tesseract.js OCR
   → Convert PDF pages to images first (pdf-to-img or pdftoppm)
   → OCR each page → extract text
   → Apply same layout parsing

3. Layout parsing:
   → Detect bank format from header text (see Known Formats below)
   → Dispatch to bank-specific parser (preferred) or generic parser
   → Generic parser:
       - Split text into lines
       - Identify header line (contains "Date", "Description", "Amount" etc.)
       - Identify footer lines (page numbers, balance summaries) → skip
       - For each data line: match date pattern, extract amount (last number),
         description (middle text)
       - Handle multi-line descriptions (continuation lines have no date)
```

---

#### Known Bank Statement Formats

| Bank | PDF Layout | Date Column(s) | Amount Style | Multi-line Desc | CR Convention |
|---|---|---|---|---|---|
| HSBC Visa Advance | 4-column table | POST DATE + TRAN DATE | plain = debit, `CR` suffix = credit | Line 2 is `CITY  COUNTRY_CODE` | `131.29CR` |
| UOB One Card | 4-column table (card-section per card) | Post Date + Trans Date | plain = debit, `CR` suffix = credit | `Ref No.` continuation line | `76.18 CR` (space before CR) |
| DBS CSV export | CSV-like | Transaction Date | Debit / Credit columns | No | — |
| OCBC CSV export | CSV-like | Date | Withdrawals / Deposits columns | No | — |

---

#### HSBC Visa Advance — Detailed Parsing Spec

**Identifying this format:**
```typescript
const isHSBCVisaAdvance = (text: string): boolean =>
    /HSBC\s+VISA\s+ADVANCE/i.test(text);
```

**Statement period extraction** (used to derive year for `DD Mon` dates):
```typescript
// Header line: "From 06 DEC 2025 to 05 JAN 2026"
const PERIOD_PATTERN = /From\s+(\d{2}\s+[A-Z]{3}\s+\d{4})\s+to\s+(\d{2}\s+[A-Z]{3}\s+\d{4})/i;
const [_, rawStart, rawEnd] = text.match(PERIOD_PATTERN) ?? [];
// dateRangeStart = parse(rawStart)  e.g. "06 DEC 2025" → 2025-12-06
// dateRangeEnd   = parse(rawEnd)    e.g. "05 JAN 2026" → 2026-01-05
```

**`bankInfo` and `cardholderName` extraction:**
```typescript
// Card number appears in the page header e.g. "4363-2400-2097-1441"
const CARD_PATTERN = /(\d{4}-\d{4}-\d{4}-(\d{4}))/;
const lastFour = text.match(CARD_PATTERN)?.[2] ?? 'XXXX';
const bankInfo = `HSBC Visa Advance *${lastFour}`;

// Cardholder name appears on its own line directly below "HSBC VISA ADVANCE"
// e.g. "LIM JUN CHAI TERENCE"  (all-caps, may include Chinese romanised names)
// The grey section banner may also show a variant: "You Yin 4363-XXXX-XXXX-1458"
// (Chinese name "You Yin" followed by masked card number — this is a supplementary card holder)
// Extract from the page header block before the statement period line.
const NAME_PATTERN = /^([A-Z][A-Z\s]+)$/m;   // all-caps line, letters and spaces only
const cardholderName = text
    .split('\n')
    .map(l => l.trim())
    .find(l => NAME_PATTERN.test(l) && !l.includes('HSBC') && !l.includes('VISA'))
    ?? null;

// Store both in the uploads metadata JSON blob:
// metadata: { cardholderName: "LIM JUN CHAI TERENCE", lastFour: "1441" }
```

> **Note on supplementary cardholders:** The grey section-banner rows (e.g. `You Yin 4363-XXXX-XXXX-1458`) indicate transactions belonging to a supplementary card under the same account. The banner name is **not** the primary cardholder — it should be skipped for parsing (already in `HSBC_SKIP_PATTERNS`) but the pattern should be flexible enough to handle any name prefix before the masked card number.

**Table structure:**
```
Column 1: POST DATE   — posting date, format "DD Mon" (e.g. "08 Dec")
Column 2: TRAN DATE   — transaction date, format "DD Mon" (e.g. "06 Dec")  ← use this
Column 3: DESCRIPTION — merchant name (may wrap to next line)
Column 4: AMOUNT(SGD) — positive number, optionally suffixed with "CR"
```

**Lines to skip (filter before parsing):**
```typescript
const HSBC_SKIP_PATTERNS = [
    /HSBC\s+VISA\s+ADVANCE/i,               // page header
    /[A-Z\s]+\d{4}-XXXX-XXXX-\d{4}/,      // grey account-holder banner row (any name + masked card)
    /Previous\s+Statement\s+Balance/i,       // balance carry-forward line
    /Continued\s+on\s+next\s+page/i,        // page footer
    /Statement\s+of\s+Account/i,             // section title
    /Account\s+Summary/i,                    // summary box header
    /POST\s+DATE\s+TRAN\s+DATE/i,           // column header row
    /^(AMOUNT|DESCRIPTION|SGD)\s*$/i,       // stray column label lines
    /^\s*Page\s+\d+/i,                      // page number lines
];

function shouldSkipLine(line: string): boolean {
    return HSBC_SKIP_PATTERNS.some(p => p.test(line));
}
```

**Date parsing** (no year in transaction lines — derive from statement period):
```typescript
function parseHSBCDate(ddMon: string, periodStart: Date, periodEnd: Date): Date {
    // e.g. ddMon = "08 Dec"
    // Year ambiguity: statement can span Dec → Jan across a year boundary.
    // Rule: if month is in periodEnd's year and after periodStart, use periodEnd.getFullYear()
    //       otherwise use periodStart.getFullYear()
    const candidate = parse(`${ddMon} ${periodStart.getFullYear()}`, 'dd MMM yyyy', new Date());
    if (candidate >= periodStart && candidate <= periodEnd) return candidate;
    // Try next year (cross-year statements e.g. Dec 2025 → Jan 2026)
    return parse(`${ddMon} ${periodEnd.getFullYear()}`, 'dd MMM yyyy', new Date());
}
```

**Amount parsing** (`CR` suffix = credit = positive; plain = debit = negative):
```typescript
function parseHSBCAmount(raw: string, isCR: boolean): number {
    const abs = parseFloat(raw.replace(/,/g, ''));
    return isCR ? +abs : -abs;   // credits are positive, debits negative
}
```

**Multi-line description handling:**
```typescript
// A "continuation line" has no leading date — it is the city/country of the merchant.
// Pattern: lines matching "  CITY_NAME  COUNTRY_CODE" (e.g. "  SINGAPORE  SG")
// Strategy: append to previous transaction's description if desired, or strip.
const CONTINUATION_PATTERN = /^\s{2,}[A-Z\s]+\s{2,}[A-Z]{2}\s*$/;

// Recommended: strip city/country lines — they add noise to descriptions.
// Store clean merchant name only (e.g. "MCDONALD'S (PGS)" not "MCDONALD'S (PGS) SINGAPORE SG")
```

**Full HSBC transaction line regex:**
```typescript
// Matches: "08 Dec  06 Dec  MCDONALD'S (PGS)         11.95"
//      or: "12 Jan  10 Jan  SHEIN.COM REFUND          131.29CR"
const HSBC_TX_LINE = /^(\d{2}\s+[A-Za-z]{3})\s{2,}(\d{2}\s+[A-Za-z]{3})\s{2,}(.+?)\s{2,}([\d,]+\.\d{2})(CR)?$/;

function parseHSBCLine(line: string, periodStart: Date, periodEnd: Date): RawTransaction | null {
    const match = line.match(HSBC_TX_LINE);
    if (!match) return null;
    const [, _postDate, tranDate, description, amountRaw, crFlag] = match;
    return {
        transactionDate: parseHSBCDate(tranDate.trim(), periodStart, periodEnd),
        description: description.trim(),
        amount: parseHSBCAmount(amountRaw, !!crFlag),
        currency: 'SGD',
    };
}
```

**Suggested ML-2 keyword seeds from HSBC statements:**
```typescript
// These merchants appear frequently in HSBC SG statements — pre-seed categorisation rules
const HSBC_KEYWORD_SEEDS = [
    { pattern: /^FAIRPRICE/i,          category: 'Groceries' },
    { pattern: /^BUS\/MRT/i,           category: 'Transport' },
    { pattern: /^PARKING\.SG/i,        category: 'Transport' },
    { pattern: /^MCDONALD/i,           category: 'Food & Dining' },
    { pattern: /^GRAB/i,               category: 'Transport' },
    { pattern: /^SHEIN/i,              category: 'Shopping' },
    { pattern: /^NETFLIX/i,            category: 'Entertainment' },
    { pattern: /^SPOTIFY/i,            category: 'Entertainment' },
    { pattern: /^AMAZON/i,             category: 'Shopping' },
    { pattern: /^NTUC/i,               category: 'Groceries' },
];
```

---

#### UOB One Card — Detailed Parsing Spec

**Identifying this format:**
```typescript
const isUOB = (text: string): boolean =>
    /United\s+Overseas\s+Bank|UOB\s+ONE\s+CARD|UOB\s+\u5927\u534e\u9280\u884c/i.test(text);
// "大华银行" is the Chinese name printed on the UOB logo
```

**Statement date extraction** (UOB uses a single statement date, not a range):
```typescript
// "Statement Date  06 JAN 2026"
const STMT_DATE_PATTERN = /Statement\s+Date\s+(\d{2}\s+[A-Z]{3}\s+\d{4})/i;
const rawDate = text.match(STMT_DATE_PATTERN)?.[1];  // e.g. "06 JAN 2026"
// UOB statements cover the preceding ~30 days.
// dateRangeEnd   = parse(rawDate)
// dateRangeStart = dateRangeEnd minus 31 days (conservative estimate)
// For precision: scan transaction dates after parsing — use min/max as actual range.
```

**`bankInfo` and `cardholderName` extraction:**
```typescript
// Card summary table row: "UOB ONE CARD  4265-8840-8154-6839  TERENCE LIM  563.92  50.00"
// Card number and name on card appear in the Summary section.
const CARD_ROW_PATTERN = /UOB\s+ONE\s+CARD\s+([\d-]+)\s+([A-Z\s]+?)\s+[\d,.]+/i;
const cardMatch = text.match(CARD_ROW_PATTERN);
const lastFour = cardMatch?.[1].slice(-4) ?? 'XXXX';
const nameOnCard = cardMatch?.[2]?.trim() ?? null;       // e.g. "TERENCE LIM"

// Primary cardholder's full name from the address block (top-left of page 1):
// "MR TERENCE LIM JUN CHAI\n34 SUMANG WALK #07-27\nSINGAPORE 828622"
const ADDR_NAME_PATTERN = /^(MR|MRS|MS|DR)\s+([A-Z\s]+)$/m;
const addrMatch = text.match(ADDR_NAME_PATTERN);
const cardholderName = addrMatch
    ? `${addrMatch[1]} ${addrMatch[2].trim()}`   // e.g. "MR TERENCE LIM JUN CHAI"
    : nameOnCard;

const bankInfo = `UOB One Card *${lastFour}`;

// metadata: { cardholderName: "MR TERENCE LIM JUN CHAI", nameOnCard: "TERENCE LIM", lastFour: "6839" }
```

**Document structure:**
```
Page 1:
  ├── Header block (logo, address, Statement Summary, Payment Summary)
  ├── Credit Card(s) Statement — Summary table (card name / number / name on card / amounts)
  └── Per-card section: "UOB ONE CARD" banner
       └── "4265-8840-8154-6839 TERENCE LIM" sub-header
            └── Transaction table (Post Date | Trans Date | Description of Transaction | Transaction Amount SGD)

Page 2+:
  └── Per-card section continues: "UOB ONE CARD" banner
       └── "4265-8840-8154-6839 TERENCE LIM (continued)" sub-header
            ├── Transaction rows
            ├── SUB TOTAL row
            └── TOTAL BALANCE FOR UOB ONE CARD row

Footer:
  └── "--- End of Transaction Details ---"
```

**Lines to skip (filter before parsing):**
```typescript
const UOB_SKIP_PATTERNS = [
    /United\s+Overseas\s+Bank/i,                          // footer legal text
    /UOB\s+ONE\s+CARD\s*$/i,                             // card section banner header
    /^\d{4}-\d{4}-\d{4}-\d{4}\s+[A-Z\s]+(\(continued\))?$/i,  // card sub-header row
    /^Post\s+Date\s+Trans\s+Date/i,                       // column header row
    /PREVIOUS\s+BALANCE/i,                                // opening balance line
    /SUB\s+TOTAL/i,                                       // sub-total row
    /TOTAL\s+BALANCE\s+FOR/i,                             // total row
    /End\s+of\s+Transaction\s+Details/i,                  // document footer
    /^\s*Page\s+\d+\s+of\s+\d+/i,                        // page numbers
    /Credit\s+Card\(s\)\s+Statement/i,                    // section title
    /^Summary$/i,                                          // summary table header
    /Card\s+Name\s+Card\s+Number/i,                       // summary table column headers
    /Amount\s+to\s+Pay\s+SGD/i,                          // payment summary rows
    /Minimum\s+Payment/i,
    /Due\s+Date/i,
    /Statement\s+Date/i,
    /Total\s+Credit\s+Limit/i,
];

function shouldSkipLineUOB(line: string): boolean {
    return UOB_SKIP_PATTERNS.some(p => p.test(line));
}
```

**Date parsing** (UOB uses `DD MMM` with no year, same cross-year ambiguity as HSBC):
```typescript
// Reuse the same parseHSBCDate() logic — both banks use "DD MMM" format.
// Pass statementDate as the periodEnd; statementDate minus 31 days as periodStart.
```

**Amount parsing** (UOB credits have a space before `CR`, debits are plain):
```typescript
// "1,137.63 CR"  →  credit  →  +1137.63
// "188.86"       →  debit   →  -188.86
// Note: UOB uses a SPACE before CR unlike HSBC which has no space.
function parseUOBAmount(raw: string): number {
    const isCR = /CR$/i.test(raw.trim());
    const abs = parseFloat(raw.replace(/[,\sCR]/gi, ''));
    return isCR ? +abs : -abs;
}
```

**Multi-line description handling** (`Ref No.` continuation lines):
```typescript
// UOB descriptions often have a second line: "Ref No. : 74541835342288083635878"
// These should be stripped — not part of the merchant name.
const UOB_CONTINUATION_PATTERN = /^Ref\s+No\.\s*:/i;
// Also skip pure whitespace-only lines between transactions.
```

**Full UOB transaction line regex:**
```typescript
// Matches: "19 DEC  19 DEC  OTHR-Other                    1,137.63 CR"
//      or: "09 DEC  06 DEC  SHOPEE SINGAPORE MP SINGAPORE  188.86"
// Note: description may contain mixed case ("Grab* A-8NWEU7WGWNM5AV Singapore")
const UOB_TX_LINE = /^(\d{2}\s+[A-Za-z]{3})\s{2,}(\d{2}\s+[A-Za-z]{3})\s{2,}(.+?)\s{2,}([\d,]+\.\d{2}(?:\s+CR)?)\s*$/i;

function parseUOBLine(
    line: string,
    periodStart: Date,
    periodEnd: Date
): RawTransaction | null {
    const match = line.match(UOB_TX_LINE);
    if (!match) return null;
    const [, _postDate, transDate, description, amountRaw] = match;
    return {
        transactionDate: parseHSBCDate(transDate.trim(), periodStart, periodEnd), // reuse date logic
        description: description.trim(),
        amount: parseUOBAmount(amountRaw),
        currency: 'SGD',
    };
}
```

**Suggested ML-2 keyword seeds from UOB statements:**
```typescript
const UOB_KEYWORD_SEEDS = [
    { pattern: /^SHOPEE/i,              category: 'Shopping' },
    { pattern: /^GRAB\*/i,              category: 'Transport' },
    { pattern: /^Grab\s+Subscription/i, category: 'Entertainment' },   // streaming/subscription → Entertainment
    { pattern: /^ESSO/i,                category: 'Transport' },        // petrol
    { pattern: /^SP\s+Digital/i,        category: 'Utilities' },        // SP utilities
    { pattern: /^UOB\s+ONE\s+CASH/i,    category: 'Income' },           // cashback redemption
    { pattern: /^ONE\s+CARD.*REBATE/i,  category: 'Income' },           // card rebate
    { pattern: /^OTHR/i,                category: 'Other' },            // UOB internal transfer code
];
```

---

#### Format Dispatcher

```typescript
function detectBankFormat(text: string): 'hsbc-visa-advance' | 'uob-one-card' | 'generic' {
    if (/HSBC\s+VISA\s+ADVANCE/i.test(text))                          return 'hsbc-visa-advance';
    if (/UOB\s+ONE\s+CARD|United\s+Overseas\s+Bank/i.test(text))     return 'uob-one-card';
    return 'generic';
}

// pdf-parse returns a Promise — use await correctly.
// ParsedStatement = { transactions: RawTransaction[], bankInfo, cardholderName, dateRangeStart, dateRangeEnd }
async function parsePDF(buffer: Buffer): Promise<ParsedStatement> {
    const data = await pdfParse(buffer);   // pdf-parse v1.x returns Promise<PDFData>
    const text = data.text;
    const format = detectBankFormat(text);

    switch (format) {
        case 'hsbc-visa-advance': return parseHSBC(text);
        case 'uob-one-card':     return parseUOB(text);
        default:                 return parseGeneric(text);
    }
}
```

---

#### Generic PDF Fallback Parser

Used when no specific bank format is detected:

**Date pattern matching:**
```typescript
const DATE_PATTERNS = [
    /\d{2}\/\d{2}\/\d{4}/,   // DD/MM/YYYY  — DBS, OCBC
    /\d{2}-\d{2}-\d{4}/,     // DD-MM-YYYY
    /\d{2}\s+[A-Za-z]{3}/,   // DD MMM      — HSBC and similar
];
```

**Amount pattern:**
```typescript
// Last occurrence of a number with decimals on a transaction line
const AMOUNT_PATTERN = /[\d,]+\.\d{2}/g;
// Determine sign: look for "DR" / "CR" suffix, or column position
```

---

### ML-4 · Date-Range Duplicate Detection
**Files:** Logic in `backend/src/services/uploadService.ts` (ML designs, IE implements query)  
**Depends on:** IE-5  
**Blocks:** `isDuplicate` field on `Upload` type

The frontend displays a warning badge when `isDuplicate: true`. Two levels:

**Level 1 — File hash** (IE handles, already in schema):
```sql
SELECT id FROM uploads WHERE file_hash = ? AND id != ?
```
Exact byte-for-byte duplicate → reject with `400 Duplicate file`.

**Level 2 — Date range overlap** (ML designs algorithm):
```
Given: new upload covers [newStart, newEnd]
Query: any existing upload where:
    existing.date_range_start <= newEnd
    AND existing.date_range_end >= newStart
    AND existing.processing_status = 'done'
```
This is the standard interval overlap check. Set `isDuplicate = true` on the new upload record but **do not reject** — user may be intentionally uploading an amended statement.

**Edge cases ML must handle:**
- Partial overlaps (new upload shares 2 weeks with an existing one)
- Same bank vs different bank (OCBC Jan + DBS Jan = no duplicate)
- `bankInfo` field populated during parsing should be factored in: only flag duplicate if same bank AND overlapping date range

---

## Implementation Order (Critical Path)

```
IE-1  Database Bootstrap
  │
  ├─▶  IE-2  Categories Route          ← unblocks frontend category dropdown
  │
  ├─▶  IE-3  Transactions Route        ← unblocks TransactionTable
  │
  ├─▶  IE-4  Analytics Route           ← unblocks Dashboard chart + stats
  │
  └─▶  IE-5  Upload Route (stub)       ← accepts file, returns 'processing', 
        │     no parsing yet           ← UploadHistory polling works immediately
        │
        ├─▶  ML-1  Column Detection
        │      └─▶  IE-6  CSV + Excel Processors
        │              └─▶  ML-2  AI Categorisation  ← completes pipeline
        │
        └─▶  ML-3  PDF Processor       ← parallel to CSV/Excel work
              └─▶  ML-4  Duplicate Detection logic
```

**Milestone 1** (IE-1 → IE-2 → IE-3 → IE-4 → IE-5 stub):  
Frontend works end-to-end with real data. Uploads are accepted and polled. No transactions extracted yet.

**Milestone 2** (+ ML-1 → IE-6 → ML-2):  
CSV/Excel uploads fully processed, transactions stored and categorised, dashboard populated from real data.

**Milestone 3** (+ ML-3 → ML-4):  
PDF uploads supported, duplicate detection active, all file formats operational.

---

## Environment Variables Required

```env
# backend/.env
NODE_ENV=development
PORT=3001
FRONTEND_PORT=3000
DB_PATH=./database/finance.db
UPLOADS_DIR=./uploads
LOG_LEVEL=info

# ML-2 (optional — falls back to keyword matching if not set)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
ENABLE_EMBEDDINGS=false
```

---

## Files Status Summary

| File | Owner | Status |
|---|---|---|
| `database/connection.ts` | IE | 🔴 Stub — needs implementation |
| `database/migrations/001_initial.ts` | IE | ✅ Complete |
| `routes/categories.ts` | IE | 🔴 Stub |
| `routes/transactions.ts` | IE | 🔴 Stub |
| `routes/analytics.ts` | IE | 🔴 Stub |
| `routes/uploads.ts` | IE | 🔴 Stub |
| `services/uploadService.ts` | IE | 🔴 Stub |
| `services/transactionService.ts` | IE | 🔴 Stub |
| `processors/baseProcessor.ts` | IE/ML | ✅ Interface defined |
| `processors/csvProcessor.ts` | IE + ML-1 | 🔴 Stub |
| `processors/excelProcessor.ts` | IE + ML-1 | 🔴 Stub |
| `processors/pdfProcessor.ts` | ML | 🔴 Stub |
| `services/aiService.ts` | ML | 🔴 Stub |
| `server.ts` | IE | ✅ Complete (needs `runMigrations()` call) |
| `config/app.ts` | IE | ✅ Complete |
| `middleware/errorHandler.ts` | IE | ✅ Complete |
| `utils/fileUtils.ts` | IE | ✅ Complete |
