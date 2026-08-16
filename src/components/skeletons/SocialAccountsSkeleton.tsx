import Skeleton from '@/components/Skeleton';

export default function SocialAccountsSkeleton() {
    return (
        <div className="flex-1 w-full overflow-y-auto p-6 md:p-10 pb-24 bg-[var(--bg-main-alt)] text-[var(--text-primary)] font-sans">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Bar */}
                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between border-b border-[var(--border-color)] pb-6">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                            <Skeleton variant="circle" size={24} />
                            <Skeleton variant="line" width={240} height={28} />
                        </div>
                        <Skeleton variant="line-sm" width={420} />
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        <Skeleton variant="card" width={160} height={38} style={{ borderRadius: 8 }} />
                        <Skeleton variant="card" width={120} height={38} style={{ borderRadius: 8 }} />
                    </div>
                </div>

                {/* Filter & Search Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-4 shadow-xs">
                    <div className="flex items-center gap-2 overflow-x-auto">
                        {[90, 80, 80, 75, 75, 70, 80].map((w, idx) => (
                            <Skeleton key={idx} variant="card" width={w} height={30} style={{ borderRadius: 8 }} />
                        ))}
                    </div>
                    <Skeleton variant="card" width={240} height={32} style={{ borderRadius: 8 }} />
                </div>

                {/* Compact Metrics Strip */}
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] px-5 py-3">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <Skeleton variant="circle" size={16} />
                            <Skeleton variant="line-sm" width={120} />
                        </div>
                        <div className="flex items-center gap-2">
                            <Skeleton variant="circle" size={16} />
                            <Skeleton variant="line-sm" width={140} />
                        </div>
                    </div>
                    <Skeleton variant="card" width={120} height={22} style={{ borderRadius: 11 }} />
                </div>

                {/* Profile Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div
                            key={i}
                            className="border border-[var(--border-color)] bg-[var(--card-bg)] rounded-2xl p-6 flex flex-col justify-between space-y-5 shadow-xs"
                            style={{ minHeight: 200 }}
                        >
                            <div className="space-y-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <Skeleton variant="card" width={44} height={44} style={{ borderRadius: 12 }} />
                                        <div className="flex flex-col gap-1.5">
                                            <Skeleton variant="line" width={120} height={16} />
                                            <Skeleton variant="line-sm" width={80} />
                                        </div>
                                    </div>
                                    <Skeleton variant="circle" size={20} />
                                </div>

                                <div className="flex items-center justify-between pt-3 border-t border-[var(--border-color)]">
                                    <Skeleton variant="line-sm" width={90} />
                                    <Skeleton variant="line-sm" width={70} />
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <Skeleton variant="line-sm" width={100} />
                                <Skeleton variant="card" width={80} height={28} style={{ borderRadius: 6 }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
