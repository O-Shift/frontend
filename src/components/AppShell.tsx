'use client';
import { useEffect, useSyncExternalStore } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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
                <Sidebar />
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
