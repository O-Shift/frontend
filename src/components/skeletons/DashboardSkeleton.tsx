import Skeleton from '@/components/Skeleton';

export default function DashboardSkeleton() {
    return (
        <div className="flex-1 w-full overflow-y-auto overflow-x-hidden p-6 md:p-10 pb-24 flex flex-col items-center justify-start relative bg-[var(--bg-main-alt)]">
            <div className="w-full max-w-6xl flex flex-col gap-6">
                
                {/* ── HEADER ── */}
                <div className="flex justify-between items-center mb-2">
                    <Skeleton variant="line" width={140} height={28} />
                    <Skeleton variant="card" width={80} height={32} style={{ borderRadius: 6 }} />
                </div>

                {/* ── GRID: INVERTED PYRAMID ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    
                    {/* ── TOP LEFT (Span 2): LATEST CAMPAIGN HERO ── */}
                    <div className="col-span-1 lg:col-span-2 flex flex-col bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6 h-full min-h-[380px]">
                        <div className="flex items-center justify-between mb-6">
                            <Skeleton variant="line" width={220} height={20} />
                            <div className="flex items-center gap-2">
                                <Skeleton variant="card" width={32} height={32} style={{ borderRadius: 6 }} />
                                <Skeleton variant="card" width={32} height={32} style={{ borderRadius: 6 }} />
                            </div>
                        </div>
                        
                        <div className="flex flex-col md:flex-row gap-8 items-start h-full">
                            {/* 3D Deck Mockup Area */}
                            <div className="w-full md:w-48 h-48 md:h-full flex items-center justify-center flex-shrink-0 relative">
                                <Skeleton variant="card" width={140} height={190} style={{ borderRadius: 16 }} />
                            </div>
                            
                            {/* Campaign Details & Stats */}
                            <div className="flex flex-col flex-1 justify-between h-full w-full">
                                <div className="mb-6">
                                    <Skeleton variant="line" width="65%" height={24} style={{ marginBottom: 8 }} />
                                    <Skeleton variant="line-sm" width="35%" />
                                </div>
                                
                                <div className="grid grid-cols-3 gap-6">
                                    <div className="flex flex-col gap-2">
                                        <Skeleton variant="line-sm" width="60%" />
                                        <Skeleton variant="line" width="80%" height={24} />
                                        <Skeleton variant="line-sm" width="50%" />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Skeleton variant="line-sm" width="60%" />
                                        <Skeleton variant="line" width="80%" height={24} />
                                        <Skeleton variant="line-sm" width="50%" />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Skeleton variant="line-sm" width="60%" />
                                        <Skeleton variant="line" width="80%" height={24} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── TOP RIGHT (Span 1): HIGH-LEVEL KPIs ── */}
                    <div className="col-span-1 flex flex-col gap-4 h-full">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center justify-between bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-5 flex-1">
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <Skeleton variant="circle" size={18} />
                                        <Skeleton variant="line" width={120} height={16} />
                                    </div>
                                    <Skeleton variant="line" width={60} height={24} />
                                </div>
                                <div className="flex flex-col items-end gap-1.5">
                                    <Skeleton variant="line-sm" width={80} />
                                    <Skeleton variant="line-sm" width={90} />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ── BOTTOM LEFT (Span 2): PERFORMANCE CHARTS ── */}
                    <div className="col-span-1 lg:col-span-2 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6 min-h-[380px] flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <Skeleton variant="line" width={160} height={20} />
                            <div className="flex gap-2">
                                <Skeleton variant="card" width={64} height={28} style={{ borderRadius: 6 }} />
                                <Skeleton variant="card" width={90} height={28} style={{ borderRadius: 6 }} />
                            </div>
                        </div>
                        <div className="flex-1 w-full flex items-center justify-center">
                            <Skeleton variant="chart" height={260} />
                        </div>
                    </div>

                    {/* ── BOTTOM RIGHT (Span 1): MARKET GAPS LIST ── */}
                    <div className="col-span-1 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6 flex flex-col h-full min-h-[380px]">
                        <div className="flex items-center justify-between mb-4">
                            <Skeleton variant="line" width={120} height={20} />
                            <Skeleton variant="line-sm" width={60} />
                        </div>
                        <div className="flex flex-col gap-3 flex-1">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="p-3 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg-alt)] flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <Skeleton variant="line-sm" width={80} />
                                        <Skeleton variant="line-sm" width={40} />
                                    </div>
                                    <Skeleton variant="line" width="90%" height={14} />
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* ── SECTION 3: TOP OPPORTUNITIES ── */}
                <div className="flex flex-col gap-4 mt-2">
                    <div className="flex items-center justify-between">
                        <Skeleton variant="line" width={150} height={20} />
                        <Skeleton variant="line-sm" width={60} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6 flex flex-col justify-between min-h-[190px]">
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <Skeleton variant="card" width={60} height={20} style={{ borderRadius: 4 }} />
                                        <Skeleton variant="line-sm" width={40} />
                                    </div>
                                    <Skeleton variant="line" width="85%" height={18} style={{ marginBottom: 8 }} />
                                    <Skeleton variant="line-sm" width="100%" style={{ marginBottom: 4 }} />
                                    <Skeleton variant="line-sm" width="70%" />
                                </div>
                                <div className="flex items-center justify-between pt-4 border-t border-[var(--border-color)] mt-4">
                                    <Skeleton variant="line-sm" width={70} />
                                    <Skeleton variant="line-sm" width={70} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── SECTION 4: RECENT REVIEWS CAROUSEL ── */}
                <div className="flex flex-col gap-4 mt-2">
                    <div className="flex items-center justify-between">
                        <Skeleton variant="line" width={180} height={20} />
                        <div className="flex items-center gap-2">
                            <Skeleton variant="card" width={32} height={32} style={{ borderRadius: 6 }} />
                            <Skeleton variant="card" width={32} height={32} style={{ borderRadius: 6 }} />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-5 flex flex-col justify-between min-h-[170px]">
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <Skeleton variant="circle" size={28} />
                                            <Skeleton variant="line" width={90} height={14} />
                                        </div>
                                        <Skeleton variant="card" width={50} height={18} style={{ borderRadius: 4 }} />
                                    </div>
                                    <Skeleton variant="line-sm" width="100%" style={{ marginBottom: 6 }} />
                                    <Skeleton variant="line-sm" width="85%" />
                                </div>
                                <div className="flex items-center justify-between pt-3 border-t border-[var(--border-color)] mt-3">
                                    <Skeleton variant="line-sm" width={60} />
                                    <Skeleton variant="line-sm" width={50} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
