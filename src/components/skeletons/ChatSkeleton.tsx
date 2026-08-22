import Skeleton from '@/components/Skeleton';

export default function ChatSkeleton() {
    return (
        <div className="chat-page">
            <div className="chat-ambient" aria-hidden="true"><span /><span /></div>

            {/* Top Bar */}
            <header className="chat-topbar">
                <div className="flex min-w-0 items-center gap-2.5">
                    <Skeleton variant="card" width={16} height={16} style={{ borderRadius: 4 }} />
                    <Skeleton variant="line" width={180} height={20} />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton variant="card" width={32} height={32} style={{ borderRadius: 6 }} />
                </div>
            </header>

            {/* Main Chat Hero Area */}
            <main className="relative flex min-h-0 flex-1 overflow-hidden">
                <section className="relative flex min-w-0 flex-1 flex-col items-center justify-center p-6 md:p-12">
                    <div className="flex flex-col items-center gap-8 w-full max-w-3xl">
                        {/* Hero Headline */}
                        <div className="flex flex-col items-center gap-3">
                            <Skeleton variant="line" width={340} height={36} style={{ borderRadius: 8 }} />
                        </div>

                        {/* Quick action pills */}
                        <div className="flex flex-wrap items-center justify-center gap-2.5 max-w-3xl w-full">
                            {[160, 150, 165].map((w, i) => (
                                <Skeleton key={i} variant="card" width={w} height={34} style={{ borderRadius: 17 }} />
                            ))}
                        </div>

                        {/* Large ChatComposer Mock */}
                        <div className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4 shadow-sm flex flex-col gap-8 min-h-[140px] justify-between">
                            <Skeleton variant="line-sm" width={220} />
                            <div className="flex justify-between items-center">
                                <div className="flex gap-2">
                                    <Skeleton variant="circle" size={28} />
                                    <Skeleton variant="circle" size={28} />
                                </div>
                                <Skeleton variant="circle" size={32} />
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
