'use client';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import AuthRightPanel from '@/components/AuthRightPanel';
import { createClient } from '@/utils/supabase/client';

export default function UpdatePasswordPage() {
    const router = useRouter();
    const [showPassword1, setShowPassword1] = useState(false);
    const [showPassword2, setShowPassword2] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const checkParams = () => {
            const searchParams = new URLSearchParams(window.location.search);
            const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));

            const errorDesc = searchParams.get('error_description') || hashParams.get('error_description');
            const errorMsg = searchParams.get('error') || hashParams.get('error');

            const decodeParam = (param: string) => {
                try {
                    return decodeURIComponent(param.replace(/\+/g, ' '));
                } catch {
                    return param;
                }
            };

            if (errorDesc) {
                setError(decodeParam(errorDesc));
            } else if (errorMsg) {
                setError(decodeParam(errorMsg));
            }
        };

        checkParams();
        window.addEventListener('hashchange', checkParams);
        return () => window.removeEventListener('hashchange', checkParams);
    }, []);

    const getStrength = (pass: string) => {
        if (!pass) return { score: 0, label: '' };
        let score = 0;
        if (pass.length > 5) score += 1;
        if (pass.length > 8) score += 1;
        if (/[A-Z]/.test(pass) && /[0-9]/.test(pass)) score += 1;
        
        if (score === 1) return { score, label: 'Weak' };
        if (score === 2) return { score, label: 'Medium' };
        if (score >= 3) return { score, label: 'Strong' };
        return { score: 1, label: 'Weak' };
    };
    
    const strength = getStrength(password);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords don't match. Please try again.");
            return;
        }
        setError('');

        setLoading(true);
        try {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setError('Your reset link is invalid or has expired. Please request a new one.');
                return;
            }

            const { error: updateError } = await supabase.auth.updateUser({ password });
            if (updateError) {
                setError(updateError.message);
                return;
            }

            await supabase.auth.signOut();
            router.push('/login');
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
                        <h1>Update Password</h1>
                        <p>
                            Please enter your new password below.
                        </p>
                    </div>

                    <form className="auth-form" onSubmit={handleSubmit} noValidate>
                        {error && (
                            <div className="auth-error-box">
                                <AlertCircle className="auth-error-icon" />
                                <span>{error}</span>
                            </div>
                        )}
                        <div className="auth-field">
                            <div className="auth-input-wrapper">
                                <Lock className="auth-input-icon" />
                                <input 
                                    type={showPassword1 ? 'text' : 'password'}
                                    className="auth-input" 
                                    placeholder="New Password" 
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (error) setError('');
                                    }}
                                    required 
                                />
                                <button
                                    type="button"
                                    className="auth-eye-btn"
                                    onClick={() => setShowPassword1(prev => !prev)}
                                >
                                    {showPassword1 ? <Eye /> : <EyeOff />}
                                </button>
                            </div>
                            {password && (
                                <div style={{ marginTop: '0.5rem' }}>
                                    <div className="auth-strength-meter">
                                        <div className={`auth-strength-segment ${strength.score >= 1 ? 'active weak' : ''}`}></div>
                                        <div className={`auth-strength-segment ${strength.score >= 2 ? 'active medium' : ''}`}></div>
                                        <div className={`auth-strength-segment ${strength.score >= 3 ? 'active strong' : ''}`}></div>
                                    </div>
                                    <div className="auth-strength-label">{strength.label}</div>
                                </div>
                            )}
                        </div>

                        <div className="auth-field">
                            <div className="auth-input-wrapper">
                                <Lock className="auth-input-icon" />
                                <input 
                                    type={showPassword2 ? 'text' : 'password'}
                                    className="auth-input" 
                                    placeholder="Confirm New Password" 
                                    value={confirmPassword}
                                    onChange={(e) => {
                                        setConfirmPassword(e.target.value);
                                        if (error) setError('');
                                    }}
                                    required 
                                />
                                <button
                                    type="button"
                                    className="auth-eye-btn"
                                    onClick={() => setShowPassword2(prev => !prev)}
                                >
                                    {showPassword2 ? <Eye /> : <EyeOff />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="btn-primary glow" disabled={loading} style={{ marginTop: '0.5rem', width: '100%' }}>
                            {loading ? 'Saving…' : 'Save'}
                            {!loading && <span className="btn-icon" style={{ marginLeft: '4px', fontSize: '1.2rem' }}>→</span>}
                        </button>
                    </form>
                </div>
            </div>

            <AuthRightPanel />
        </>
    );
}
