import '../auth.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Sign Up - CShift',
    description: 'Create a new CShift account',
};

export default function SignupLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="auth-root" data-theme="light">
            {children}
        </div>
    );
}
