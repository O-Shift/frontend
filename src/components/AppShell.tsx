'use client';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

const SHELL_EXCLUDED_ROUTES = [
    '/login',
    '/signup',
    '/forgot-password',
    '/update-password',
    '/onboarding',
    '/workspaces',
    '/auth',
];

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isShellExcluded = SHELL_EXCLUDED_ROUTES.some(r => pathname.startsWith(r));

    if (isShellExcluded) {
        return <>{children}</>;
    }

    return (
        <div className="app-window">
            <Sidebar />
            <main className="flex-1 h-full overflow-y-auto overflow-x-hidden min-w-0">
                {children}
            </main>
        </div>
    );
}
