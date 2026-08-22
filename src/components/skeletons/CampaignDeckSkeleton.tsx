import Skeleton from '@/components/Skeleton';

export default function CampaignDeckSkeleton() {
    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 99999,
                background: '#0a0a0c',
                userSelect: 'none',
                overflow: 'hidden',
            }}
        >
            {/* Progress bars: full width along the top, like the deck chrome */}
            <div style={{ position: 'absolute', top: 24, left: 24, right: 24, display: 'flex', gap: 8, zIndex: 100000 }}>
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} style={{ flex: 1, height: 4, background: 'rgba(10,10,10,0.15)', borderRadius: 2, overflow: 'hidden' }} />
                ))}
            </div>

            {/* Close button: circular, top right */}
            <div
                style={{
                    position: 'absolute',
                    top: 40,
                    right: 24,
                    zIndex: 100000,
                    padding: 10,
                    background: 'rgba(10,10,10,0.06)',
                    borderRadius: '50%',
                }}
            >
                <Skeleton variant="circle" size={22} style={{ background: 'rgba(10,10,10,0.2)' }} />
            </div>

            {/* Slide surface: the deck slides render on a cream background */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: '#f3eedf',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    padding: '120px 8% 6% 8%',
                }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 840 }}>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <Skeleton variant="card" width={100} height={24} style={{ borderRadius: 12, background: '#e2d7bd' }} />
                        <Skeleton variant="card" width={80} height={24} style={{ borderRadius: 12, background: '#e2d7bd' }} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <Skeleton variant="line" width="85%" height={44} style={{ borderRadius: 8, background: '#e2d7bd' }} />
                        <Skeleton variant="line" width="55%" height={44} style={{ borderRadius: 8, background: '#e2d7bd' }} />
                    </div>

                    <Skeleton variant="line-sm" width="45%" style={{ background: '#e2d7bd' }} />

                    {/* Metric cards row, as on the metrics slide */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 30, marginTop: 32, maxWidth: 1050 }}>
                        {[1, 2, 3, 4].map((i) => (
                            <div
                                key={i}
                                style={{
                                    padding: 20,
                                    borderRadius: 8,
                                    background: '#ffffff',
                                    boxShadow: '0 15px 35px rgba(0,0,0,0.06)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 10,
                                }}
                            >
                                <Skeleton variant="line-sm" width="50%" style={{ background: '#eee5d2' }} />
                                <Skeleton variant="line" width="70%" height={26} style={{ background: '#eee5d2' }} />
                                <Skeleton variant="line-sm" width="85%" style={{ background: '#eee5d2' }} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
