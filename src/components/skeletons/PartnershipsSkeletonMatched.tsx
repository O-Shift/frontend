import Skeleton from '@/components/Skeleton';

// Matched skeleton for the Partnerships page.
// Mimics the fully-loaded UI layout: top-center glass filter dock
// (Graph View / Timeline segmented switch + category pills),
// a full-canvas dot-grid scatter node graph (rounded logo tile + label
// per partner), bottom-right zoom HUD, and the floating prompt bar.

const NODES = [
    { top: '16%', left: '46%', size: 48 },
    { top: '14%', right: '22%', size: 44 },
    { top: '27%', right: '26%', size: 44 },
    { top: '38%', right: '17%', size: 48 },
    { top: '42%', left: '20%', size: 44 },
    { top: '40%', right: '33%', size: 52 },
    { top: '58%', left: '40%', size: 48 },
    { top: '64%', left: '18%', size: 48 },
    { top: '66%', right: '18%', size: 48 },
    { top: '70%', right: '30%', size: 44 },
    { top: '76%', left: '34%', size: 48 },
    { top: '82%', right: '24%', size: 44 },
];

const CATEGORY_PILL_WIDTHS = [110, 148, 140, 132, 84];

export default function PartnershipsSkeletonMatched() {
    return (
        <div
            className="canvas-container"
            style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                // dot-grid canvas background, matching the loaded graph canvas
                backgroundImage:
                    'radial-gradient(circle, var(--border-color) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
            }}
        >
            {/* ── Top-Centered Glass Filter Dock ── */}
            <div
                style={{
                    position: 'absolute',
                    top: 20,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 30,
                    pointerEvents: 'none',
                }}
            >
                <div
                    className="glass-dock"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '3px 5px',
                        borderRadius: '999px',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {/* Segmented Graph View / Timeline switcher */}
                    <div className="glass-segmented" style={{ display: 'inline-flex', gap: 2 }}>
                        <Skeleton variant="card" width={104} height={24} style={{ borderRadius: 999 }} />
                        <Skeleton variant="card" width={78} height={24} style={{ borderRadius: 999 }} />
                    </div>

                    <div
                        style={{
                            width: 1,
                            height: 14,
                            background: 'var(--border-color)',
                            margin: '0 2px',
                            flexShrink: 0,
                        }}
                    />

                    {/* Category filter pills */}
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        {CATEGORY_PILL_WIDTHS.map((w, i) => (
                            <Skeleton
                                key={i}
                                variant="card"
                                width={w}
                                height={24}
                                style={{ borderRadius: 999 }}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Scatter Node Graph Mocks (logo tile + label, like loaded page) ── */}
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
                {NODES.map((n, i) => (
                    <div
                        key={i}
                        style={{
                            position: 'absolute',
                            top: n.top,
                            ...(n.left !== undefined ? { left: n.left } : {}),
                            ...(n.right !== undefined ? { right: n.right } : {}),
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 6,
                        }}
                    >
                        <Skeleton
                            variant="card"
                            width={n.size}
                            height={n.size}
                            style={{ borderRadius: Math.round(n.size * 0.28) }}
                        />
                        <Skeleton variant="line-sm" width={Math.round(n.size * 1.5)} height={8} />
                    </div>
                ))}
            </div>

            {/* ── Bottom-Right Zoom & View HUD ── */}
            <div
                className="bottom-right-controls"
                style={{
                    position: 'absolute',
                    bottom: 24,
                    right: 24,
                    zIndex: 30,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                }}
            >
                <div
                    className="glass-dock"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        borderRadius: '999px',
                        padding: '3px 4px',
                        gap: 2,
                    }}
                >
                    <Skeleton variant="circle" size={26} />
                    <div
                        style={{
                            width: 1,
                            height: 14,
                            background: 'var(--border-color)',
                            margin: '0 2px',
                        }}
                    />
                    <Skeleton variant="circle" size={26} />
                </div>
                <Skeleton
                    variant="card"
                    width={72}
                    height={32}
                    style={{ borderRadius: 999, display: 'block' }}
                />
            </div>

            {/* ── Floating PromptField Command Bar ── */}
            <div
                style={{
                    position: 'absolute',
                    bottom: 28,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 30,
                    width: '100%',
                    maxWidth: 640,
                    padding: '0 16px',
                    boxSizing: 'border-box',
                }}
            >
                <div
                    className="glass-dock"
                    style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        height: 52,
                        borderRadius: 999,
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 20px',
                        gap: 12,
                    }}
                >
                    <Skeleton variant="circle" size={24} />
                    <Skeleton variant="line" width="55%" height={14} />
                    <div style={{ flex: 1 }} />
                    <Skeleton variant="circle" size={28} />
                </div>
            </div>
        </div>
    );
}
