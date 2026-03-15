import type { BaseProcessor, ParsedTransaction } from './baseProcessor';

/**
 * PdfProcessor
 *
 * Uses pdf-parse + Tesseract.js (OCR fallback) to extract
 * transaction rows from bank-statement PDFs.
 */
export class PdfProcessor implements BaseProcessor {
    async parse(_filePath: string): Promise<ParsedTransaction[]> {
        // TODO: implement — pdf-parse → text extraction → row parsing
        return [];
    }
}
