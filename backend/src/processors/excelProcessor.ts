import XLSX from 'xlsx';
import type { BaseProcessor, ParsedTransaction } from './baseProcessor';
import { detectColumns, normaliseDate, normaliseAmount } from './baseProcessor';

/**
 * ExcelProcessor
 *
 * Uses the XLSX library to extract transactions from .xls / .xlsx bank export files.
 * Reuses the same ML-1 column detection as the CSV processor.
 */
export class ExcelProcessor implements BaseProcessor {
    async parse(filePath: string): Promise<ParsedTransaction[]> {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) throw new Error('Excel file contains no sheets');

        const sheet = workbook.Sheets[sheetName];
        // Convert to array-of-objects with the first row as headers
        const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
            defval: '',
            raw: false, // everything as strings so date/number handling is consistent
        });

        if (rows.length === 0) return [];

        const headers = Object.keys(rows[0]);
        const colMap = detectColumns(headers);

        if (!colMap) {
            throw new Error(
                `Unrecognised Excel column layout. Headers: ${headers.join(', ')}`,
            );
        }

        const transactions: ParsedTransaction[] = [];

        for (const row of rows) {
            const rawDate = row[colMap.dateCol]?.trim();
            if (!rawDate) continue;

            let amount: number;
            if (colMap.amountCol) {
                amount = parseFloat((row[colMap.amountCol] ?? '').replace(/[^0-9.\-]/g, '')) || 0;
            } else {
                amount = normaliseAmount(
                    row[colMap.debitCol!]?.trim() ?? '',
                    row[colMap.creditCol!]?.trim() ?? '',
                );
            }

            if (amount === 0) continue;

            let transactionDate: string;
            try {
                transactionDate = normaliseDate(rawDate);
            } catch {
                continue;
            }

            const description = row[colMap.descriptionCol]?.trim() ?? '';
            const merchant = colMap.merchantCol ? row[colMap.merchantCol]?.trim() : undefined;

            transactions.push({ transactionDate, amount, description, merchant });
        }

        return transactions;
    }
}
