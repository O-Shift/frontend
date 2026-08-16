import Skeleton from '@/components/Skeleton';

export default function WorkspacesSkeleton() {
    return (
        <div className="ws-root">
            <div className="ws-shell">
                <Skeleton variant="card" width={120} height={34} style={{ borderRadius: 6, marginBottom: 20 }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                    <Skeleton variant="line" width={260} height={28} />
                    <Skeleton variant="line-sm" width={380} />
                </div>

                <ul className="ws-list">
                    {[0, 1, 2].map((i) => (
                        <li key={i}>
                            <div className="ws-skeleton-row">
                                <div className="skeleton" style={{ width: 42, height: 42, borderRadius: 13 }} />
                                <div className="ws-skeleton-lines">
                                    <div className="skeleton skeleton-line" style={{ width: `${52 - i * 8}%` }} />
                                    <div className="skeleton skeleton-line-sm" style={{ width: `${34 - i * 5}%` }} />
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
