import Skeleton from '@/components/Skeleton';

export default function CampaignsSkeleton() {
    return (
        <div className="page-canvas" style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
            {/* Page header: top-left title + view controls, like the real header */}
            <div style={{ position: 'absolute', top: 28, left: 28, zIndex: 30, display: 'flex', alignItems: 'center', gap: 16 }}>
                <Skeleton variant="line" width={150} height={28} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Skeleton variant="card" width={120} height={34} style={{ borderRadius: 8 }} />
                    <Skeleton variant="card" width={44} height={34} style={{ borderRadius: 8 }} />
                </div>
            </div>

            {/* Scattered 2D Campaign Deck Node Mocks across canvas */}
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
                {/* Node 1 */}
                <div style={{ position: 'absolute', top: '28%', left: '22%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                    <Skeleton variant="card" width={130} height={175} style={{ borderRadius: 14, boxShadow: '0 12px 32px rgba(0,0,0,0.2)' }} />
                    <Skeleton variant="line-sm" width={110} />
                </div>

                {/* Node 2 */}
                <div style={{ position: 'absolute', top: '22%', right: '28%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                    <Skeleton variant="card" width={130} height={175} style={{ borderRadius: 14, boxShadow: '0 12px 32px rgba(0,0,0,0.2)' }} />
                    <Skeleton variant="line-sm" width={90} />
                </div>

                {/* Node 3 */}
                <div style={{ position: 'absolute', top: '55%', left: '38%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                    <Skeleton variant="card" width={130} height={175} style={{ borderRadius: 14, boxShadow: '0 12px 32px rgba(0,0,0,0.2)' }} />
                    <Skeleton variant="line-sm" width={120} />
                </div>

                {/* Node 4 */}
                <div style={{ position: 'absolute', top: '60%', right: '18%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                    <Skeleton variant="card" width={130} height={175} style={{ borderRadius: 14, boxShadow: '0 12px 32px rgba(0,0,0,0.2)' }} />
                    <Skeleton variant="line-sm" width={100} />
                </div>

                {/* Node 5 */}
                <div style={{ position: 'absolute', top: '42%', left: '8%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                    <Skeleton variant="card" width={130} height={175} style={{ borderRadius: 14, boxShadow: '0 12px 32px rgba(0,0,0,0.2)' }} />
                    <Skeleton variant="line-sm" width={80} />
                </div>
            </div>

            {/* Bottom floating PromptField Command Bar */}
            <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', zIndex: 30, width: '100%', maxWidth: 640, padding: '0 16px' }}>
                <div style={{ width: '100%', height: 52, borderRadius: 26, background: 'var(--card-bg)', border: '1px solid var(--border-color)', boxShadow: '0 8px 32px var(--shadow-color)', display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12 }}>
                    <Skeleton variant="circle" size={24} />
                    <Skeleton variant="line" width="60%" height={16} />
                </div>
            </div>
        </div>
    );
}
