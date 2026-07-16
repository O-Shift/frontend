'use client';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

const SHELL_EXCLUDED_ROUTES = ['/signup', '/login'];

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isShellExcluded = SHELL_EXCLUDED_ROUTES.some(r => pathname.startsWith(r));

    if (isShellExcluded) {
        return <>{children}</>;
    }

    return (
        <div className="app-window">
            <Sidebar />
            {children}
        </div>
    );
}
