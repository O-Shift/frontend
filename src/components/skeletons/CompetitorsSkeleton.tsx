import Skeleton from '@/components/Skeleton';

export default function CompetitorsSkeleton() {
    return (
        <div className="main-content" style={{ overflowY: 'auto', padding: '60px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '100%', maxWidth: 1000, marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <Skeleton variant="line" width={220} height={36} style={{ marginBottom: 12 }} />
                    <Skeleton variant="line-sm" width={320} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Skeleton variant="card" width={150} height={48} style={{ borderRadius: 6 }} />
                    <Skeleton variant="card" width={320} height={48} style={{ borderRadius: 16 }} />
                </div>
            </div>

            {/* Competitor cards grid */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                    gap: 32,
                    width: '100%',
                    maxWidth: 1000,
                }}
            >
                {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div
                        key={n}
                        style={{
                            height: 320,
                            borderRadius: 24,
                            background: 'var(--card-bg)',
                            border: '1px solid var(--border-color)',
                            padding: 24,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            boxShadow: '0 20px 40px var(--shadow-color)',
                            position: 'relative',
                            overflow: 'hidden',
                        }}
                    >
                        {/* Top action pill */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Skeleton variant="circle" size={28} />
                        </div>

                        {/* Bottom logo + info */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <Skeleton variant="card" width={56} height={56} style={{ borderRadius: 16 }} />
                            <Skeleton variant="line" width="75%" height={20} />
                            <Skeleton variant="line-sm" width="50%" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
