'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Mail, AlertCircle } from 'lucide-react';
import AuthRightPanel from '@/components/AuthRightPanel';
import { createClient } from '@/utils/supabase/client';

export default function ForgotPasswordPage() {
    const [isSent, setIsSent] = useState(false);
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const cleanEmail = email.trim();
        if (!cleanEmail) {
            setError('Please enter your email address');
            return;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
            setError('Please enter a valid email address');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const supabase = createClient();
            const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/update-password` : undefined;
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, { redirectTo });

            if (resetError) {
                setError(resetError.message);
                return;
            }
            setIsSent(true);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
            setError(message);
        } finally {
            setLoading(false);
        }
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
                        <form className="auth-form" onSubmit={handleSubmit} noValidate>
                            <div className="auth-field">
                                <div className={`auth-input-wrapper ${error ? 'error' : ''}`}>
                                    <Mail className="auth-input-icon" />
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
                                {error && (
                                    <div className="auth-error-text">
                                        <AlertCircle style={{ width: 14, height: 14, flexShrink: 0 }} />
                                        <span>{error}</span>
                                    </div>
                                )}
                            </div>

                            <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
                                {loading ? 'Sending…' : 'Send Reset Link'}
                                {!loading ? (
                                    <span className="btn-icon">→</span>
                                ) : null}
                            </button>
                        </form>
                    ) : (
                        <div className="auth-glass-success">
                            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem', letterSpacing: '-0.5px' }}>Check your email</h3>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '2rem', fontSize: '1.05rem' }}>
                                We&apos;ve sent a secure link to update your password. Kindly check your inbox.
                            </p>
                            
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
