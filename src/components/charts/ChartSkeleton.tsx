'use client';

/**
 * Fallback shown while a chart chunk loads.
 *
 * Charts sit in cards the page has already drawn with their own heading and
 * frame, so the missing piece is the plot, not the section. A pair of faint
 * baselines reads as "the chart is arriving" without claiming to show data —
 * anything resembling a plotted line would be inventing a shape.
 */
export default function ChartSkeleton() {
    return (
        <div className="chart-skeleton" aria-hidden="true">
            <div className="chart-skeleton-plot" />
            <div className="chart-skeleton-axis" />
        </div>
    );
}
