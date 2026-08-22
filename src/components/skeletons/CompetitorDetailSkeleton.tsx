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
                }}
            >
                {/* Header Section: logo + name on the left, Market Val / Industry text on the right */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20, marginBottom: 50 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                        <Skeleton variant="card" width={88} height={88} style={{ borderRadius: 20 }} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <Skeleton variant="line" width={260} height={36} />
                            <Skeleton variant="line-sm" width={180} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
                        <Skeleton variant="line-sm" width={220} height={20} />
                        <Skeleton variant="line-sm" width={200} height={20} />
                    </div>
                </div>

                {/* Description & Trigger Scrape box */}
                <div style={{
                    border: '1px solid var(--border-color)',
                    padding: 40,
                    borderRadius: 16,
                    marginBottom: 60,
                    background: 'var(--card-bg)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 24,
                }}>
                    <div style={{ flex: 1, maxWidth: 700 }}>
                        <Skeleton variant="text-block" lines={3} />
                    </div>
                    <Skeleton variant="card" width={150} height={42} style={{ borderRadius: 10, flexShrink: 0 }} />
                </div>

                {/* Time-Series Charts Section: 3-column grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 48, marginBottom: 80 }}>
                    {[1, 2, 3].map((i) => (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <Skeleton variant="line-sm" width={140} />
                            <Skeleton variant="chart" height={180} />
                        </div>
                    ))}
                </div>

                {/* Carousel grid of cards (auto-fill, minmax 280px) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
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
                            <Skeleton variant="line" width="75%" height={18} />
                            <Skeleton variant="text-block" lines={2} />
                            <Skeleton variant="line-sm" width="45%" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
