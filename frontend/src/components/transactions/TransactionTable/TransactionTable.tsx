import { Table, Select, Tag, Space, Typography, Popconfirm, Button } from 'antd';
import type { TableProps } from 'antd';
import type { Transaction } from '@/types/transaction';
import { useTransactions, useUpdateCategory, useDeleteTransaction } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { useFilterStore } from '@/store/filterStore';
import { formatDate, formatAmount } from '@/utils/formatters';
import { CATEGORY_COLORS } from '@/styles/theme';

const { Text } = Typography;

export function TransactionTable() {
    const { data, isLoading, isFetching } = useTransactions();
    const { data: categories = [] } = useCategories();
    const { mutate: updateCategory } = useUpdateCategory();
    const { mutate: deleteTransaction } = useDeleteTransaction();

    const activeCategoryId = useFilterStore((s) => s.activeCategoryId);
    const setActiveCategory = useFilterStore((s) => s.setActiveCategory);
    const page = useFilterStore((s) => s.page);
    const pageSize = useFilterStore((s) => s.pageSize);
    const setPage = useFilterStore((s) => s.setPage);
    const setSort = useFilterStore((s) => s.setSort);

    const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }));

    const columns: TableProps<Transaction>['columns'] = [
        {
            title: 'Cat',
            dataIndex: 'categoryId',
            key: 'category',
            width: 140,
            render: (_: unknown, record: Transaction) => (
                <Select
                    size="small"
                    value={record.categoryId ?? undefined}
                    options={categoryOptions}
                    onChange={(val: number) => updateCategory({ transactionId: record.id, categoryId: val })}
                    style={{ width: 130 }}
                    placeholder="Uncategorised"
                    variant="borderless"
                    suffixIcon={
                        record.categoryName ? (
                            <span
                                style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    background: CATEGORY_COLORS[record.categoryName] ?? '#d9d9d9',
                                    display: 'inline-block',
                                }}
                            />
                        ) : undefined
                    }
                />
            ),
        },
        {
            title: 'Spender',
            dataIndex: 'cardholderName',
            key: 'cardholderName',
            width: 130,
            ellipsis: true,
            render: (val: string | null) => <Text type="secondary">{val ?? '—'}</Text>,
        },
        {
            title: 'Date',
            dataIndex: 'transactionDate',
            key: 'transactionDate',
            width: 100,
            sorter: true,
            render: (val: string) => <Text>{formatDate(val)}</Text>,
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
            render: (val: string) => <Text>{val}</Text>,
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            width: 110,
            align: 'right' as const,
            sorter: true,
            render: (val: number) => (
                <Text
                    style={{
                        fontFamily: 'monospace',
                        color: val < 0 ? '#cf1322' : '#389e0d',
                    }}
                >
                    {formatAmount(val)}
                </Text>
            ),
        },
        {
            title: '',
            key: 'actions',
            width: 40,
            render: (_: unknown, record: Transaction) => (
                <Popconfirm
                    title="Delete this transaction?"
                    onConfirm={() => deleteTransaction(record.id)}
                    okText="Delete"
                    okButtonProps={{ danger: true }}
                    cancelText="Cancel"
                >
                    <Button type="text" size="small" danger icon={<span style={{ fontSize: 12 }}>✕</span>} />
                </Popconfirm>
            ),
        },
    ];

    return (
        <div>
            {/* Filter tag */}
            <Space style={{ marginBottom: 8 }}>
                <Text strong>Transactions</Text>
                {activeCategoryId !== null && (
                    <Tag
                        closable
                        onClose={() => setActiveCategory(null)}
                        color="blue"
                    >
                        {categories.find((c) => c.id === activeCategoryId)?.name ?? 'Category'}
                    </Tag>
                )}
            </Space>

            <Table<Transaction>
                dataSource={data?.data ?? []}
                columns={columns}
                rowKey="id"
                loading={isLoading || isFetching}
                size="small"
                scroll={{ y: 480 }}
                pagination={{
                    current: page,
                    pageSize,
                    total: data?.total ?? 0,
                    showSizeChanger: false,
                    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
                    onChange: (p) => setPage(p),
                }}
                onChange={(_pagination, _filters, sorter) => {
                    const s = Array.isArray(sorter) ? sorter[0] : sorter;
                    if (s?.columnKey === 'transactionDate') {
                        setSort('transactionDate', s.order === 'ascend' ? 'asc' : 'desc');
                    } else if (s?.columnKey === 'amount') {
                        setSort('amount', s.order === 'ascend' ? 'asc' : 'desc');
                    }
                }}
            />
        </div>
    );
}
