import { Upload, Typography, message } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { useUploadFile } from '@/hooks/useUpload';
import { ACCEPTED_EXTENSIONS, MAX_FILE_SIZE_BYTES } from '@/utils/constants';

const { Dragger } = Upload;
const { Text } = Typography;

export function UploadZone() {
    const { mutateAsync: uploadFile, isPending } = useUploadFile();

    return (
        <Dragger
            name="file"
            multiple={false}
            showUploadList={false}
            disabled={isPending}
            customRequest={async ({ file, onSuccess, onError }) => {
                try {
                    if (!(file instanceof File)) return;
                    if (file.size > MAX_FILE_SIZE_BYTES) {
                        message.error('File exceeds 50 MB limit.');
                        return;
                    }
                    await uploadFile(file);
                    message.success(`${file.name} uploaded successfully.`);
                    onSuccess?.({});
                } catch (err) {
                    message.error(`Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
                    onError?.(err instanceof Error ? err : new Error(String(err)));
                }
            }}
            style={{ padding: '24px 0' }}
        >
            <p className="ant-upload-drag-icon">
                <InboxOutlined style={{ fontSize: 48, color: '#1677ff' }} />
            </p>
            <p className="ant-upload-text">Drop files here or click to browse</p>
            <p className="ant-upload-hint">
                <Text type="secondary">Formats: {ACCEPTED_EXTENSIONS} &nbsp;·&nbsp; Max size: 50 MB per file</Text>
            </p>
        </Dragger>
    );
}
