'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { FaMicrosoft, FaApple } from 'react-icons/fa';
import AuthRightPanel from '@/components/AuthRightPanel';
import { signInWithGoogle } from '@/lib/api';
import { createClient } from '@/utils/supabase/client';

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [oauthLoading, setOauthLoading] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

    const from = searchParams.get('from');
    const afterLogin = from && from.startsWith('/') ? from : '/workspaces';

    const handleLogin = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        
        const newErrors: { email?: string; password?: string; general?: string } = {};
        
        if (!email) {
            newErrors.email = 'Email address is required';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Please enter a valid email address';
        }
        
        if (!password) {
            newErrors.password = 'Password is required';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);
        setErrors({});
        
        const supabase = createClient();
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
        });
        
        setLoading(false);
        if (signInError) {
            setErrors({ general: signInError.message });
            return;
        }
        router.push(afterLogin);
        router.refresh();
    };

    const handleGoogleLogin = async () => {
        setOauthLoading(true);
        setErrors({});
        const { error: oauthError } = await signInWithGoogle(afterLogin);
        setOauthLoading(false);
        if (oauthError) {
            setErrors({ general: oauthError.message });
        }
    };

    return (
        <>
            {/* Left Side: Login Form */}
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
                        <h1>Welcome back</h1>
                        <p>Log in to continue your journey with <strong>OShift</strong>.</p>
                    </div>

                    <form className="auth-form" onSubmit={handleLogin}>
                        {errors.general && (
                            <div className="auth-error-box">
                                <FiAlertCircle className="auth-error-icon" />
                                {errors.general}
                            </div>
                        )}
                        <div className="auth-field">
                            <div className={`auth-input-wrapper ${errors.email ? 'error' : ''}`}>
                                <FiMail className="auth-input-icon" />
                                <input 
                                    type="email" 
                                    className={`auth-input ${errors.email ? 'error' : ''}`}
                                    placeholder="E-mail" 
                                    required
                                    autoComplete="email"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (errors.email) setErrors({ ...errors, email: undefined });
                                    }}
                                />
                            </div>
                            {errors.email && <div className="auth-error-text">{errors.email}</div>}
                        </div>

                        <div className="auth-field">
                            <div className={`auth-input-wrapper ${errors.password ? 'error' : ''}`}>
                                <FiLock className="auth-input-icon" />
                                <input 
                                    type={showPassword ? 'text' : 'password'}
                                    className={`auth-input ${errors.password ? 'error' : ''}`}
                                    placeholder="Password" 
                                    required
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (errors.password) setErrors({ ...errors, password: undefined });
                                    }}
                                />
                                <button
                                    type="button"
                                    className="auth-eye-btn"
                                    onClick={() => setShowPassword(prev => !prev)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <FiEye /> : <FiEyeOff />}
                                </button>
                            </div>
                            {errors.password && <div className="auth-error-text">{errors.password}</div>}
                        </div>

                        <div className="auth-options">
                            <label className="auth-checkbox">
                                <input type="checkbox" defaultChecked />
                                <span>Remember me</span>
                            </label>
                            <Link href="/forgot-password" className="auth-forgot">
                                Forgot password?
                            </Link>
                        </div>

                        <button type="submit" className="auth-submit-btn" disabled={loading}>
                            {loading ? 'Signing in…' : 'Log in'}
                            {!loading ? (
                                <span className="btn-icon">→</span>
                            ) : null}
                        </button>
                    </form>

                    <div className="auth-divider">or continue with</div>

                    <div className="auth-social">
                        <button 
                            type="button" 
                            className="auth-social-btn google" 
                            onClick={handleGoogleLogin}
                            disabled={oauthLoading}
                            aria-label="Sign in with Google"
                        >
                            <FcGoogle />
                        </button>
                        <button type="button" className="auth-social-btn microsoft" disabled aria-label="Sign in with Microsoft">
                            <FaMicrosoft color="#00a4ef" />
                        </button>
                        <button type="button" className="auth-social-btn apple" disabled aria-label="Sign in with Apple">
                            <FaApple />
                        </button>
                    </div>

                    <div className="auth-switch">
                        New to OShift? <Link href="/signup">Create an account</Link>
                    </div>
                </div>
            </div>

            {/* Right Side: Wavy Orange Panel */}
            <AuthRightPanel />
        </>
    );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-left" style={{ minHeight: '100vh', color: '#1a1a1a' }}>
          Loading…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
