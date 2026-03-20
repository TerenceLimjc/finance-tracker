import { useState } from 'react';
import { Tag, Space, Typography, Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import type { SpenderSpending } from '@/types/transaction';
import { useFilterStore } from '@/store/filterStore';

const { Text } = Typography;

const SPENDER_PALETTE = ['#7b61ff', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffd29d', '#dda0dd', '#98d8c8'];

function getSpenderColor(index: number): string {
    return SPENDER_PALETTE[index % SPENDER_PALETTE.length];
}

interface Props {
    data: SpenderSpending[];
    isLoading?: boolean;
}

// ─── SVG Pie helpers ──────────────────────────────────────────────────────────

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function slicePath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
    const clampedEnd = endAngle - startAngle >= 360 ? startAngle + 359.9999 : endAngle;
    const start = polarToCartesian(cx, cy, r, clampedEnd);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const large = clampedEnd - startAngle > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${large} 0 ${end.x} ${end.y} Z`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SpenderPieChart({ data, isLoading = false }: Props) {
    const activeSpender = useFilterStore((s) => s.activeSpender);
    const toggleSpender = useFilterStore((s) => s.toggleSpender);

    const [hoveredName, setHoveredName] = useState<string | null>(null);
    const [tooltip, setTooltip] = useState<{ x: number; y: number; spender: SpenderSpending } | null>(null);

    const sortedData = [...data].sort((a, b) => b.total - a.total);
    const total = sortedData.reduce((sum, d) => sum + d.total, 0);

    const SIZE = 260;
    const cx = SIZE / 2;
    const cy = SIZE / 2;
    const R = SIZE / 2 - 10;

    let cursor = 0;
    const slices = sortedData.map((spender, idx) => {
        const sweep = total > 0 ? (spender.total / total) * 360 : 0;
        const start = cursor;
        cursor += sweep;
        return { spender, start, end: cursor, color: getSpenderColor(idx) };
    });

    const hoveredSpender = sortedData.find((d) => d.spenderName === hoveredName);

    return (
        <div>
            <div style={{ display: 'flex', gap: 24, alignItems: 'center', justifyContent: 'center' }}>

                {/* ── SVG Pie ── */}
                <div style={{ width: SIZE, flexShrink: 0, position: 'relative' }}>
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
                        onMouseLeave={() => { setHoveredName(null); setTooltip(null); }}
                    >
                        {slices.map(({ spender, start, end, color }) => {
                            const isActive = activeSpender === spender.spenderName;
                            const isFiltered = activeSpender !== null && !isActive;
                            const isHovered = hoveredName === spender.spenderName;
                            const scale = isHovered || isActive ? 1.04 : 1;

                            return (
                                <path
                                    key={spender.spenderName}
                                    d={slicePath(cx, cy, R, start, end)}
                                    fill={color}
                                    opacity={isFiltered ? 0.25 : 1}
                                    stroke="#fff"
                                    strokeWidth={slices.length === 1 ? 0 : 2}
                                    style={{
                                        transformOrigin: `${cx}px ${cy}px`,
                                        transform: `scale(${scale})`,
                                        transition: 'transform 0.15s, opacity 0.2s',
                                        cursor: 'pointer',
                                    }}
                                    onClick={() => toggleSpender(spender.spenderName)}
                                    onMouseEnter={(e) => {
                                        setHoveredName(spender.spenderName);
                                        const rect = (e.currentTarget.closest('svg') as SVGSVGElement).getBoundingClientRect();
                                        setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, spender });
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
                    {tooltip && hoveredSpender && (
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
                            <div style={{ fontWeight: 600 }}>{hoveredSpender.spenderName}</div>
                            <div>${hoveredSpender.total.toFixed(2)}&nbsp;·&nbsp;{hoveredSpender.percentage.toFixed(1)}%</div>
                        </div>
                    )}
                </div>

                {/* ── Custom legend ── */}
                <div style={{ width: 220 }}>
                    {slices.map(({ spender, color }) => {
                        const isActive = activeSpender === spender.spenderName;
                        const isFiltered = activeSpender !== null && !isActive;
                        return (
                            <div
                                key={spender.spenderName}
                                onClick={() => toggleSpender(spender.spenderName)}
                                onMouseEnter={() => setHoveredName(spender.spenderName)}
                                onMouseLeave={() => setHoveredName(null)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    padding: '6px 8px',
                                    borderRadius: 6,
                                    cursor: 'pointer',
                                    opacity: isFiltered ? 0.3 : 1,
                                    background: isActive ? '#f9f0ff' : 'transparent',
                                    transition: 'all 0.15s',
                                    marginBottom: 4,
                                }}
                            >
                                <span style={{
                                    display: 'inline-block',
                                    width: 12, height: 12,
                                    borderRadius: '50%',
                                    background: color,
                                    flexShrink: 0,
                                }} />
                                <Text style={{ flex: 1, fontSize: 13 }}>{spender.spenderName}</Text>
                                <Text strong style={{ fontFamily: 'monospace', fontSize: 13, marginRight: 6 }}>
                                    ${spender.total.toFixed(2)}
                                </Text>
                                <Tag color="default" style={{ margin: 0, fontSize: 12, minWidth: 48, textAlign: 'center' }}>
                                    {spender.percentage.toFixed(1)}%
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
            {activeSpender !== null && (
                <Space style={{ marginTop: 8 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Filtering by:</Text>
                    <Tag
                        closable
                        onClose={() => toggleSpender(activeSpender)}
                        color="purple"
                    >
                        {activeSpender}
                    </Tag>
                </Space>
            )}
        </div>
    );
}
