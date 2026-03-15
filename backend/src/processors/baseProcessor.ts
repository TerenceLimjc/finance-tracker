/**
 * BaseProcessor interface.
 * All file processors (PDF, CSV, Excel) must implement this contract.
 */
export interface ParsedTransaction {
  transactionDate: string; // YYYY-MM-DD
  amount: number;
  description: string;
  merchant?: string;
}

export interface BaseProcessor {
  /**
   * Parse the file at the given path and return raw transaction rows.
   */
  parse(filePath: string): Promise<ParsedTransaction[]>;
}
