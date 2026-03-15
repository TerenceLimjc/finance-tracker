import { useState } from 'react';
import { Tag, Space, Typography, Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import type { CategorySpending } from '@/types/transaction';
import { useFilterStore } from '@/store/filterStore';
import { CATEGORY_COLORS } from '@/styles/theme';

const { Text } = Typography;

interface Props {
    data: CategorySpending[];
    isLoading?: boolean;
}

// ─── SVG Pie helpers ──────────────────────────────────────────────────────────

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function slicePath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const large = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${large} 0 ${end.x} ${end.y} Z`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CategoryPieChart({ data, isLoading = false }: Props) {
    const activeCategoryId = useFilterStore((s) => s.activeCategoryId);
    const toggleCategory = useFilterStore((s) => s.toggleCategory);

    const [hoveredId, setHoveredId] = useState<number | null>(null);
    const [tooltip, setTooltip] = useState<{ x: number; y: number; cat: CategorySpending } | null>(null);

    // Sort descending by spend amount so largest slice starts at the top
    const sortedData = [...data].sort((a, b) => Math.abs(b.total) - Math.abs(a.total));

    const total = sortedData.reduce((sum, d) => sum + Math.abs(d.total), 0);
    const SIZE = 260;
    const cx = SIZE / 2;
    const cy = SIZE / 2;
    const R = SIZE / 2 - 10;

    let cursor = 0;
    const slices = sortedData.map((cat) => {
        const sweep = total > 0 ? (Math.abs(cat.total) / total) * 360 : 0;
        const start = cursor;
        cursor += sweep;
        return { cat, start, end: cursor };
    });

    const hoveredCat = sortedData.find((d) => d.categoryId === hoveredId);

    return (
        <div>
            <div style={{ display: 'flex', gap: 24, alignItems: 'center', justifyContent: 'center' }}>

                {/* ── SVG Pie ── */}
                <div style={{ width: SIZE, flexShrink: 0, position: 'relative' }}>
                    {/* Loading overlay — shown while transactions are refetching after a category click */}
                    {isLoading && (
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(255,255,255,0.7)',
                            borderRadius: '50%',
                            zIndex: 5,
                        }}>
                            <Spin indicator={<LoadingOutlined style={{ fontSize: 28 }} spin />} />
                        </div>
                    )}
                    <svg
                        width={SIZE}
                        height={SIZE}
                        style={{ display: 'block', cursor: 'pointer' }}
                        onMouseLeave={() => { setHoveredId(null); setTooltip(null); }}
                    >
                        {slices.map(({ cat, start, end }) => {
                            const isActive = activeCategoryId === cat.categoryId;
                            const isFiltered = activeCategoryId !== null && !isActive;
                            const isHovered = hoveredId === cat.categoryId;
                            const color = CATEGORY_COLORS[cat.categoryName] ?? '#d9d9d9';
                            const scale = isHovered || isActive ? 1.04 : 1;

                            return (
                                <path
                                    key={cat.categoryId}
                                    d={slicePath(cx, cy, R, start, end)}
                                    fill={color}
                                    opacity={isFiltered ? 0.25 : 1}
                                    stroke="#fff"
                                    strokeWidth={2}
                                    style={{
                                        transformOrigin: `${cx}px ${cy}px`,
                                        transform: `scale(${scale})`,
                                        transition: 'transform 0.15s, opacity 0.2s',
                                        cursor: 'pointer',
                                    }}
                                    onClick={() => toggleCategory(cat.categoryId)}
                                    onMouseEnter={(e) => {
                                        setHoveredId(cat.categoryId);
                                        const rect = (e.currentTarget.closest('svg') as SVGSVGElement).getBoundingClientRect();
                                        setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, cat });
                                    }}
                                    onMouseMove={(e) => {
                                        const rect = (e.currentTarget.closest('svg') as SVGSVGElement).getBoundingClientRect();
                                        setTooltip((prev) => prev ? { ...prev, x: e.clientX - rect.left, y: e.clientY - rect.top } : prev);
                                    }}
                                />
                            );
                        })}
                    </svg>

                    {/* Floating tooltip */}
                    {tooltip && hoveredCat && (
                        <div style={{
                            position: 'absolute',
                            left: tooltip.x + 12,
                            top: tooltip.y - 10,
                            background: 'rgba(0,0,0,0.78)',
                            color: '#fff',
                            padding: '5px 10px',
                            borderRadius: 6,
                            fontSize: 12,
                            pointerEvents: 'none',
                            whiteSpace: 'nowrap',
                            zIndex: 10,
                        }}>
                            <div style={{ fontWeight: 600 }}>{hoveredCat.categoryName}</div>
                            <div>${Math.abs(hoveredCat.total).toFixed(2)}&nbsp;·&nbsp;{hoveredCat.percentage.toFixed(1)}%</div>
                        </div>
                    )}
                </div>

                {/* ── Custom legend ── */}
                <div style={{ width: 280 }}>
                    {sortedData.map((cat) => {
                        const isActive = activeCategoryId === cat.categoryId;
                        const isFiltered = activeCategoryId !== null && !isActive;
                        return (
                            <div
                                key={cat.categoryId}
                                onClick={() => toggleCategory(cat.categoryId)}
                                onMouseEnter={() => setHoveredId(cat.categoryId)}
                                onMouseLeave={() => setHoveredId(null)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    padding: '6px 8px',
                                    borderRadius: 6,
                                    cursor: 'pointer',
                                    opacity: isFiltered ? 0.3 : 1,
                                    background: isActive ? '#f0f5ff' : 'transparent',
                                    transition: 'all 0.15s',
                                    marginBottom: 4,
                                }}
                            >
                                <span style={{
                                    display: 'inline-block',
                                    width: 12, height: 12,
                                    borderRadius: '50%',
                                    background: CATEGORY_COLORS[cat.categoryName] ?? '#d9d9d9',
                                    flexShrink: 0,
                                }} />
                                <Text style={{ flex: 1, fontSize: 13 }}>{cat.categoryName}</Text>
                                <Text strong style={{ fontFamily: 'monospace', fontSize: 13, marginRight: 6 }}>
                                    ${Math.abs(cat.total).toFixed(2)}
                                </Text>
                                <Tag color="default" style={{ margin: 0, fontSize: 12, minWidth: 48, textAlign: 'center' }}>
                                    {cat.percentage.toFixed(1)}%
                                </Tag>
                            </div>
                        );
                    })}
                    <Text type="secondary" style={{ fontSize: 12, paddingLeft: 8, marginTop: 8, display: 'block' }}>
                        Click a slice or row to filter transactions
                    </Text>
                </div>
            </div>

            {/* Active filter tag */}
            {activeCategoryId !== null && (
                <Space style={{ marginTop: 8 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Filtering by:</Text>
                    {data.filter(c => c.categoryId === activeCategoryId).map(c => (
                        <Tag
                            key={c.categoryId}
                            closable
                            onClose={() => toggleCategory(c.categoryId)}
                            color="blue"
                        >
                            {c.categoryName}
                        </Tag>
                    ))}
                </Space>
            )}
        </div>
    );
}
