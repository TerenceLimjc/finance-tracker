import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadService } from '@/services/uploadService';
import { useUploadStore } from '@/store/uploadStore';

/**
 * Fetches the upload history and keeps the upload store in sync.
 */
export function useUploads() {
    const setProcessingUploads = useUploadStore((s) => s.setProcessingUploads);

    return useQuery({
        queryKey: ['uploads'],
        queryFn: async () => {
            const result = await uploadService.getUploads();
            setProcessingUploads(result.data);
            return result;
        },
        // Poll every 5 s while a file is processing
        refetchInterval: (query) => {
            const hasProcessing = query.state.data?.data.some(
                (u) => u.processingStatus === 'processing' || u.processingStatus === 'pending',
            );
            return hasProcessing ? 5000 : false;
        },
    });
}

/**
 * Mutation to upload a new file.
 */
export function useUploadFile() {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: (file: File) => uploadService.uploadFile(file),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['uploads'] });
        },
    });
}

/**
 * Mutation to delete an upload (and cascade its transactions).
 */
export function useDeleteUpload() {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: (uploadId: number) => uploadService.deleteUpload(uploadId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['uploads'] });
            qc.invalidateQueries({ queryKey: ['transactions'] });
            qc.invalidateQueries({ queryKey: ['monthlySummary'] });
        },
    });
}
