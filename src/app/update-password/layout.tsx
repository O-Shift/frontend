import '../auth.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Update Password - OShift',
    description: 'Update your OShift password',
};

export default function UpdatePasswordLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="auth-root reversed" data-theme="light">
            {children}
        </div>
    );
}
