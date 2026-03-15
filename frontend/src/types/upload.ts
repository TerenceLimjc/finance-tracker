// Type definitions for Upload domain

export type UploadStatus = 'pending' | 'processing' | 'done' | 'failed';

export interface Upload {
  id: number;
  filename: string;
  originalFilename: string;
  fileSize: number;
  fileType: string;
  uploadDate: string;      // ISO datetime string
  processingStatus: UploadStatus;
  transactionCount: number;
  dateRangeStart: string | null;
  dateRangeEnd: string | null;
  bankInfo: string | null;
  isDuplicate: boolean;    // true if date range overlaps existing upload
  errorMessage: string | null;
}

export interface UploadHistoryFilters {
  status?: UploadStatus;
  page: number;
  pageSize: number;
}

export interface UploadHistoryPage {
  data: Upload[];
  total: number;
}
