import Skeleton from '@/components/Skeleton';

export default function VideosSkeleton() {
    return (
        <div className="flex-1 overflow-y-auto min-h-0 relative p-6 sm:p-8 lg:p-10 space-y-8">
            <div className="max-w-7xl mx-auto w-full space-y-8 pb-16">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-col gap-2">
                        <Skeleton variant="line-sm" width={200} />
                        <Skeleton variant="line" width={320} height={32} />
                        <Skeleton variant="line-sm" width={480} />
                    </div>

                    <Skeleton variant="card" width={140} height={38} style={{ borderRadius: 12 }} />
                </div>

                {/* 4 Strategic Intelligence KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div
                            key={i}
                            className="p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-sm flex flex-col gap-3"
                        >
                            <div className="flex items-center justify-between">
                                <Skeleton variant="line-sm" width={110} />
                                <Skeleton variant="card" width={28} height={28} style={{ borderRadius: 8 }} />
                            </div>
                            <div className="flex flex-col gap-1.5 mt-1">
                                <Skeleton variant="line" width="75%" height={20} />
                                <Skeleton variant="line-sm" width="90%" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* VideoAnalyzerInput Mock Bar */}
                <div className="p-4 sm:p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-sm flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                        <Skeleton variant="circle" size={24} />
                        <Skeleton variant="line-sm" width="50%" />
                    </div>
                    <Skeleton variant="card" width={120} height={40} style={{ borderRadius: 12 }} />
                </div>

                {/* VideoFilters Mock Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-4">
                    <div className="flex items-center gap-2 overflow-x-auto">
                        {[80, 80, 90, 80].map((w, idx) => (
                            <Skeleton key={idx} variant="card" width={w} height={30} style={{ borderRadius: 8 }} />
                        ))}
                    </div>
                    <Skeleton variant="card" width={240} height={32} style={{ borderRadius: 8 }} />
                </div>

                {/* Video Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div
                            key={i}
                            className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] overflow-hidden shadow-sm flex flex-col"
                        >
                            {/* Video 16:9 Thumbnail Mock */}
                            <Skeleton variant="card" height={200} style={{ borderRadius: 0 }} />

                            {/* Card Body */}
                            <div className="p-5 flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <Skeleton variant="line-sm" width={90} />
                                    <Skeleton variant="card" width={50} height={18} style={{ borderRadius: 4 }} />
                                </div>
                                <Skeleton variant="line" width="90%" height={18} />
                                <Skeleton variant="text-block" lines={2} />
                                <div className="flex items-center justify-between pt-3 border-t border-[var(--border-color)]">
                                    <Skeleton variant="line-sm" width={80} />
                                    <Skeleton variant="line-sm" width={60} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
