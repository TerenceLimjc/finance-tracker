import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getDb } from '../database/connection';
import { appConfig } from '../config/app';
import { TransactionService } from './transactionService';
import { AiService } from './aiService';
import { CsvProcessor } from '../processors/csvProcessor';
import { ExcelProcessor } from '../processors/excelProcessor';
import { PdfProcessor } from '../processors/pdfProcessor';
import type { ProcessingStatus } from '../database/models/types';

const txService = new TransactionService();
const aiService = new AiService();

interface UploadRow {
    id: number;
    filename: string;
    original_filename: string;
    file_size: number;
    file_type: string;
    upload_date: string;
    processing_status: ProcessingStatus;
    transaction_count: number;
    date_range_start: string | null;
    date_range_end: string | null;
    bank_info: string | null;
    cardholder_name: string | null;
    file_hash: string | null;
    is_duplicate: number;
    error_message: string | null;
}

function toApiUpload(row: UploadRow) {
    return {
        id: row.id,
        filename: row.filename,
        originalFilename: row.original_filename,
        fileSize: row.file_size,
        fileType: row.file_type,
        uploadDate: row.upload_date,
        processingStatus: row.processing_status,
        transactionCount: row.transaction_count,
        dateRangeStart: row.date_range_start,
        dateRangeEnd: row.date_range_end,
        bankInfo: row.bank_info,
        cardholderName: row.cardholder_name,
        isDuplicate: row.is_duplicate === 1,
        errorMessage: row.error_message,
    };
}

export class UploadService {
    /** Compute SHA-256 hash of a buffer. */
    private hashBuffer(buffer: Buffer): string {
        return crypto.createHash('sha256').update(buffer).digest('hex');
    }

    /**
     * Saves file, inserts upload record, kicks off async processing.
     * Returns the new upload record immediately (status='pending').
     * Throws a 400-statusCode error if exact duplicate file hash found.
     */
    async create(
        originalFilename: string,
        mimetype: string,
        buffer: Buffer,
    ) {
        const db = getDb();
        const fileHash = this.hashBuffer(buffer);

        // Level 1 duplicate: exact byte-for-byte copy
        const existing = db.prepare('SELECT id FROM uploads WHERE file_hash = ?').get(fileHash);
        if (existing) {
            const err = new Error('Duplicate file — this exact statement has already been uploaded.');
            (err as NodeJS.ErrnoException).code = '400';
            throw Object.assign(err, { statusCode: 400 });
        }

        // Persist file to disk
        const ext = path.extname(originalFilename);
        const uuid = crypto.randomUUID();
        const savedFilename = `${uuid}${ext}`;
        const savedPath = path.resolve(appConfig.uploadsPath, savedFilename);
        fs.mkdirSync(path.dirname(savedPath), { recursive: true });
        fs.writeFileSync(savedPath, buffer);

        // Insert upload record
        const result = db.prepare(`
            INSERT INTO uploads (filename, original_filename, file_size, file_type, file_hash, processing_status)
            VALUES (?, ?, ?, ?, ?, 'pending')
        `).run(savedFilename, originalFilename, buffer.length, mimetype, fileHash);

        const uploadId = result.lastInsertRowid as number;

        // Kick off async processing — intentionally not awaited
        this.processInBackground(uploadId, savedPath, mimetype).catch((err) => {
            console.error(`[upload ${uploadId}] background processing failed:`, err);
        });

        return this.getById(uploadId);
    }

    /** Background pipeline: parse → categorise → store → duplicate-check */
    private async processInBackground(
        uploadId: number,
        filePath: string,
        mimetype: string,
    ): Promise<void> {
        const db = getDb();

        // Mark as processing
        db.prepare(`UPDATE uploads SET processing_status = 'processing' WHERE id = ?`).run(uploadId);

        try {
            // 1. Parse file
            const processor = this.selectProcessor(mimetype, filePath);
            const parsed = await processor.parse(filePath);

            // 2. AI categorisation
            const categories = db.prepare('SELECT id, name FROM categories').all() as Array<{ id: number; name: string }>;
            const categorised = await aiService.categorise(parsed, categories);

            // 3. Batch insert transactions
            txService.insertBatch(uploadId, categorised);

            // 4. Derive date range from parsed transactions
            const dates = parsed.map((t) => t.transactionDate).filter(Boolean).sort();
            const dateRangeStart = dates[0] ?? null;
            const dateRangeEnd = dates[dates.length - 1] ?? null;

            // 5. Extract bankInfo / cardholderName from processor (PDF only)
            const meta = (processor as PdfProcessor).lastMeta ?? null;
            const bankInfo = meta?.bankInfo ?? null;
            const cardholderName = meta?.cardholderName ?? null;

            // 6. Mark done
            db.prepare(`
                UPDATE uploads
                SET processing_status = 'done',
                    transaction_count  = ?,
                    date_range_start   = ?,
                    date_range_end     = ?,
                    bank_info          = ?,
                    cardholder_name    = ?
                WHERE id = ?
            `).run(parsed.length, dateRangeStart, dateRangeEnd, bankInfo, cardholderName, uploadId);

            // 7. Level 2 duplicate detection (date-range + bank overlap)
            this.runDuplicateCheck(uploadId, dateRangeStart, dateRangeEnd, bankInfo);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            db.prepare(`
                UPDATE uploads SET processing_status = 'failed', error_message = ? WHERE id = ?
            `).run(message, uploadId);
        }
    }

    /** Selects the right processor by MIME type / extension. */
    private selectProcessor(mimetype: string, filePath: string) {
        const ext = path.extname(filePath).toLowerCase();
        if (mimetype === 'application/pdf' || ext === '.pdf') return new PdfProcessor();
        if (ext === '.xlsx' || ext === '.xls' || mimetype.includes('spreadsheet')) return new ExcelProcessor();
        return new CsvProcessor();
    }

    /**
     * ML-4 Level 2: flag isDuplicate if another done upload from the same bank
     * has an overlapping date range.
     */
    private runDuplicateCheck(
        uploadId: number,
        start: string | null,
        end: string | null,
        bankInfo: string | null,
    ): void {
        if (!start || !end) return;
        const db = getDb();

        const overlap = db.prepare(`
            SELECT id FROM uploads
            WHERE id != ?
              AND processing_status = 'done'
              AND date_range_start IS NOT NULL
              AND date_range_end   IS NOT NULL
              AND date_range_start <= ?
              AND date_range_end   >= ?
              AND (bank_info IS NULL OR bank_info = ? OR ? IS NULL)
            LIMIT 1
        `).get(uploadId, end, start, bankInfo, bankInfo);

        if (overlap) {
            db.prepare(`UPDATE uploads SET is_duplicate = 1 WHERE id = ?`).run(uploadId);
        }
    }

    /** Paginated list of all uploads, newest first. */
    list(page = 1, pageSize = 20) {
        const db = getDb();
        const offset = (page - 1) * pageSize;

        const total: number = (db.prepare('SELECT COUNT(*) AS cnt FROM uploads').get() as { cnt: number }).cnt;
        const rows = db.prepare(`
            SELECT * FROM uploads ORDER BY upload_date DESC LIMIT ? OFFSET ?
        `).all(pageSize, offset) as UploadRow[];

        return { data: rows.map(toApiUpload), total };
    }

    getById(id: number) {
        const db = getDb();
        const row = db.prepare('SELECT * FROM uploads WHERE id = ?').get(id) as UploadRow | undefined;
        if (!row) return null;
        return toApiUpload(row);
    }

    /** Deletes upload record (cascades to transactions) and removes file from disk. */
    delete(id: number): boolean {
        const db = getDb();
        const row = db.prepare('SELECT filename FROM uploads WHERE id = ?').get(id) as { filename: string } | undefined;
        if (!row) return false;

        db.prepare('DELETE FROM uploads WHERE id = ?').run(id);

        const filePath = path.resolve(appConfig.uploadsPath, row.filename);
        try { fs.unlinkSync(filePath); } catch { /* file may already be gone */ }

        return true;
    }
}
