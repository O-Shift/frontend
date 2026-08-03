import '../auth.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Login - OShift',
    description: 'Log in to OShift',
};

export default function LoginLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="auth-root reversed">
            {children}
        </div>
    );
}
