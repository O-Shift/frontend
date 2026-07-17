import '../auth.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Forgot Password - OShift',
    description: 'Reset your OShift password',
};

export default function ForgotPasswordLayout({
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
