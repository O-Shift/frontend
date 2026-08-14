'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import AuthRightPanel from '@/components/AuthRightPanel';
import { EVENTS, track } from '@/lib/analytics';
import { signInWithGoogle } from '@/lib/api';
import { createClient } from '@/utils/supabase/client';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = searchParams.get('from');
  const afterLogin = from && from.startsWith('/') ? from : '/workspaces';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    track(EVENTS.LOGIN_SUBMITTED, { method: 'password' });
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (signInError) {
      setError(signInError.message);
      track(EVENTS.LOGIN_FAILED, { method: 'password', reason: signInError.message });
      return;
    }
    track(EVENTS.LOGIN_SUCCEEDED, { method: 'password', destination: afterLogin });
    router.push(afterLogin);
    router.refresh();
  };

  const handleGoogleLogin = async () => {
    setOauthLoading(true);
    setError(null);
    track(EVENTS.LOGIN_SUBMITTED, { method: 'google' });
    const { error: oauthError } = await signInWithGoogle(afterLogin);
    setOauthLoading(false);
    if (oauthError) {
      setError(oauthError.message);
      track(EVENTS.LOGIN_FAILED, { method: 'google', reason: oauthError.message });
    }
  };

  return (
    <>
      <div className="auth-left">
        <div className="auth-content">
          <LogoBlock />

          <div className="auth-header">
            <h1>Welcome back</h1>
            <p>
              Log in to continue your journey with <strong>OShift</strong>.
            </p>
          </div>

          {error ? (
            <p role="alert" style={{ color: 'var(--accent)', marginBottom: '1rem' }}>
              {error}
            </p>
          ) : null}

          <form className="auth-form" onSubmit={handleLogin}>
            <div className="auth-field">
              <div className="auth-input-wrapper">
                <FiMail className="auth-input-icon" />
                <input
                  type="email"
                  className="auth-input"
                  placeholder="Work email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="auth-field">
              <div className="auth-input-wrapper">
                <FiLock className="auth-input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input"
                  placeholder="Password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <FiEye /> : <FiEyeOff />}
                </button>
              </div>
            </div>

            <div className="auth-options">
              <Link href="/forgot-password" className="auth-forgot">
                Forgot password?
              </Link>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? 'Signing in…' : 'Log in'}
              {!loading ? (
                <span className="btn-icon" style={{ marginLeft: '4px', fontSize: '1.2rem' }}>
                  →
                </span>
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
          </div>

          <div className="auth-switch">
            New to OShift? <Link href="/signup">Create an account</Link>
          </div>
        </div>
      </div>
      <AuthRightPanel />
    </>
  );
}

function LogoBlock() {
  return (
    <div className="auth-logo">
      <Image src="/orange logo.png" alt="OShift Logo" width={160} height={60} priority />
    </div>
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
