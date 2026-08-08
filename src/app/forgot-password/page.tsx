'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { FiMail, FiAlertCircle } from 'react-icons/fi';
import AuthRightPanel from '@/components/AuthRightPanel';

export default function ForgotPasswordPage() {
    const [isSent, setIsSent] = useState(false);
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!email) {
            setError('Please enter your email address');
            return;
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            setError('Please enter a valid email address');
            return;
        }

        setError('');
        // BACKEND: supabase.auth.resetPasswordForEmail(email, { redirectTo: '/update-password' })
        setIsSent(true);
    };

    return (
        <>
            <div className="auth-left">
                <div className="auth-content">
                    <div className="auth-logo">
                        <Image 
                            src="/orange logo.png" 
                            alt="OShift Logo" 
                            width={160} 
                            height={60} 
                            priority
                        />
                    </div>
                    
                    <div className="auth-header">
                        <h1>Having trouble logging in?</h1>
                        <p>
                            Enter your email address and we&apos;ll send you a link to reset your password.
                        </p>
                    </div>

                    {!isSent ? (
                        <form className="auth-form" onSubmit={handleSubmit}>
                            <div className="auth-field">
                                <div className={`auth-input-wrapper ${error ? 'error' : ''}`}>
                                    <FiMail className="auth-input-icon" />
                                    <input 
                                        type="email" 
                                        className={`auth-input ${error ? 'error' : ''}`}
                                        placeholder="E-mail" 
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            if (error) setError('');
                                        }}
                                    />
                                </div>
                                {error && <div className="auth-error-text">{error}</div>}
                            </div>

                            <button type="submit" className="auth-submit-btn">
                                Send Reset Link
                                <span className="btn-icon">→</span>
                            </button>
                        </form>
                    ) : (
                        <div className="auth-glass-success">
                            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem', letterSpacing: '-0.5px' }}>Check your email</h3>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '2rem', fontSize: '1.05rem' }}>
                                We&apos;ve sent a secure link to update your password. Kindly check your inbox.
                            </p>
                            {/* Temporary link for testing purposes since emails aren't real yet */}
                            <Link href="/update-password" style={{ display: 'inline-block', padding: '0.9rem 1.5rem', background: 'var(--accent)', color: 'var(--bg-body)', borderRadius: '6px', textDecoration: 'none', fontWeight: 600, fontSize: '0.95rem' }}>
                                [Simulate Email Link: Update Password]
                            </Link>
                        </div>
                    )}

                    <div className="auth-switch" style={{ marginTop: '2.5rem' }}>
                        Remember your password? <Link href="/login">Back to log in</Link>
                    </div>
                </div>
            </div>

            <AuthRightPanel />
        </>
    );
}
