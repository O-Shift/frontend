'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { FiMail } from 'react-icons/fi';
import AuthRightPanel from '@/components/AuthRightPanel';

export default function ForgotPasswordPage() {
    const [isSent, setIsSent] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
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
                                <div className="auth-input-wrapper">
                                    <FiMail className="auth-input-icon" />
                                    <input 
                                        type="email" 
                                        className="auth-input" 
                                        placeholder="E-mail" 
                                        required 
                                    />
                                </div>
                            </div>

                            <button type="submit" className="auth-submit-btn glow">
                                Send Reset Link
                                <span className="btn-icon" style={{ marginLeft: '4px', fontSize: '1.2rem' }}>→</span>
                            </button>
                        </form>
                    ) : (
                        <div className="auth-glass-success">
                            <div className="auth-pulse-icon">✉️</div>
                            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1a1a1a', marginBottom: '0.5rem', letterSpacing: '-0.5px' }}>Check your email</h3>
                            <p style={{ color: '#555', lineHeight: 1.6, marginBottom: '2rem', fontSize: '1.05rem' }}>
                                We&apos;ve sent a secure link to update your password. Kindly check your inbox.
                            </p>
                            {/* Temporary link for testing purposes since emails aren't real yet */}
                            <Link href="/update-password" style={{ display: 'inline-block', padding: '1rem 2rem', background: '#1a1a1a', color: 'white', borderRadius: '10px', textDecoration: 'none', fontWeight: 600, fontSize: '0.95rem', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
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
