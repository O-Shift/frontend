import Skeleton from '@/components/Skeleton';

export default function SkeletonOverlay() {
    return (
        <div className="thinking-overlay" style={{
            position: 'absolute', inset: 0, zIndex: 50,
            display: 'flex', flexDirection: 'column', gap: 16,
            padding: 40, pointerEvents: 'none',
        }}>
            {/* Stat row */}
            <div style={{ display: 'flex', gap: 16 }}>
                <Skeleton variant="card" height={100} style={{ flex: 1 }} />
                <Skeleton variant="card" height={100} style={{ flex: 1 }} />
                <Skeleton variant="card" height={100} style={{ flex: 1 }} />
                <Skeleton variant="card" height={100} style={{ flex: 1 }} />
            </div>
            {/* Chart + side panel */}
            <div style={{ display: 'flex', gap: 16, flex: 1 }}>
                <Skeleton variant="chart" height={300} style={{ flex: 2 }} />
                <Skeleton variant="card" height={300} style={{ flex: 1 }} />
            </div>
            {/* Cards row */}
            <div style={{ display: 'flex', gap: 16 }}>
                <Skeleton variant="card" height={160} style={{ flex: 1 }} />
                <Skeleton variant="card" height={160} style={{ flex: 1 }} />
                <Skeleton variant="card" height={160} style={{ flex: 1 }} />
            </div>
        </div>
    );
}
