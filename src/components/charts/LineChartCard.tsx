'use client';
import { LineChart, Line, Tooltip, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import type { ChartPalette } from './palette';

/**
 * A single-series line chart.
 *
 * This exists as its own module so recharts lands in its own chunk: it is
 * 340 KB, it is used on three routes, and on all three it renders below the
 * fold inside a card the page has already drawn. The pages import it through
 * `next/dynamic`, which is only possible if the recharts elements live behind
 * one component boundary — wrapping the primitives individually would not work,
 * because recharts identifies its children by `displayName` and a lazy wrapper
 * does not carry one.
 *
 * `data` is generic rather than an index-signature type: callers pass named
 * interfaces like AggregatedMetricPoint, and TypeScript does not give those an
 * implicit index signature, so a `Record`-shaped prop would reject every real
 * call site.
 */
export default function LineChartCard<T>({
    data,
    dataKey,
    xKey,
    color,
    palette,
    xTickFormatter,
    dotRadius,
}: {
    data: T[];
    dataKey: string;
    xKey: string;
    color: string;
    palette: ChartPalette;
    xTickFormatter?: (value: string) => string;
    /** Omit for a line with no per-point dots. */
    dotRadius?: number;
}) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
                <XAxis
                    dataKey={xKey}
                    stroke={palette.axisStroke}
                    tickFormatter={xTickFormatter}
                    tick={{ fill: palette.tickFill, fontSize: palette.tickFontSize }}
                    tickLine={false}
                    axisLine={{ stroke: palette.axisLine }}
                />
                <YAxis
                    stroke={palette.axisStroke}
                    tick={{ fill: palette.tickFill, fontSize: palette.tickFontSize }}
                    tickLine={false}
                    axisLine={{ stroke: palette.axisLine }}
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: palette.tooltipBg,
                        border: palette.tooltipBorder,
                        borderRadius: 8,
                        color: palette.tooltipText,
                    }}
                    itemStyle={{ color }}
                />
                <Line
                    type="linear"
                    dataKey={dataKey}
                    stroke={color}
                    strokeWidth={2}
                    dot={dotRadius ? { r: dotRadius, fill: color, stroke: 'none' } : false}
                    activeDot={{ r: 4, fill: color, stroke: palette.dotStroke }}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}
