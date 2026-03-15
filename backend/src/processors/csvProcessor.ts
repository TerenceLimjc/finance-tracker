import type { BaseProcessor, ParsedTransaction } from './baseProcessor';

/**
 * CsvProcessor
 *
 * Uses Papa Parse to extract transactions from CSV exports.
 * Auto-detects common bank CSV column layouts.
 */
export class CsvProcessor implements BaseProcessor {
    async parse(_filePath: string): Promise<ParsedTransaction[]> {
        // TODO: implement — Papa Parse → column detection → normalise rows
        return [];
    }
}
