import { getDb } from '../database/connection';

export interface TransactionQuery {
    month: string;           // YYYY-MM
    categoryId?: number;
    searchText?: string;
    sortField?: 'transactionDate' | 'amount';
    sortOrder?: 'asc' | 'desc';
    page?: number;
    pageSize?: number;
}

export class TransactionService {
    /**
     * Returns a paginated, filtered list of transactions with their category name.
     */
    list(query: TransactionQuery) {
        const db = getDb();

        const {
            month,
            categoryId,
            searchText,
            sortField = 'transactionDate',
            sortOrder = 'desc',
            page = 1,
            pageSize = 25,
        } = query;

        const offset = (page - 1) * pageSize;
        const monthPattern = `${month}-%`;

        // Map camelCase sort field → DB column
        const sortCol = sortField === 'amount' ? 't.amount' : 't.transaction_date';
        const order = sortOrder === 'asc' ? 'ASC' : 'DESC';

        const conditions: string[] = ['t.transaction_date LIKE ?'];
        const params: (string | number)[] = [monthPattern];

        if (categoryId !== undefined) {
            conditions.push('t.category_id = ?');
            params.push(categoryId);
        }

        if (searchText) {
            conditions.push('(t.description LIKE ? OR t.merchant LIKE ?)');
            const like = `%${searchText}%`;
            params.push(like, like);
        }

        const where = conditions.join(' AND ');

        const total: number = (db.prepare(`
            SELECT COUNT(*) AS cnt
            FROM transactions t
            WHERE ${where}
        `).get(...params) as { cnt: number }).cnt;

        const data = db.prepare(`
            SELECT
                t.id,
                t.upload_id           AS uploadId,
                t.transaction_date    AS transactionDate,
                t.amount,
                t.description,
                t.merchant,
                t.account_info        AS cardholderName,
                t.category_id         AS categoryId,
                c.name                AS categoryName,
                t.category_confidence AS categoryConfidence,
                t.user_notes          AS userNotes
            FROM transactions t
            LEFT JOIN categories c ON c.id = t.category_id
            WHERE ${where}
            ORDER BY ${sortCol} ${order}
            LIMIT ? OFFSET ?
        `).all(...params, pageSize, offset);

        return { data, total, page, pageSize };
    }

    /**
     * Reassigns the category of a single transaction (user-driven edit).
     * Sets confidence to 1.0 (manual = certain) and records the correction
     * in category_feedback so future uploads learn from it.
     */
    updateCategory(id: number, categoryId: number): boolean {
        const db = getDb();

        // Fetch the transaction so we can record the feedback rule
        const tx = db.prepare(
            'SELECT description, merchant FROM transactions WHERE id = ?'
        ).get(id) as { description: string; merchant: string | null } | undefined;

        const result = db.prepare(`
            UPDATE transactions
            SET category_id = ?, category_confidence = 1.0
            WHERE id = ?
        `).run(categoryId, id);

        if (result.changes > 0 && tx) {
            // Upsert: COALESCE(merchant,'') treats NULL merchant rows as equivalent,
            // matching the idx_feedback_coalesce_unique index to prevent duplicates.
            db.prepare(`
                INSERT INTO category_feedback (merchant, description, category_id)
                VALUES (?, ?, ?)
                ON CONFLICT(COALESCE(merchant, ''), description)
                DO UPDATE SET category_id = excluded.category_id,
                              created_at  = datetime('now')
            `).run(tx.merchant ?? null, tx.description, categoryId);
        }

        return result.changes > 0;
    }

    /**
     * Permanently deletes a single transaction.
     */
    delete(id: number): boolean {
        const db = getDb();
        const result = db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
        return result.changes > 0;
    }

    /**
     * Returns all learned feedback rules (most-recent-first).
     * Used by AiService to apply as Tier 0 before regex/LLM.
     */
    getFeedback(): Array<{ merchant: string | null; description: string; categoryId: number; categoryName: string }> {
        const db = getDb();
        return db.prepare(`
            SELECT f.merchant, f.description, f.category_id AS categoryId, c.name AS categoryName
            FROM category_feedback f
            JOIN categories c ON c.id = f.category_id
            ORDER BY f.created_at DESC
        `).all() as Array<{ merchant: string | null; description: string; categoryId: number; categoryName: string }>;
    }

    /**
     * Monthly spending summary + category breakdown for the analytics route.
     */
    getMonthlySummary(month: string) {
        const db = getDb();

        const monthPattern = `${month}-%`;

        // Prior month (handles Jan → Dec year rollback)
        const [year, mon] = month.split('-').map(Number);
        const priorDate = new Date(year, mon - 2, 1); // month is 0-indexed
        const priorMonth = `${priorDate.getFullYear()}-${String(priorDate.getMonth() + 1).padStart(2, '0')}`;
        const priorPattern = `${priorMonth}-%`;

        const totalsRow = db.prepare(`
            SELECT
                COUNT(*) AS transactionCount,
                SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) AS totalSpend
            FROM transactions
            WHERE transaction_date LIKE ?
        `).get(monthPattern) as { transactionCount: number; totalSpend: number | null };

        const priorRow = db.prepare(`
            SELECT SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) AS totalSpend
            FROM transactions
            WHERE transaction_date LIKE ?
        `).get(priorPattern) as { totalSpend: number | null };

        const totalSpend = totalsRow.totalSpend ?? 0;
        const priorSpend = priorRow.totalSpend ?? 0;

        const categories = db.prepare(`
            SELECT
                t.category_id  AS categoryId,
                c.name         AS categoryName,
                ABS(SUM(t.amount)) AS total,
                COUNT(*)           AS transactionCount
            FROM transactions t
            JOIN categories c ON c.id = t.category_id
            WHERE t.transaction_date LIKE ?
              AND t.category_id IS NOT NULL
            GROUP BY t.category_id
            HAVING SUM(t.amount) < 0
            ORDER BY total DESC
        `).all(monthPattern) as Array<{ categoryId: number; categoryName: string; total: number; transactionCount: number }>;

        const categoriesWithPct = categories.map((cat) => ({
            ...cat,
            percentage: totalSpend > 0 ? (cat.total / totalSpend) * 100 : 0,
        }));

        return {
            month,
            totalSpend,
            transactionCount: totalsRow.transactionCount,
            changeAmount: totalSpend - priorSpend,
            changePercent: priorSpend > 0 ? ((totalSpend - priorSpend) / priorSpend) * 100 : 0,
            categories: categoriesWithPct,
        };
    }

    /**
     * Batch-insert parsed transactions tied to an upload.
     */
    insertBatch(
        uploadId: number,
        transactions: Array<{
            transactionDate: string;
            amount: number;
            description: string;
            merchant?: string;
            cardholderName?: string;
            categoryId?: number;
            categoryConfidence?: number;
        }>,
    ): void {
        const db = getDb();
        const insert = db.prepare(`
            INSERT INTO transactions
                (upload_id, transaction_date, amount, description, merchant, account_info, category_id, category_confidence)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const insertMany = db.transaction((rows: typeof transactions) => {
            for (const row of rows) {
                insert.run(
                    uploadId,
                    row.transactionDate,
                    row.amount,
                    row.description,
                    row.merchant ?? null,
                    row.cardholderName ?? null,
                    row.categoryId ?? null,
                    row.categoryConfidence ?? null,
                );
            }
        });
        insertMany(transactions);
    }
}
