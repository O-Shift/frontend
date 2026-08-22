import Skeleton from '@/components/Skeleton';

export default function VideosSkeleton() {
    return (
        <div className="flex-1 overflow-y-auto min-h-0 relative px-4 sm:px-6 lg:px-8 py-5 space-y-4">
            <div className="max-w-7xl mx-auto w-full space-y-4">
                {/* Pinterest-style search/filter bar (VideoFilters) */}
                <div className="flex items-center gap-2 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-3">
                    <Skeleton variant="circle" size={28} />
                    <Skeleton variant="line-sm" width="45%" />
                    <div className="ml-auto flex items-center gap-2">
                        <Skeleton variant="card" width={110} height={32} style={{ borderRadius: 8 }} />
                        <Skeleton variant="card" width={90} height={32} style={{ borderRadius: 8 }} />
                    </div>
                </div>

                {/* Minimal text tabs with underline */}
                <div className="flex items-center gap-6 sm:gap-8 border-b border-[var(--border-color)] pb-2.5">
                    <Skeleton variant="line-sm" width={40} />
                    <Skeleton variant="line-sm" width={100} />
                    <Skeleton variant="line-sm" width={110} />
                </div>

                {/* Masonry columns of video cards (matches the page's own loading state) */}
                <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4 pt-1">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div
                            key={i}
                            className="h-80 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4 flex flex-col justify-between break-inside-avoid"
                        >
                            <div className="space-y-3">
                                <Skeleton variant="card" height={176} style={{ borderRadius: 12 }} />
                                <Skeleton variant="line" width="75%" height={16} />
                            </div>
                            <Skeleton variant="line-sm" width="50%" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
