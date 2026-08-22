import Skeleton from '@/components/Skeleton';

export default function CompanyDetailSkeleton() {
    return (
        <div className="page-container px-4 md:px-8 pt-8 pb-24 relative z-10">
            <div className="w-full max-w-[1320px] mx-auto flex flex-col gap-8">
                {/* ── HERO CARD (logo + identity + right stats, divider, quick stats) ── */}
                <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6 md:p-8 relative overflow-hidden">
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

                        {/* Right: Pin action & Market info */}
                        <div className="flex flex-col gap-2 items-start md:items-end">
                            <Skeleton variant="card" width={120} height={30} style={{ borderRadius: 6 }} />
                            <Skeleton variant="line-sm" width={110} />
                            <Skeleton variant="line" width={80} height={24} />
                            <Skeleton variant="line-sm" width={70} />
                            <Skeleton variant="card" width={90} height={20} style={{ borderRadius: 4 }} />
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="h-[1px] bg-[var(--border-color)] my-6" />

                    {/* Quick stats row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="p-4 rounded-lg bg-[var(--card-bg-alt)] border border-[var(--border-color)] flex flex-col gap-2">
                                <Skeleton variant="line" width={90} height={22} />
                                <Skeleton variant="line-sm" width={130} />
                                <Skeleton variant="line-sm" width={100} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── 2-COL: CHARTS | STRATEGIC GAPS ── */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
                    {/* Charts */}
                    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6 min-w-0 flex flex-col gap-5">
                        <Skeleton variant="line-sm" width={170} height={16} />
                        <Skeleton variant="chart" height={260} />
                        <Skeleton variant="chart" height={160} />
                    </div>

                    {/* Strategic Gaps */}
                    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6 flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                            <Skeleton variant="line-sm" width={130} height={16} />
                            <Skeleton variant="card" width={36} height={20} style={{ borderRadius: 4 }} />
                        </div>
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="p-3.5 rounded-md border border-[var(--border-color)] bg-[var(--card-bg-alt)] flex flex-col gap-2">
                                <Skeleton variant="line" width="80%" height={16} />
                                <Skeleton variant="line-sm" width="100%" />
                                <Skeleton variant="line-sm" width="60%" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── FULL-WIDTH MEDIA GRID ── */}
                <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6 mb-8 flex flex-col gap-5">
                    <div className="flex justify-between items-center">
                        <Skeleton variant="line-sm" width={150} height={16} />
                        <Skeleton variant="card" width={110} height={26} style={{ borderRadius: 4 }} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg-alt)] overflow-hidden">
                                <Skeleton variant="card" height={140} style={{ borderRadius: 0 }} />
                                <div className="p-4 flex flex-col gap-2">
                                    <Skeleton variant="line" width="85%" height={16} />
                                    <Skeleton variant="line-sm" width="55%" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
