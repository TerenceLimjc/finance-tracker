import crypto from 'crypto';
import fs from 'fs';

/**
 * Compute the SHA-256 hash of a file.
 * Used for duplicate upload detection.
 */
export async function hashFile(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256');
        const stream = fs.createReadStream(filePath);
        stream.on('data', (chunk) => hash.update(chunk));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', reject);
    });
}

/**
 * Returns true if the two date ranges overlap.
 */
export function dateRangesOverlap(
    startA: string,
    endA: string,
    startB: string,
    endB: string,
): boolean {
    return startA <= endB && endA >= startB;
}
