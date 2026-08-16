import Skeleton from '@/components/Skeleton';

export default function CompanyDetailSkeleton() {
    return (
        <div className="page-container px-4 md:px-8 pt-8 pb-24 relative z-10">
            <div className="w-full max-w-[1320px] mx-auto flex flex-col gap-8">
                {/* ── HERO CARD ── */}
                <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6 md:p-8 relative">
                    <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
                        {/* Logo */}
                        <Skeleton variant="card" width={80} height={80} style={{ borderRadius: 8 }} />

                        {/* Company Identity */}
                        <div className="flex-1 min-w-[200px] flex flex-col gap-3">
                            <div className="flex items-center gap-3">
                                <Skeleton variant="line" width={220} height={28} />
                                <Skeleton variant="card" width={80} height={20} style={{ borderRadius: 4 }} />
                            </div>
                            <Skeleton variant="line-sm" width={180} />
                            <div className="mt-2 max-w-[600px]">
                                <Skeleton variant="text-block" lines={2} />
                            </div>
                        </div>

                        {/* Right: Actions & Stats */}
                        <div className="flex flex-col gap-3 items-end">
                            <div className="flex gap-2">
                                <Skeleton variant="card" width={70} height={32} style={{ borderRadius: 6 }} />
                                <Skeleton variant="card" width={70} height={32} style={{ borderRadius: 6 }} />
                            </div>
                            <div className="flex gap-4 mt-2">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex flex-col gap-1 items-end">
                                        <Skeleton variant="line-sm" width={80} />
                                        <Skeleton variant="line" width={50} height={18} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── TREND LINE CHART CARD ── */}
                <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6 md:p-8 flex flex-col gap-6">
                    <div className="flex justify-between items-center">
                        <Skeleton variant="line" width={200} height={20} />
                        <div className="flex gap-2">
                            <Skeleton variant="card" width={90} height={28} style={{ borderRadius: 6 }} />
                            <Skeleton variant="card" width={90} height={28} style={{ borderRadius: 6 }} />
                        </div>
                    </div>
                    <Skeleton variant="chart" height={280} />
                </div>

                {/* ── 3-COLUMN LOWER INTELLIGENCE GRID ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Col 1: Gaps */}
                    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6 flex flex-col gap-4">
                        <div className="flex justify-between items-center mb-2">
                            <Skeleton variant="line" width={140} height={20} />
                            <Skeleton variant="line-sm" width={40} />
                        </div>
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="p-4 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg-alt)] flex flex-col gap-2">
                                <Skeleton variant="line" width="80%" height={16} />
                                <Skeleton variant="line-sm" width="100%" />
                                <Skeleton variant="line-sm" width="60%" />
                            </div>
                        ))}
                    </div>

                    {/* Col 2: Reviews */}
                    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6 flex flex-col gap-4">
                        <div className="flex justify-between items-center mb-2">
                            <Skeleton variant="line" width={140} height={20} />
                            <Skeleton variant="line-sm" width={40} />
                        </div>
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="p-4 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg-alt)] flex flex-col gap-2">
                                <div className="flex justify-between items-center">
                                    <Skeleton variant="line-sm" width={70} />
                                    <Skeleton variant="line-sm" width={50} />
                                </div>
                                <Skeleton variant="line-sm" width="100%" />
                                <Skeleton variant="line-sm" width="80%" />
                            </div>
                        ))}
                    </div>

                    {/* Col 3: Campaigns */}
                    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6 flex flex-col gap-4">
                        <div className="flex justify-between items-center mb-2">
                            <Skeleton variant="line" width={140} height={20} />
                            <Skeleton variant="line-sm" width={40} />
                        </div>
                        {[1, 2].map((i) => (
                            <div key={i} className="p-4 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg-alt)] flex flex-col gap-3">
                                <Skeleton variant="line" width="85%" height={16} />
                                <Skeleton variant="line-sm" width="60%" />
                                <Skeleton variant="card" height={90} style={{ borderRadius: 8 }} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
