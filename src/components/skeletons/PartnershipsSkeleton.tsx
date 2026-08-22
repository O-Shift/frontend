import Skeleton from '@/components/Skeleton';

export default function PartnershipsSkeleton() {
    return (
        <div className="canvas-container" style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
            {/* Top glass dock: segmented Graph/Timeline switcher + category pills */}
            <div className="canvas-header" style={{ position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 30, display: 'flex', gap: 8 }}>
                <div className="glass-dock" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 5px', borderRadius: 999 }}>
                    <Skeleton variant="card" width={90} height={24} style={{ borderRadius: 999 }} />
                    <Skeleton variant="card" width={80} height={24} style={{ borderRadius: 999 }} />
                    <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.1)', margin: '0 2px' }} />
                    {[70, 64, 82, 74].map((w, i) => (
                        <Skeleton key={i} variant="card" width={w} height={24} style={{ borderRadius: 999 }} />
                    ))}
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

            {/* Bottom-right zoom & view HUD */}
            <div style={{ position: 'absolute', bottom: 24, right: 24, zIndex: 30, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="glass-dock" style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '3px 4px', borderRadius: 999 }}>
                    <Skeleton variant="card" width={32} height={26} style={{ borderRadius: 999 }} />
                    <Skeleton variant="card" width={32} height={26} style={{ borderRadius: 999 }} />
                </div>
                <Skeleton variant="card" width={72} height={30} style={{ borderRadius: 999 }} />
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
