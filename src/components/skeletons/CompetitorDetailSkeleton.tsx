import Skeleton from '@/components/Skeleton';

export default function CompetitorDetailSkeleton() {
    return (
        <div className="main-content" style={{ overflowY: 'auto', paddingBottom: 60, display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <div
                style={{
                    padding: '60px 40px',
                    maxWidth: 1100,
                    margin: '0 auto',
                    width: '100%',
                    position: 'relative',
                    zIndex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 40,
                }}
            >
                {/* Header Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                        <Skeleton variant="card" width={88} height={88} style={{ borderRadius: 20 }} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <Skeleton variant="line" width={260} height={36} />
                            <Skeleton variant="line-sm" width={180} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 12 }}>
                        <Skeleton variant="card" width={140} height={40} style={{ borderRadius: 8 }} />
                    </div>
                </div>

                {/* Description Paragraph */}
                <div style={{ maxWidth: 800 }}>
                    <Skeleton variant="text-block" lines={2} />
                </div>

                {/* 4 Stat Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
                    {[1, 2, 3, 4].map((i) => (
                        <div
                            key={i}
                            style={{
                                background: 'var(--card-bg)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 16,
                                padding: 24,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 12,
                            }}
                        >
                            <Skeleton variant="line-sm" width="60%" />
                            <Skeleton variant="line" width="80%" height={32} />
                            <Skeleton variant="line-sm" width="40%" />
                        </div>
                    ))}
                </div>

                {/* Metric Trend Charts Section */}
                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Skeleton variant="line" width={200} height={20} />
                        <div style={{ display: 'flex', gap: 8 }}>
                            <Skeleton variant="card" width={80} height={28} style={{ borderRadius: 6 }} />
                            <Skeleton variant="card" width={80} height={28} style={{ borderRadius: 6 }} />
                        </div>
                    </div>
                    <Skeleton variant="chart" height={280} />
                </div>

                {/* Competitive Advantage & Gaps Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <Skeleton variant="line" width={240} height={24} />
                    <div style={{ display: 'flex', gap: 20, overflow: 'hidden' }}>
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                style={{
                                    flex: 1,
                                    minWidth: 300,
                                    background: 'var(--card-bg)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: 16,
                                    padding: 24,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 12,
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Skeleton variant="card" width={70} height={20} style={{ borderRadius: 4 }} />
                                    <Skeleton variant="line-sm" width={50} />
                                </div>
                                <Skeleton variant="line" width="90%" height={18} />
                                <Skeleton variant="text-block" lines={2} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
