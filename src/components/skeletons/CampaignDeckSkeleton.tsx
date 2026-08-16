import Skeleton from '@/components/Skeleton';

export default function CampaignDeckSkeleton() {
    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 99999,
                background: '#0a0a0c',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '32px 40px',
                userSelect: 'none',
                overflow: 'hidden',
            }}
        >
            {/* Top segmented progress bars */}
            <div>
                <div style={{ display: 'flex', gap: 6, width: '100%', maxWidth: 1000, margin: '0 auto 24px auto' }}>
                    {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                        <div
                            key={i}
                            style={{
                                flex: 1,
                                height: 3,
                                borderRadius: 2,
                                background: i === 0 ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)',
                            }}
                        />
                    ))}
                </div>

                {/* Top header navigation bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: 1000, margin: '0 auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Skeleton variant="card" width={28} height={28} style={{ borderRadius: 6, background: '#1c1c20' }} />
                        <Skeleton variant="line-sm" width={140} style={{ background: '#26262b' }} />
                    </div>
                    <Skeleton variant="circle" size={32} style={{ background: '#1c1c20' }} />
                </div>
            </div>

            {/* Slide Hero Content Area */}
            <div style={{ maxWidth: 840, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div style={{ display: 'flex', gap: 10 }}>
                    <Skeleton variant="card" width={100} height={24} style={{ borderRadius: 12, background: '#26262b' }} />
                    <Skeleton variant="card" width={80} height={24} style={{ borderRadius: 12, background: '#26262b' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <Skeleton variant="line" width="90%" height={48} style={{ borderRadius: 8, background: '#26262b' }} />
                    <Skeleton variant="line" width="60%" height={48} style={{ borderRadius: 8, background: '#26262b' }} />
                </div>

                <Skeleton variant="line-sm" width="50%" style={{ background: '#26262b' }} />

                {/* Metric / Intelligence preview cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 16 }}>
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            style={{
                                padding: 20,
                                borderRadius: 16,
                                background: '#141417',
                                border: '1px solid rgba(255,255,255,0.08)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 10,
                            }}
                        >
                            <Skeleton variant="line-sm" width="50%" style={{ background: '#26262b' }} />
                            <Skeleton variant="line" width="75%" height={28} style={{ background: '#26262b' }} />
                            <Skeleton variant="line-sm" width="65%" style={{ background: '#26262b' }} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Slide Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: 1000, margin: '0 auto' }}>
                <Skeleton variant="line-sm" width={120} style={{ background: '#26262b' }} />
                <Skeleton variant="line-sm" width={80} style={{ background: '#26262b' }} />
            </div>
        </div>
    );
}
