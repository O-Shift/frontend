'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { FiMail, FiLock, FiEye, FiEyeOff, FiUser } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import AuthRightPanel from '@/components/AuthRightPanel';
import { signInWithGoogle } from '@/lib/api';
import { createClient } from '@/utils/supabase/client';

const ROLES = [
  'Founder / Owner',
  'Executive',
  'Strategy',
  'Business Development',
  'Marketing',
  'Product',
  'Sales',
  'Operations',
  'Consultant',
  'Other',
] as const;

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [jobRole, setJobRole] = useState<string>(ROLES[0]);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setCheckEmail(false);

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent('/onboarding')}`;

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          job_role: jobRole,
        },
        emailRedirectTo: redirectTo,
      },
    });

    setLoading(false);

    if (signUpError) {
      const msg = signUpError.message.toLowerCase();
      if (msg.includes('already registered') || msg.includes('already exists')) {
        setError('An account with this email already exists. Log in instead.');
      } else {
        setError(signUpError.message);
      }
      return;
    }

    // Duplicate signup: Supabase may return 200 with no error but zero identities.
    if (data.user && (data.user.identities?.length ?? 0) === 0) {
      setError('An account with this email already exists. Log in instead.');
      return;
    }

    if (data.session) {
      router.push('/onboarding');
      router.refresh();
      return;
    }

    setCheckEmail(true);
  };

  const handleGoogleSignup = async () => {
    setOauthLoading(true);
    setError(null);
    const { error: oauthError } = await signInWithGoogle('/workspaces');
    setOauthLoading(false);
    if (oauthError) {
      setError(oauthError.message);
    }
  };

  return (
    <>
      <div className="auth-left">
        <div className="auth-content">
          <div className="auth-logo">
            <Image src="/orange logo.png" alt="OShift Logo" width={160} height={60} priority />
          </div>

          <div className="auth-header">
            <h1 style={{ fontSize: '2rem' }}>Create your OShift account</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              Email and password, or continue with Google. Workspace setup comes next.
            </p>
          </div>

          {error ? (
            <p role="alert" style={{ color: 'var(--accent)', marginBottom: '1rem' }}>
              {error}
            </p>
          ) : null}

          {checkEmail ? (
            <div className="auth-form">
              <p>Check your email to confirm your account, then sign in.</p>
              <Link href="/login" className="auth-submit-btn" style={{ display: 'inline-block', marginTop: '1rem' }}>
                Go to login
              </Link>
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleSignup}>
              <div className="auth-field">
                <div className="auth-input-wrapper">
                  <FiUser className="auth-input-icon" />
                  <input
                    type="text"
                    className="auth-input"
                    placeholder="Full name"
                    required
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              </div>

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
                <label className="auth-label" htmlFor="job-role" style={{ display: 'block', marginBottom: 6, fontSize: '0.85rem' }}>
                  Role in company
                </label>
                <select
                  id="job-role"
                  className="auth-input"
                  style={{ width: '100%', padding: '0.85rem 1rem' }}
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                >
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="auth-field">
                <div className="auth-input-wrapper">
                  <FiLock className="auth-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="auth-input"
                    placeholder="Password (min. 8 characters)"
                    required
                    minLength={8}
                    autoComplete="new-password"
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

              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? 'Creating account…' : 'Create account'}
                {!loading ? (
                  <span style={{ marginLeft: '4px', fontSize: '1.2rem' }}>→</span>
                ) : null}
              </button>

            </form>
          )}

          {!checkEmail ? (
            <>
              <div className="auth-divider">or continue with</div>

              <div className="auth-social">
                <button
                  type="button"
                  className="auth-social-btn google"
                  onClick={handleGoogleSignup}
                  disabled={oauthLoading}
                  aria-label="Sign up with Google"
                >
                  <FcGoogle />
                </button>
              </div>
            </>
          ) : null}

          {!checkEmail ? (
            <div className="auth-switch" style={{ marginTop: '2rem' }}>
              Already have an account? <Link href="/login">Log in</Link>
            </div>
          ) : null}
        </div>
      </div>
      <AuthRightPanel />
    </>
  );
}
