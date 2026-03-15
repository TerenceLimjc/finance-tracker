/** Accepted file MIME types for bank statement upload */
export const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/x-ofx',
  'application/x-qif',
];

/** Accepted file extensions shown in the upload zone */
export const ACCEPTED_EXTENSIONS = 'PDF, CSV, Excel, OFX, QIF';

/** Maximum file size in bytes (50 MB) */
export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

/** Default rows per page in the transaction table */
export const DEFAULT_PAGE_SIZE = 25;

/** API base path */
export const API_BASE = '/api';

/** Backend polling interval in milliseconds when a file is processing */
export const PROCESSING_POLL_INTERVAL_MS = 5_000;
