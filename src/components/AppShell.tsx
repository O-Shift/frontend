'use client';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import { PromptFieldProvider } from '@/components/PromptFieldContext';

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

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isShellExcluded = SHELL_EXCLUDED_ROUTES.some(r => pathname.startsWith(r));

    if (isShellExcluded) {
        return <>{children}</>;
    }

    return (
        <PromptFieldProvider>
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
