import fs from 'fs';
import Papa from 'papaparse';
import type { BaseProcessor, ParsedTransaction } from './baseProcessor';
import { detectColumns, normaliseDate, normaliseAmount } from './baseProcessor';

/**
 * CsvProcessor
 *
 * Uses Papa Parse to extract transactions from CSV exports.
 * Auto-detects common bank CSV column layouts via ML-1 detectColumns().
 */
export class CsvProcessor implements BaseProcessor {
    async parse(filePath: string): Promise<ParsedTransaction[]> {
        const content = fs.readFileSync(filePath, 'utf-8');

        const result = Papa.parse<Record<string, string>>(content, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (h) => h.trim(),
        });

        const { data } = result;
        const errors = result.errors;

        if (errors.length > 0 && data.length === 0) {
            throw new Error(`CSV parse error: ${errors[0].message}`);
        }

        if (data.length === 0) return [];

        const headers = Object.keys(data[0]);
        const colMap = detectColumns(headers);

        if (!colMap) {
            throw new Error(
                `Unrecognised CSV column layout. Headers: ${headers.join(', ')}. ` +
                `Expected one of: DBS (Transaction Date/Reference/Debit/Credit), ` +
                `OCBC (Date/Description/Withdrawals/Deposits), ` +
                `UOB (Transaction Date/Description/Debit Amount/Credit Amount).`,
            );
        }

        const transactions: ParsedTransaction[] = [];

        for (const row of data) {
            const rawDate = row[colMap.dateCol]?.trim();
            if (!rawDate) continue;

            let amount: number;
            if (colMap.amountCol) {
                const raw = row[colMap.amountCol]?.trim() ?? '';
                amount = parseFloat(raw.replace(/[^0-9.\-]/g, '')) || 0;
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
