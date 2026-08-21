'use client';
import { useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { PromptFieldProvider } from '@/components/PromptFieldContext';
import { getActiveWorkspaceId } from '@/lib/api';

const SHELL_EXCLUDED_ROUTES = [
    '/login',
    '/signup',
    '/forgot-password',
    '/update-password',
    '/onboarding',
    '/workspaces',
    '/landing',
    '/auth'
];

function subscribeToWorkspace(callback: () => void): () => void {
    window.addEventListener('oshift:workspace-changed', callback);
    return () => window.removeEventListener('oshift:workspace-changed', callback);
}

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const isShellExcluded = SHELL_EXCLUDED_ROUTES.some(r => pathname.startsWith(r));
    const workspaceId = useSyncExternalStore(
        subscribeToWorkspace,
        getActiveWorkspaceId,
        () => null,
    );
    const workspaceReady = Boolean(workspaceId);
    // The drawer stores the pathname it was opened at, so it derives closed
    // on route change instead of syncing state in an effect.
    const [mobileNavPath, setMobileNavPath] = useState<string | null>(null);
    const mobileNavOpen = mobileNavPath !== null && mobileNavPath === pathname;

    // Escape closes the mobile drawer.
    useEffect(() => {
        if (!mobileNavOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setMobileNavPath(null);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [mobileNavOpen]);

    // Lock body scroll while the mobile drawer is open.
    useEffect(() => {
        if (!mobileNavOpen) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [mobileNavOpen]);

    const closeMobileNav = () => setMobileNavPath(null);

    useEffect(() => {
        if (!isShellExcluded && !workspaceReady) {
            const requestedPath = `${pathname}${window.location.search}`;
            router.replace(`/workspaces?next=${encodeURIComponent(requestedPath)}`);
        }
    }, [isShellExcluded, pathname, router, workspaceReady]);

    if (isShellExcluded) {
        return <>{children}</>;
    }

    if (!workspaceReady) {
        return (
            <div className="workspace-guard-loading" role="status" aria-label="Loading workspace">
                <span className="workspace-guard-spinner" />
            </div>
        );
    }

    // Workspace-scoped pages fetch on mount, so changing this key clears their
    // client state and starts their effects against the new tenant.
    return (
        <PromptFieldProvider key={workspaceId}>
            <div className="app-window">
                <header className="mobile-topbar">
                    <button
                        type="button"
                        className="mobile-topbar-menu-btn"
                        aria-label="Open navigation menu"
                        aria-expanded={mobileNavOpen}
                        onClick={() => setMobileNavPath(pathname)}
                    >
                        <Menu size={20} aria-hidden="true" />
                    </button>
                    <Link href="/" className="mobile-topbar-brand">
                        {/* eslint-disable-next-line @next/next/no-img-element -- same static logo asset as Sidebar */}
                        <img src="/orange logo.png" alt="" className="mobile-topbar-logo" />
                        <span>OShift</span>
                    </Link>
                </header>
                <Sidebar mobileNavOpen={mobileNavOpen} onMobileClose={closeMobileNav} />
                <div
                    className={`mobile-nav-backdrop ${mobileNavOpen ? 'open' : ''}`}
                    onClick={closeMobileNav}
                    aria-hidden="true"
                />
                <AnimatePresence mode="wait">
                    <motion.div
                        key={pathname}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
                        style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </div>
        </PromptFieldProvider>
    );
}
