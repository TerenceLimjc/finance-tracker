import { Row, Col, Card, Statistic, Typography, Space, Input } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, SearchOutlined } from '@ant-design/icons';
import { ProcessingBanner } from '@/components/common/ProcessingBanner/ProcessingBanner';
import { EmptyDashboard } from '@/components/common/EmptyDashboard/EmptyDashboard';
import { MonthSelector } from '@/components/transactions/MonthSelector/MonthSelector';
import { CategoryPieChart } from '@/components/analytics/CategoryPieChart/CategoryPieChart';
import { TransactionTable } from '@/components/transactions/TransactionTable/TransactionTable';
import { useMonthlySummary, useTransactions } from '@/hooks/useTransactions';
import { useFilterStore } from '@/store/filterStore';

const { Title } = Typography;

export function DashboardPage() {
    const { data: summary } = useMonthlySummary();
    const { data: txPage, isFetching: txFetching } = useTransactions();
    const setSearchText = useFilterStore((s) => s.setSearchText);
    const searchText = useFilterStore((s) => s.searchText);

    // Only show empty state when we have a confirmed response with zero results,
    // not while a refetch is in flight (which would flash the empty screen)
    const isEmpty = !txFetching && (!txPage || txPage.total === 0);
    const changePositive = (summary?.changeAmount ?? 0) >= 0;

    return (
        <Space direction="vertical" size={16} style={{ display: 'flex' }}>
            <ProcessingBanner />

            {/* Header row: title + month selector + search */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <Space align="center" size={16}>
                    <Title level={4} style={{ margin: 0 }}>Monthly Review</Title>
                    <MonthSelector />
                </Space>
                <Input
                    prefix={<SearchOutlined />}
                    placeholder="Search transactions…"
                    allowClear
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    style={{ width: 240 }}
                />
            </div>

            {/* Summary stats */}
            {summary && (
                <Row gutter={16}>
                    <Col span={8}>
                        <Card size="small">
                            <Statistic
                                title="Total Spend"
                                value={Math.abs(summary.totalSpend)}
                                precision={2}
                                prefix="$"
                            />
                        </Card>
                    </Col>
                    <Col span={8}>
                        <Card size="small">
                            <Statistic
                                title="Transactions"
                                value={summary.transactionCount}
                            />
                        </Card>
                    </Col>
                    <Col span={8}>
                        <Card size="small">
                            <Statistic
                                title="vs Last Month"
                                value={Math.abs(summary.changePercent)}
                                precision={1}
                                suffix="%"
                                prefix={changePositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                                valueStyle={{ color: changePositive ? '#cf1322' : '#3f8600' }}
                            />
                        </Card>
                    </Col>
                </Row>
            )}

            {isEmpty ? (
                <EmptyDashboard />
            ) : (
                <>
                    {/* Pie chart */}
                    {summary && summary.categories.length > 0 && (
                        <Card title="Spending by Category">
                            <CategoryPieChart data={summary.categories} isLoading={txFetching} />
                        </Card>
                    )}

                    {/* Transaction table */}
                    <TransactionTable />
                </>
            )}
        </Space>
    );
}
