/**
 * Axis, grid and tooltip colours for the recharts wrappers.
 *
 * Recharts takes these as inline style objects rather than class names, so a
 * chart cannot pick them up from CSS the way the rest of the app does. Two
 * palettes exist because two pages genuinely look different: the themed pages
 * read the design tokens and follow light/dark, while the competitor detail
 * page is still hardcoded dark from its original build. Naming that difference
 * here keeps it in one place instead of repeated at six chart call sites.
 */
export interface ChartPalette {
    axisStroke: string;
    axisLine: string;
    tickFill: string;
    tickFontSize: number;
    tooltipBg: string;
    tooltipBorder: string;
    tooltipText: string;
    /** Fill for an activeDot's outline, so it reads against the card behind it. */
    dotStroke: string;
}

/** Follows the theme. Use this for anything new. */
export const TOKEN_PALETTE: ChartPalette = {
    axisStroke: 'var(--border-color)',
    axisLine: 'var(--border-color)',
    tickFill: 'var(--text-secondary)',
    tickFontSize: 11,
    tooltipBg: 'var(--card-bg)',
    tooltipBorder: '1px solid var(--border-color)',
    tooltipText: 'var(--text-primary)',
    dotStroke: 'var(--card-bg)',
};

/** The competitor detail page's fixed dark palette, preserved verbatim. */
export const ZINC_PALETTE: ChartPalette = {
    axisStroke: '#52525b',
    axisLine: '#3f3f46',
    tickFill: '#a1a1aa',
    tickFontSize: 12,
    tooltipBg: '#18181b',
    tooltipBorder: '1px solid rgba(255,255,255,0.1)',
    tooltipText: '#fff',
    dotStroke: 'none',
};
