import { create } from 'zustand';
import type { Upload } from '@/types/upload';

interface UploadState {
  /** Uploads currently being tracked in-progress */
  processingUploads: Upload[];
  /** Whether the processing banner should be shown on Dashboard */
  showProcessingBanner: boolean;
  /** The filename shown in the processing banner */
  processingFilename: string | null;

  setProcessingUploads: (uploads: Upload[]) => void;
  dismissBanner: () => void;
}

export const useUploadStore = create<UploadState>((set) => ({
  processingUploads: [],
  showProcessingBanner: false,
  processingFilename: null,

  setProcessingUploads: (uploads) => {
    const processing = uploads.filter((u) => u.processingStatus === 'processing');
    set({
      processingUploads: processing,
      showProcessingBanner: processing.length > 0,
      processingFilename: processing[0]?.originalFilename ?? null,
    });
  },

  dismissBanner: () => set({ showProcessingBanner: false }),
}));
