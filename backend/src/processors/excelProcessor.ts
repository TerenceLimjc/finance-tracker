import type { BaseProcessor, ParsedTransaction } from './baseProcessor';

/**
 * ExcelProcessor
 *
 * Uses the XLSX library to extract transactions from
 * .xls / .xlsx bank export files.
 */
export class ExcelProcessor implements BaseProcessor {
  async parse(_filePath: string): Promise<ParsedTransaction[]> {
    // TODO: implement — XLSX.readFile → sheet parsing → normalise rows
    return [];
  }
}
