import Skeleton from '@/components/Skeleton';
import AuthRightPanel from '@/components/AuthRightPanel';

export default function AuthLoading() {
    return (
        <>
            <div className="auth-left">
                <div className="auth-content" style={{ animation: 'none', opacity: 1, transform: 'none' }}>
                    <div className="auth-logo" style={{ marginBottom: '2.5rem' }}>
                        <Skeleton variant="line" width={160} height={60} />
                    </div>
                    
                    <div className="auth-header" style={{ marginBottom: '2rem' }}>
                        <Skeleton variant="line" width="70%" height={32} style={{ marginBottom: 12 }} />
                        <Skeleton variant="line" width="40%" height={20} />
                    </div>

                    <div className="auth-form" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <Skeleton variant="card" height={52} />
                        <Skeleton variant="card" height={52} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', margin: '0.5rem 0' }}>
                            <Skeleton variant="line" width={120} height={20} />
                            <Skeleton variant="line" width={120} height={20} />
                        </div>
                        <Skeleton variant="card" height={52} />
                    </div>

                    <div className="auth-divider" style={{ display: 'flex', alignItems: 'center', margin: '2rem 0', gap: '1rem' }}>
                        <Skeleton variant="line" height={1} style={{ flex: 1 }} />
                        <Skeleton variant="line" width={100} height={12} />
                        <Skeleton variant="line" height={1} style={{ flex: 1 }} />
                    </div>

                    <div className="auth-social" style={{ display: 'flex', gap: '1rem' }}>
                        <Skeleton variant="card" height={50} style={{ flex: 1 }} />
                        <Skeleton variant="card" height={50} style={{ flex: 1 }} />
                        <Skeleton variant="card" height={50} style={{ flex: 1 }} />
                    </div>

                    <div className="auth-switch" style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'center' }}>
                        <Skeleton variant="line" width={200} height={16} />
                    </div>
                </div>
            </div>

            <AuthRightPanel />
        </>
    );
}
