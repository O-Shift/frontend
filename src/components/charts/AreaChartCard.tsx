'use client';
import {
    AreaChart,
    Area,
    Tooltip,
    ResponsiveContainer,
    XAxis,
    YAxis,
    CartesianGrid,
} from 'recharts';
import type { ChartPalette } from './palette';

/**
 * A single-series gradient area chart, used by the dashboard's analytics panel.
 *
 * Split out for the same reason as LineChartCard: it puts recharts behind one
 * component boundary so the route can lazy-load it. See that file for why the
 * primitives cannot be wrapped individually, and why `data` is generic.
 */
export default function AreaChartCard<T>({
    data,
    dataKey,
    xKey,
    color,
    palette,
    gradientId,
    /** Grid and Y axis appear only on the expanded chart, as before. */
    showAxes,
}: {
    data: T[];
    dataKey: string;
    xKey: string;
    color: string;
    palette: ChartPalette;
    gradientId: string;
    showAxes: boolean;
}) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                </defs>
                {showAxes && (
                    <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke={palette.axisStroke}
                        opacity={0.6}
                    />
                )}
                <XAxis
                    dataKey={xKey}
                    stroke={palette.axisStroke}
                    tick={{ fill: palette.tickFill, fontSize: palette.tickFontSize }}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                />
                {showAxes && (
                    <YAxis
                        stroke={palette.axisStroke}
                        tick={{ fill: palette.tickFill, fontSize: palette.tickFontSize }}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                    />
                )}
                <Tooltip
                    contentStyle={{
                        backgroundColor: 'var(--bg-main-alt)',
                        border: palette.tooltipBorder,
                        borderRadius: '6px',
                        color: palette.tooltipText,
                        boxShadow: 'none',
                    }}
                    itemStyle={{ color, fontWeight: 500 }}
                    cursor={{ stroke: palette.axisStroke, strokeWidth: 1 }}
                />
                <Area
                    type="linear"
                    dataKey={dataKey}
                    stroke={color}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill={`url(#${gradientId})`}
                    activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
                    dot={{ r: 3, fill: color, strokeWidth: 0 }}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}
