import Skeleton from '@/components/Skeleton';

export default function PartnershipsSkeleton() {
    return (
        <div className="canvas-container" style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
            {/* Top Toolbar pill (Graph / Timeline) */}
            <div className="canvas-header" style={{ position: 'absolute', top: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 30, display: 'flex', gap: 8 }}>
                <div style={{ display: 'flex', gap: 6, padding: '6px 12px', borderRadius: 20, background: 'var(--card-bg)', border: '1px solid var(--border-color)', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                    <Skeleton variant="card" width={80} height={28} style={{ borderRadius: 14 }} />
                </div>
            </div>

            {/* Scattered Graph Hub Nodes Mocks */}
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
                {/* Central Hub */}
                <div style={{ position: 'absolute', top: '45%', left: '48%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <Skeleton variant="circle" size={80} style={{ boxShadow: '0 0 40px rgba(255,90,0,0.2)' }} />
                    <Skeleton variant="line-sm" width={100} />
                </div>

                {/* Satellite 1 */}
                <div style={{ position: 'absolute', top: '25%', left: '30%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <Skeleton variant="circle" size={44} />
                    <Skeleton variant="line-sm" width={70} />
                </div>

                {/* Satellite 2 */}
                <div style={{ position: 'absolute', top: '22%', right: '32%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <Skeleton variant="circle" size={44} />
                    <Skeleton variant="line-sm" width={80} />
                </div>

                {/* Satellite 3 */}
                <div style={{ position: 'absolute', bottom: '28%', left: '26%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <Skeleton variant="circle" size={44} />
                    <Skeleton variant="line-sm" width={75} />
                </div>

                {/* Satellite 4 */}
                <div style={{ position: 'absolute', bottom: '26%', right: '28%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <Skeleton variant="circle" size={44} />
                    <Skeleton variant="line-sm" width={65} />
                </div>
            </div>

            {/* Bottom-right zoom controls */}
            <div style={{ position: 'absolute', bottom: 32, right: 32, zIndex: 30, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Skeleton variant="card" width={80} height={36} style={{ borderRadius: 18 }} />
                <Skeleton variant="card" width={56} height={36} style={{ borderRadius: 18 }} />
                <Skeleton variant="card" width={36} height={36} style={{ borderRadius: 18 }} />
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
