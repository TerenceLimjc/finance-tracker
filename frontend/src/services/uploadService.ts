import { apiClient } from './apiClient';
import type { Upload, UploadHistoryPage } from '@/types/upload';

export const uploadService = {
    /**
     * Upload a bank statement file.
     * Returns the newly created Upload record.
     */
    async uploadFile(file: File): Promise<Upload> {
        const formData = new FormData();
        formData.append('file', file);
        const { data } = await apiClient.post('/uploads', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
    },

    /**
     * Fetch the paginated upload history.
     */
    async getUploads(page = 1, pageSize = 20): Promise<UploadHistoryPage> {
        const { data } = await apiClient.get('/uploads', { params: { page, pageSize } });
        return data;
    },

    /**
     * Delete an upload and all its associated transactions.
     */
    async deleteUpload(uploadId: number): Promise<void> {
        await apiClient.delete(`/uploads/${uploadId}`);
    },
};
