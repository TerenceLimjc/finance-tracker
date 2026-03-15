import { Button, Select, Space } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useFilterStore } from '@/store/filterStore';
import { formatMonth } from '@/utils/formatters';

// Build a list of the last 24 months for the dropdown
function buildMonthOptions() {
    const options = [];
    for (let i = 0; i < 24; i++) {
        const m = dayjs().subtract(i, 'month').format('YYYY-MM');
        options.push({ value: m, label: formatMonth(m) });
    }
    return options;
}

const MONTH_OPTIONS = buildMonthOptions();

export function MonthSelector() {
    const selectedMonth = useFilterStore((s) => s.selectedMonth);
    const setMonth = useFilterStore((s) => s.setMonth);
    const goToPrevMonth = useFilterStore((s) => s.goToPrevMonth);
    const goToNextMonth = useFilterStore((s) => s.goToNextMonth);

    const isCurrentMonth = selectedMonth === dayjs().format('YYYY-MM');

    return (
        <Space size={4}>
            <Button icon={<LeftOutlined />} size="small" onClick={goToPrevMonth} />
            <Select
                value={selectedMonth}
                onChange={setMonth}
                options={MONTH_OPTIONS}
                size="small"
                style={{ width: 150 }}
                popupMatchSelectWidth={false}
            />
            <Button
                icon={<RightOutlined />}
                size="small"
                onClick={goToNextMonth}
                disabled={isCurrentMonth}
            />
        </Space>
    );
}
