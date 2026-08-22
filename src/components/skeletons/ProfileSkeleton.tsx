import Skeleton from '@/components/Skeleton';

export default function ProfileSkeleton() {
    return (
        <div className="page-container px-4 md:px-8 pt-8 pb-24">
            <div className="w-full max-w-[1320px] mx-auto flex flex-col gap-6">
                {/* ── HERO CARD (avatar + identity + actions, divider, 4 stat blocks) ── */}
                <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6 md:p-8">
                    <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
                        {/* Avatar initials box */}
                        <Skeleton variant="card" width={96} height={96} style={{ borderRadius: 8 }} />

                        {/* Identity */}
                        <div className="flex-1 min-w-[200px] flex flex-col gap-3">
                            <div className="flex items-center gap-3">
                                <Skeleton variant="line" width={220} height={28} />
                                <Skeleton variant="card" width={70} height={20} style={{ borderRadius: 4 }} />
                            </div>
                            <Skeleton variant="line-sm" width={260} />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            <Skeleton variant="card" width={110} height={30} style={{ borderRadius: 6 }} />
                            <Skeleton variant="card" width={120} height={30} style={{ borderRadius: 6 }} />
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="h-[1px] bg-[var(--border-color)] my-6" />

                    {/* 4 stat blocks inside the hero card */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="p-4 rounded-lg bg-[var(--card-bg)] border border-[var(--border-color)] flex items-center gap-4">
                                <Skeleton variant="card" width={40} height={40} style={{ borderRadius: 8 }} />
                                <div className="flex flex-col gap-1.5">
                                    <Skeleton variant="line" width={44} height={20} />
                                    <Skeleton variant="line-sm" width={80} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── 3-COLUMN LOWER GRID ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((col) => (
                        <div key={col} className="flex flex-col gap-6">
                            <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6">
                                <div className="flex justify-between items-center mb-5">
                                    <Skeleton variant="line-sm" width={150} height={16} />
                                    <Skeleton variant="line-sm" width={50} />
                                </div>
                                <div className="space-y-3">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="p-4 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg-alt)] flex flex-col gap-2">
                                            <Skeleton variant="line" width="80%" height={16} />
                                            <Skeleton variant="line-sm" width="60%" />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6">
                                <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-4 mb-4">
                                    <Skeleton variant="circle" size={20} />
                                    <Skeleton variant="line-sm" width={140} height={16} />
                                </div>
                                <div className="space-y-4">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="flex justify-between">
                                            <Skeleton variant="line-sm" width={90} />
                                            <Skeleton variant="line-sm" width={130} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
