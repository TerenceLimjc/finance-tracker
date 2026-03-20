import { Row, Col, Card, Statistic, Typography, Space, Input } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, SearchOutlined } from '@ant-design/icons';
import { ProcessingBanner } from '@/components/common/ProcessingBanner/ProcessingBanner';
import { EmptyDashboard } from '@/components/common/EmptyDashboard/EmptyDashboard';
import { MonthSelector } from '@/components/transactions/MonthSelector/MonthSelector';
import { CategoryPieChart } from '@/components/analytics/CategoryPieChart/CategoryPieChart';
import { SpenderPieChart } from '@/components/analytics/SpenderPieChart/SpenderPieChart';
import { TransactionTable } from '@/components/transactions/TransactionTable/TransactionTable';
import { useMonthlySummary, useCategoryBreakdown, useSpenderBreakdown, useTransactions } from '@/hooks/useTransactions';
import { useFilterStore } from '@/store/filterStore';

const { Title } = Typography;

export function DashboardPage() {
    const { data: summary } = useMonthlySummary();
    const { data: txPage, isFetching: txFetching } = useTransactions();

    const activeCategoryId = useFilterStore((s) => s.activeCategoryId);
    const activeSpender = useFilterStore((s) => s.activeSpender);
    const setSearchText = useFilterStore((s) => s.setSearchText);
    const searchText = useFilterStore((s) => s.searchText);

    // Cross-filter: category chart scoped to active spender; spender chart scoped to active category
    const { data: categoryFiltered } = useCategoryBreakdown(activeSpender);
    const { data: spenderFiltered } = useSpenderBreakdown(activeCategoryId);

    const categoryChartData = (activeSpender !== null ? categoryFiltered?.categories : summary?.categories) ?? [];
    const spenderChartData = (activeCategoryId !== null ? spenderFiltered?.spenders : summary?.spenders) ?? [];

    // Derive contextual titles
    const activeCategoryName = summary?.categories.find((c) => c.categoryId === activeCategoryId)?.categoryName;
    const categoryChartTitle = activeSpender ? `Spending by Category · ${activeSpender}` : 'Spending by Category';
    const spenderChartTitle = activeCategoryName ? `Spending by Spender · ${activeCategoryName}` : 'Spending by Spender';

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
                    {/* Charts row: category + spender side by side */}
                    {summary && (categoryChartData.length > 0 || spenderChartData.length > 0) && (
                        <Row gutter={16} style={{ alignItems: 'stretch' }}>
                            {(summary.categories.length > 0 || categoryChartData.length > 0) && (
                                <Col span={spenderChartData.length > 0 || summary.spenders.length > 0 ? 12 : 24} style={{ display: 'flex', flexDirection: 'column' }}>
                                    <Card title={categoryChartTitle} style={{ flex: 1 }}>
                                        <CategoryPieChart data={categoryChartData} isLoading={txFetching} />
                                    </Card>
                                </Col>
                            )}
                            {(summary.spenders.length > 0 || spenderChartData.length > 0) && (
                                <Col span={summary.categories.length > 0 || categoryChartData.length > 0 ? 12 : 24} style={{ display: 'flex', flexDirection: 'column' }}>
                                    <Card title={spenderChartTitle} style={{ flex: 1 }}>
                                        <SpenderPieChart data={spenderChartData} isLoading={txFetching} />
                                    </Card>
                                </Col>
                            )}
                        </Row>
                    )}

                    {/* Transaction table */}
                    <TransactionTable />
                </>
            )}
        </Space>
    );
}
