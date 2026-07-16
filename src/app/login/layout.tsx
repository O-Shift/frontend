import '../auth.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Login - CShift',
    description: 'Login to CShift',
};

export default function LoginLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="auth-root">
            {children}
        </div>
    );
}
