import '../auth.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Sign Up - OShift',
    description: 'Create a new OShift account',
};

export default function SignupLayout({
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
