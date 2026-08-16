import Skeleton from '@/components/Skeleton';

export default function ProfileSkeleton() {
    return (
        <div className="page-container px-4 md:px-8 pt-8 pb-24">
            <div className="w-full max-w-[1320px] mx-auto flex flex-col gap-6">
                {/* ── HERO CARD ── */}
                <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6 md:p-8">
                    <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
                        {/* Avatar initials box */}
                        <Skeleton variant="card" width={96} height={96} style={{ borderRadius: 8 }} />

                        {/* Identity */}
                        <div className="flex-1 min-w-[200px] flex flex-col gap-3">
                            <div className="flex items-center gap-3">
                                <Skeleton variant="line" width={220} height={28} />
                                <Skeleton variant="card" width={70} height={20} style={{ borderRadius: 4 }} />
                                <Skeleton variant="card" width={80} height={20} style={{ borderRadius: 4 }} />
                            </div>
                            <Skeleton variant="line-sm" width={260} />
                            <div className="flex gap-4 mt-1">
                                <Skeleton variant="line-sm" width={110} />
                                <Skeleton variant="line-sm" width={140} />
                            </div>
                        </div>

                        {/* Action */}
                        <Skeleton variant="card" width={100} height={36} style={{ borderRadius: 6 }} />
                    </div>
                </div>

                {/* ── 4 SNAPSHOT KPI CARDS ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-5 flex flex-col gap-3">
                            <div className="flex justify-between items-center">
                                <Skeleton variant="line-sm" width={90} />
                                <Skeleton variant="circle" size={18} />
                            </div>
                            <Skeleton variant="line" width={40} height={28} />
                        </div>
                    ))}
                </div>

                {/* ── 2x2 GRID OF PROFILE INFO CARDS ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6 flex flex-col gap-5">
                            <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-4">
                                <Skeleton variant="circle" size={20} />
                                <Skeleton variant="line" width={180} height={18} />
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <Skeleton variant="line-sm" width={90} />
                                    <Skeleton variant="line-sm" width={140} />
                                </div>
                                <div className="flex justify-between">
                                    <Skeleton variant="line-sm" width={100} />
                                    <Skeleton variant="line-sm" width={120} />
                                </div>
                                <div className="flex justify-between">
                                    <Skeleton variant="line-sm" width={80} />
                                    <Skeleton variant="line-sm" width={150} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
