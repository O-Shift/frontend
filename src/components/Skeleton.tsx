import React from 'react';

interface SkeletonProps {
    variant?: 'line' | 'line-sm' | 'circle' | 'card' | 'text-block' | 'chart';
    width?: string | number;
    height?: string | number;
    size?: number; // for circle
    lines?: number; // for text-block
    className?: string;
    style?: React.CSSProperties;
}

export default function Skeleton({
    variant = 'line',
    width,
    height,
    size,
    lines = 3,
    className = '',
    style = {},
}: SkeletonProps) {
    const base = 'skeleton';

    if (variant === 'circle') {
        const s = size ?? 40;
        return (
            <div
                className={`${base} skeleton-circle ${className}`}
                style={{ width: s, height: s, ...style }}
            />
        );
    }

    if (variant === 'text-block') {
        const widths = ['100%', '85%', '70%', '90%', '60%'];
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, ...style }}>
                {Array.from({ length: lines }).map((_, i) => (
                    <div
                        key={i}
                        className={`${base} skeleton-line ${className}`}
                        style={{ width: widths[i % widths.length] }}
                    />
                ))}
            </div>
        );
    }

    if (variant === 'chart') {
        return (
            <div
                className={`${base} skeleton-card ${className}`}
                style={{ width: width ?? '100%', height: height ?? 200, ...style }}
            />
        );
    }

    if (variant === 'card') {
        return (
            <div
                className={`${base} skeleton-card ${className}`}
                style={{ width: width ?? '100%', height: height ?? 120, ...style }}
            />
        );
    }

    // default: line / line-sm
    const lineClass = variant === 'line-sm' ? 'skeleton-line-sm' : 'skeleton-line';
    return (
        <div
            className={`${base} ${lineClass} ${className}`}
            style={{ width: width ?? '100%', height: height, ...style }}
        />
    );
}
