import Skeleton from '@/components/Skeleton';

export default function AutomationsSkeleton() {
    return (
        <div className="flex-1 w-full overflow-y-auto p-6 md:p-10 pb-24 bg-[var(--bg-main-alt)] text-[var(--text-primary)]">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Bar */}
                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between border-b border-[var(--border-color)] pb-6">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                            <Skeleton variant="line" width={260} height={28} />
                            <Skeleton variant="card" width={110} height={24} style={{ borderRadius: 6 }} />
                        </div>
                        <Skeleton variant="line-sm" width={400} />
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        <Skeleton variant="card" width={80} height={36} style={{ borderRadius: 8 }} />
                        <Skeleton variant="card" width={160} height={36} style={{ borderRadius: 8 }} />
                        <Skeleton variant="card" width={130} height={36} style={{ borderRadius: 8 }} />
                    </div>
                </div>

                {/* 3 KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-5 flex items-center justify-between">
                            <div className="flex flex-col gap-2">
                                <Skeleton variant="line-sm" width={110} />
                                <Skeleton variant="line" width={70} height={28} />
                            </div>
                            <Skeleton variant="card" width={44} height={44} style={{ borderRadius: 8 }} />
                        </div>
                    ))}
                </div>

                {/* 2-Column Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* Left 2 Cols: Schedules + Execution Stream */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Active Schedules */}
                        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6 space-y-6">
                            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
                                <div className="flex items-center gap-3">
                                    <Skeleton variant="circle" size={20} />
                                    <div className="flex flex-col gap-1">
                                        <Skeleton variant="line" width={180} height={18} />
                                        <Skeleton variant="line-sm" width={220} />
                                    </div>
                                </div>
                                <Skeleton variant="card" width={110} height={28} style={{ borderRadius: 6 }} />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[1, 2].map((i) => (
                                    <div key={i} className="border border-[var(--border-color)] bg-[var(--card-bg-alt)] rounded-xl p-4 flex flex-col justify-between space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex flex-col gap-1.5 flex-1">
                                                <Skeleton variant="line" width="70%" height={16} />
                                                <Skeleton variant="line-sm" width="50%" />
                                            </div>
                                            <Skeleton variant="card" width={36} height={20} style={{ borderRadius: 10 }} />
                                        </div>
                                        <div className="flex items-center justify-between pt-3 border-t border-[var(--border-color)]">
                                            <Skeleton variant="line-sm" width={100} />
                                            <Skeleton variant="card" width={60} height={24} style={{ borderRadius: 4 }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Pipeline Execution Stream */}
                        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6 space-y-4">
                            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
                                <div className="flex items-center gap-3">
                                    <Skeleton variant="circle" size={20} />
                                    <div className="flex flex-col gap-1">
                                        <Skeleton variant="line" width={180} height={18} />
                                        <Skeleton variant="line-sm" width={240} />
                                    </div>
                                </div>
                            </div>

                            <div className="divide-y divide-[var(--border-color)]">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="py-3 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Skeleton variant="circle" size={16} />
                                            <div className="flex flex-col gap-1">
                                                <Skeleton variant="line" width={160} height={14} />
                                                <Skeleton variant="line-sm" width={100} />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <Skeleton variant="line-sm" width={70} />
                                            <Skeleton variant="card" width={80} height={22} style={{ borderRadius: 11 }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right 1 Col: Trigger Panel + Step Diagnostics */}
                    <div className="space-y-8">
                        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6 space-y-5">
                            <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-4">
                                <Skeleton variant="circle" size={20} />
                                <Skeleton variant="line" width={150} height={18} />
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Skeleton variant="line-sm" width={90} />
                                    <Skeleton variant="card" height={38} style={{ borderRadius: 8 }} />
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg-alt)]">
                                    <Skeleton variant="line-sm" width={110} />
                                    <Skeleton variant="card" width={36} height={20} style={{ borderRadius: 10 }} />
                                </div>
                                <Skeleton variant="card" height={40} style={{ borderRadius: 8 }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
