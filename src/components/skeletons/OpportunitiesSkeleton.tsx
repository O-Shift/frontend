import Skeleton from '@/components/Skeleton';

export default function OpportunitiesSkeleton() {
    return (
        <div className="main-content" style={{ overflowY: 'auto', padding: '60px', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 10 }}>
            {/* Top Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 1200, width: '100%', margin: '0 auto 30px auto' }}>
                <Skeleton variant="line-sm" width={160} />
                <div style={{ display: 'flex', gap: 12 }}>
                    <Skeleton variant="card" width={160} height={38} style={{ borderRadius: 6 }} />
                    <Skeleton variant="card" width={180} height={38} style={{ borderRadius: 6 }} />
                </div>
            </div>

            {/* Main Presentation Slide Split Layout */}
            <div style={{ display: 'flex', flex: 1, width: '100%', maxWidth: 1200, margin: '0 auto', gap: 60 }}>
                {/* Left Column: Title, Description, Gaps, Effort/Impact */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <Skeleton variant="line" width="80%" height={36} style={{ borderRadius: 8 }} />
                    <div style={{ maxWidth: 600 }}>
                        <Skeleton variant="text-block" lines={3} />
                    </div>

                    {/* Gaps List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 12 }}>
                        <Skeleton variant="line-sm" width={100} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingLeft: 16 }}>
                            <Skeleton variant="line" width="90%" height={16} />
                            <Skeleton variant="line" width="75%" height={16} />
                            <Skeleton variant="line" width="85%" height={16} />
                        </div>
                    </div>

                    {/* Effort & Impact */}
                    <div style={{ display: 'flex', gap: 40, marginTop: 16 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <Skeleton variant="line-sm" width={60} />
                            <Skeleton variant="line" width={70} height={22} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <Skeleton variant="line-sm" width={60} />
                            <Skeleton variant="line" width={70} height={22} />
                        </div>
                    </div>

                    {/* Slide Navigation Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 32 }}>
                        <Skeleton variant="circle" size={36} />
                        <Skeleton variant="line-sm" width={60} />
                        <Skeleton variant="circle" size={36} />
                    </div>
                </div>

                {/* Right Column: 3D Origami Briefing Accordion Fold */}
                <div style={{ width: 440, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Skeleton variant="line-sm" width={120} />
                            <Skeleton variant="card" width={60} height={22} style={{ borderRadius: 11 }} />
                        </div>
                        <Skeleton variant="line" width="90%" height={22} />
                        <Skeleton variant="text-block" lines={4} />

                        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Skeleton variant="line-sm" width={90} />
                                <Skeleton variant="line-sm" width={140} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Skeleton variant="line-sm" width={80} />
                                <Skeleton variant="line-sm" width={120} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
