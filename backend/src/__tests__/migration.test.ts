import { describe, it, expect, beforeAll, vi } from 'vitest';

// Mock the database connection module so migrations run against an in-memory
// SQLite database instead of the real file on disk.
vi.mock('../database/connection', async () => {
    const { default: Database } = await import('better-sqlite3');
    const db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    return {
        getDb: () => db,
        closeDb: vi.fn(),
    };
});

import { runMigrations } from '../database/migrations/001_initial';
import { getDb } from '../database/connection';

// ── Column metadata shape returned by PRAGMA table_info ───────────────────────
interface ColumnInfo {
    cid: number;
    name: string;
    type: string;
    notnull: number;
    dflt_value: string | null;
    pk: number;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Migration 001 — initial schema', () => {
    beforeAll(() => {
        // Migrations use CREATE TABLE IF NOT EXISTS and INSERT OR IGNORE, so
        // they are safe to call multiple times on the same in-memory DB.
        runMigrations();
    });

    it('runs without throwing', () => {
        // If beforeAll did not throw, migration succeeded. An explicit call here
        // also verifies idempotency.
        expect(() => runMigrations()).not.toThrow();
    });

    it('uploads table contains an "is_duplicate" column', () => {
        const db = getDb();
        const columns = db
            .prepare('PRAGMA table_info(uploads)')
            .all() as ColumnInfo[];
        const col = columns.find((c) => c.name === 'is_duplicate');
        expect(col).toBeDefined();
    });

    it('"is_duplicate" column has dflt_value = 0 and notnull = 1', () => {
        const db = getDb();
        const columns = db
            .prepare('PRAGMA table_info(uploads)')
            .all() as ColumnInfo[];
        const col = columns.find((c) => c.name === 'is_duplicate');
        // SQLite stores default values as strings in PRAGMA output
        expect(Number(col!.dflt_value)).toBe(0);
        expect(col!.notnull).toBe(1);
    });
});
