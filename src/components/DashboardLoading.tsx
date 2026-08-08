import Skeleton from '@/components/Skeleton';

export default function DashboardLoading() {
    return (
        <div className="page-container">
            <div className="page-inner">
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 32 }}>
                    <Skeleton variant="circle" size={80} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                        <Skeleton variant="line" width="220px" height={32} />
                        <Skeleton variant="line-sm" width="160px" />
                    </div>
                </div>

                {/* Stats bar */}
                <div style={{ display: 'flex', gap: 0, marginBottom: 40, borderRadius: 'var(--card-radius)', overflow: 'hidden', boxShadow: 'var(--card-shadow)', background: 'var(--card-bg)' }}>
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} style={{ flex: 1, padding: '20px 24px', borderRight: i < 5 ? '1px solid var(--border-color)' : 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <Skeleton variant="line-sm" width="80px" />
                            <Skeleton variant="line" width="100px" height={26} />
                        </div>
                    ))}
                </div>

                {/* Opp + Performance panel */}
                <div style={{ display: 'flex', gap: 0, marginBottom: 40, borderRadius: 'var(--card-radius)', overflow: 'hidden', boxShadow: 'var(--card-shadow)', background: 'var(--card-bg)', minHeight: 240 }}>
                    <div style={{ flex: 2, padding: 24, borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <Skeleton variant="line" width="140px" height={18} />
                        {[1, 2, 3].map(i => <Skeleton key={i} variant="line" height={40} />)}
                    </div>
                    <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <Skeleton variant="line" width="120px" height={18} />
                        {[1, 2, 3].map(i => <Skeleton key={i} variant="line" height={40} />)}
                    </div>
                </div>

                {/* Chart */}
                <Skeleton variant="chart" height={300} style={{ marginBottom: 40 }} />

                {/* Campaign cards */}
                <div style={{ display: 'flex', gap: 16, marginBottom: 40 }}>
                    {[1, 2, 3].map(i => <Skeleton key={i} variant="card" height={180} style={{ flex: 1 }} />)}
                </div>

                {/* Review cards */}
                <Skeleton variant="line" width="180px" style={{ marginBottom: 16 }} />
                <div style={{ display: 'flex', gap: 16 }}>
                    {[1, 2, 3].map(i => <Skeleton key={i} variant="card" height={200} style={{ flex: 1 }} />)}
                </div>
            </div>
        </div>
    );
}
