/**
 * UploadService
 *
 * Handles the full lifecycle of a bank statement upload:
 * 1. Save file to disk (encrypted)
 * 2. Compute file hash (duplicate detection)
 * 3. Insert uploads record with status = 'processing'
 * 4. Delegate to appropriate processor (PDF / CSV / Excel)
 * 5. Insert parsed transactions
 * 6. Update upload record with status = 'done' / 'failed'
 */
export class UploadService {
    // TODO: implement
}
