import { Alert } from 'antd';
import { useUploadStore } from '@/store/uploadStore';

/**
 * ProcessingBanner
 *
 * Yellow Alert banner shown on the Dashboard when a file is still being processed.
 * Auto-dismissed by the uploadStore when processing completes.
 * User can also manually close it with the [x] button.
 */
export function ProcessingBanner() {
  const { showProcessingBanner, processingFilename, dismissBanner } = useUploadStore();

  if (!showProcessingBanner || !processingFilename) return null;

  return (
    <Alert
      type="warning"
      showIcon
      closable
      onClose={dismissBanner}
      message={`${processingFilename} is still processing — data may be incomplete.`}
      style={{ marginBottom: 16 }}
    />
  );
}
