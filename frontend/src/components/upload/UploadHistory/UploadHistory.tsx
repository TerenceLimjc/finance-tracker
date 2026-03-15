import React from 'react';
import { Table, Tag, Button, Progress, Popconfirm, Space, Typography } from 'antd';
import { WarningOutlined } from '@ant-design/icons';
import type { TableProps } from 'antd';
import type { Upload } from '@/types/upload';
import { useUploads, useDeleteUpload } from '@/hooks/useUpload';
import { formatFileSize } from '@/utils/formatters';
import dayjs from 'dayjs';

const { Text } = Typography;

function StatusCell({ record }: { record: Upload }) {
    if (record.processingStatus === 'done') {
        return <Tag color="success">Done</Tag>;
    }
    if (record.processingStatus === 'failed') {
        return <Tag color="error">Failed</Tag>;
    }
    if (record.processingStatus === 'processing' || record.processingStatus === 'pending') {
        return <Progress percent={50} size="small" style={{ width: 100, margin: 0 }} />;
    }
    return null;
}

export function UploadHistory() {
    const { data, isLoading, refetch } = useUploads();
    const { mutate: deleteUpload } = useDeleteUpload();

    const [selectedRowKeys, setSelectedRowKeys] = React.useState<number[]>([]);

    const columns: TableProps<Upload>['columns'] = [
        {
            title: 'File Name',
            dataIndex: 'originalFilename',
            key: 'originalFilename',
            render: (val: string, record: Upload) => (
                <Space direction="vertical" size={0}>
                    <Text>{val}</Text>
                    {record.isDuplicate && (
                        <Tag icon={<WarningOutlined />} color="warning" style={{ fontSize: 11 }}>
                            Possible duplicate
                        </Tag>
                    )}
                </Space>
            ),
        },
        {
            title: 'Status',
            key: 'status',
            width: 130,
            render: (_: unknown, record: Upload) => <StatusCell record={record} />,
        },
        {
            title: 'Transactions',
            dataIndex: 'transactionCount',
            key: 'transactionCount',
            width: 110,
            align: 'right' as const,
            render: (val: number, record: Upload) =>
                record.processingStatus === 'done' ? val : <Text type="secondary">—</Text>,
        },
        {
            title: 'Size',
            dataIndex: 'fileSize',
            key: 'fileSize',
            width: 90,
            render: (val: number) => <Text type="secondary">{formatFileSize(val)}</Text>,
        },
        {
            title: 'Uploaded',
            dataIndex: 'uploadDate',
            key: 'uploadDate',
            width: 120,
            render: (val: string) => dayjs(val).format('MMM D, YYYY'),
        },
        {
            title: 'Action',
            key: 'action',
            width: 90,
            render: (_: unknown, record: Upload) => (
                <Popconfirm
                    title="Delete this upload?"
                    description="All associated transactions will be removed."
                    onConfirm={() => deleteUpload(record.id)}
                    okText="Delete"
                    okButtonProps={{ danger: true }}
                >
                    <Button size="small" danger>Delete</Button>
                </Popconfirm>
            ),
        },
    ];

    return (
        <div>
            <Space style={{ marginBottom: 8, justifyContent: 'space-between', width: '100%' }}>
                <Text strong>Upload History</Text>
                <Space>
                    {selectedRowKeys.length > 0 && (
                        <Popconfirm
                            title={`Delete ${selectedRowKeys.length} upload(s)?`}
                            description="All associated transactions will be removed."
                            onConfirm={() => {
                                selectedRowKeys.forEach((id) => deleteUpload(id));
                                setSelectedRowKeys([]);
                            }}
                            okText="Delete"
                            okButtonProps={{ danger: true }}
                        >
                            <Button danger size="small">Delete Selected ({selectedRowKeys.length})</Button>
                        </Popconfirm>
                    )}
                    <Button size="small" onClick={() => refetch()}>Refresh</Button>
                </Space>
            </Space>

            <Table<Upload>
                dataSource={data?.data ?? []}
                columns={columns}
                rowKey="id"
                loading={isLoading}
                size="small"
                rowSelection={{
                    selectedRowKeys,
                    onChange: (keys) => setSelectedRowKeys(keys as number[]),
                }}
                pagination={false}
            />
        </div>
    );
}
