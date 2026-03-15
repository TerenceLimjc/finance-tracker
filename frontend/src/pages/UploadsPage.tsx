import { Space, Typography } from 'antd';
import { UploadZone } from '@/components/upload/UploadZone/UploadZone';
import { UploadHistory } from '@/components/upload/UploadHistory/UploadHistory';

/**
 * UploadsPage
 *
 * Composes the file upload & management screen:
 *  - UploadZone (drag & drop)
 *  - UploadHistory table (status, duplicate detection, actions)
 *
 * All data is fetched via hooks; layout is driven by Ant Design Layout.
 */
export function UploadsPage() {
    return (
        <Space direction="vertical" size={16} style={{ display: 'flex' }}>
            <Typography.Title level={4} style={{ margin: 0 }}>
                File Upload &amp; Management
            </Typography.Title>
            <UploadZone />
            <UploadHistory />
        </Space>
    );
}
