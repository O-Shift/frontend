import Skeleton from '@/components/Skeleton';

export default function SettingsSkeleton() {
    return (
        <div className="main-content" style={{ overflowY: 'auto', padding: '60px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '100%', maxWidth: 768, display: 'flex', flexDirection: 'column', gap: 32 }}>
                {/* Title */}
                <Skeleton variant="line" width={160} height={36} style={{ marginBottom: 8 }} />

                {/* General Group */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <Skeleton variant="line-sm" width={80} style={{ paddingLeft: 16 }} />
                    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <Skeleton variant="card" width={40} height={40} style={{ borderRadius: 8 }} />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <Skeleton variant="line" width={140} height={16} />
                                <Skeleton variant="line-sm" width={220} />
                            </div>
                        </div>
                        <Skeleton variant="card" width={48} height={26} style={{ borderRadius: 13 }} />
                    </div>
                </div>

                {/* Management Group */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <Skeleton variant="line-sm" width={110} style={{ paddingLeft: 16 }} />
                    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: i < 4 ? '1px solid var(--border-color)' : 'none' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                    <Skeleton variant="card" width={40} height={40} style={{ borderRadius: 8 }} />
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        <Skeleton variant="line" width={120} height={16} />
                                        <Skeleton variant="line-sm" width={200} />
                                    </div>
                                </div>
                                <Skeleton variant="circle" size={16} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Account Group */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <Skeleton variant="line-sm" width={90} style={{ paddingLeft: 16 }} />
                    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <Skeleton variant="card" width={40} height={40} style={{ borderRadius: 8 }} />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <Skeleton variant="line" width={80} height={16} />
                                <Skeleton variant="line-sm" width={160} />
                            </div>
                        </div>
                        <Skeleton variant="circle" size={16} />
                    </div>
                </div>
            </div>
        </div>
    );
}
