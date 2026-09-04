'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, User, Briefcase, ChevronDown, AlertCircle } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import AuthRightPanel from '@/components/AuthRightPanel';
import { EVENTS, track } from '@/lib/analytics';
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
    'Other'
];

export default function SignupPage() {
    const router = useRouter();
    const [roleSearch, setRoleSearch] = useState('');
    const [selectedRole, setSelectedRole] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    
    // Form State
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [customRole, setCustomRole] = useState('');
    const [password, setPassword] = useState('');
    
    // UI State
    const [loading, setLoading] = useState(false);
    const [oauthLoading, setOauthLoading] = useState(false);
    const [checkEmail, setCheckEmail] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string | undefined }>({});

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const finalRole = selectedRole === 'Other' ? customRole.trim() : selectedRole;
        const newErrors: { [key: string]: string } = {};
        
        if (!name.trim()) newErrors.name = 'Full name is required';
        
        if (!email) newErrors.email = 'Work email is required';
        else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Please enter a valid email address';
        
        if (!selectedRole && !roleSearch) newErrors.role = 'Please select your role';
        
        if (selectedRole === 'Other' && !customRole.trim()) newErrors.customRole = 'Please specify your role';
        
        if (!password) newErrors.password = 'Password is required';
        else if (password.length < 8) newErrors.password = 'Password must be at least 8 characters';
        
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            track(EVENTS.SIGNUP_FAILED, { method: 'password', reason: password.length < 8 && password.length > 0 ? 'password_too_short' : 'validation_error' });
            return;
        }

        setLoading(true);
        setErrors({});
        setCheckEmail(false);
        track(EVENTS.SIGNUP_SUBMITTED, { method: 'password', job_role: finalRole });

        const supabase = createClient();
        const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent('/onboarding')}`;

        const { data, error: signUpError } = await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
                data: {
                    full_name: name.trim(),
                    job_role: finalRole,
                },
                emailRedirectTo: redirectTo,
            },
        });

        setLoading(false);

        if (signUpError) {
            let errorMsg = signUpError.message;
            if (!errorMsg || errorMsg === '{}' || typeof errorMsg !== 'string') {
                errorMsg = 'An unexpected error occurred. If you already have an account, please log in.';
            }
            const lower = errorMsg.toLowerCase();
            if (lower.includes('already registered') || lower.includes('already exists') || lower.includes('duplicate key') || lower.includes('23505') || ('code' in signUpError && signUpError.code === '23505')) {
                setErrors({ general: 'An account with this email already exists. Log in instead.' });
                track(EVENTS.SIGNUP_FAILED, { method: 'password', reason: 'email_already_registered' });
            } else {
                setErrors({ general: errorMsg });
                track(EVENTS.SIGNUP_FAILED, { method: 'password', reason: errorMsg });
            }
            return;
        }

        // Duplicate signup: Supabase may return 200 with no error but zero identities.
        if (data.user && (data.user.identities?.length ?? 0) === 0) {
            setErrors({ general: 'An account with this email already exists. Log in instead.' });
            track(EVENTS.SIGNUP_FAILED, { method: 'password', reason: 'email_already_registered' });
            return;
        }

        if (data.session) {
            track(EVENTS.SIGNUP_SUCCEEDED, {
                method: 'password',
                job_role: finalRole,
                email_confirmation_required: false,
            });
            router.push('/onboarding');
            router.refresh();
            return;
        }

        track(EVENTS.SIGNUP_SUCCEEDED, {
            method: 'password',
            job_role: finalRole,
            email_confirmation_required: true,
        });
        setCheckEmail(true);
    };

    const handleGoogleSignup = async () => {
        setOauthLoading(true);
        setErrors({});
        track(EVENTS.SIGNUP_SUBMITTED, { method: 'google' });
        const { error: oauthError } = await signInWithGoogle('/workspaces');
        setOauthLoading(false);
        if (oauthError) {
            setErrors({ general: oauthError.message });
            track(EVENTS.SIGNUP_FAILED, { method: 'google', reason: oauthError.message });
        }
    };
    
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredRoles = ROLES.filter(role => 
        role.toLowerCase().includes(roleSearch.toLowerCase())
    );

    const handleRoleSelect = (role: string) => {
        setSelectedRole(role);
        setRoleSearch(role);
        setIsDropdownOpen(false);
        if (errors.role) {
            const newErrors = { ...errors };
            delete newErrors.role;
            setErrors(newErrors);
        }
    };

    return (
        <>
            {/* Left Side: Signup Form */}
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
                        <h1>Create your OShift account</h1>
                        {!checkEmail && (
                            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                Email and password, or continue with Google. Workspace setup comes next.
                            </p>
                        )}
                    </div>

                    {checkEmail ? (
                        <div className="auth-form">
                            <p>Check your email to confirm your account, then sign in.</p>
                            <Link href="/login" className="btn-primary" style={{ display: 'inline-block', marginTop: '1rem', textAlign: 'center' }}>
                                Go to login
                            </Link>
                        </div>
                    ) : (
                        <form className="auth-form" onSubmit={handleSignup}>
                            {errors.general && (
                                <div className="auth-error-box">
                                    <AlertCircle className="auth-error-icon" />
                                    {errors.general}
                                </div>
                            )}
                            
                            <div className="auth-field">
                                <div className={`auth-input-wrapper ${errors.name ? 'error' : ''}`}>
                                    <User className="auth-input-icon" />
                                    <input 
                                        type="text" 
                                        className={`auth-input ${errors.name ? 'error' : ''}`}
                                        placeholder="Full name" 
                                        aria-label="Full name"
                                        autoComplete="name"
                                        value={name}
                                        onChange={(e) => { setName(e.target.value); if(errors.name) setErrors({...errors, name: undefined}); }}
                                    />
                                </div>
                                {errors.name && <div className="auth-error-text">{errors.name}</div>}
                            </div>

                            <div className="auth-field">
                                <div className={`auth-input-wrapper ${errors.email ? 'error' : ''}`}>
                                    <Mail className="auth-input-icon" />
                                    <input 
                                        type="email" 
                                        className={`auth-input ${errors.email ? 'error' : ''}`}
                                        placeholder="Work email" 
                                        aria-label="Work email"
                                        autoComplete="email"
                                        value={email}
                                        onChange={(e) => { setEmail(e.target.value); if(errors.email) setErrors({...errors, email: undefined}); }}
                                    />
                                </div>
                                {errors.email && <div className="auth-error-text">{errors.email}</div>}
                            </div>

                            <div className="auth-field" ref={dropdownRef}>
                                <div className={`auth-input-wrapper ${errors.role ? 'error' : ''}`}>
                                    <Briefcase className="auth-input-icon" />
                                    <input 
                                        type="text" 
                                        className={`auth-input ${errors.role ? 'error' : ''}`}
                                        placeholder="Role in company" 
                                        aria-label="Role in company"
                                        value={roleSearch}
                                        onChange={(e) => {
                                            setRoleSearch(e.target.value);
                                            setIsDropdownOpen(true);
                                            if(errors.role) setErrors({...errors, role: undefined});
                                        }}
                                        onFocus={() => setIsDropdownOpen(true)}
                                    />
                                    <ChevronDown 
                                        className={`auth-input-icon right auth-dropdown-chevron ${isDropdownOpen ? 'open' : ''}`}
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    />
                                </div>
                                {errors.role && <div className="auth-error-text">{errors.role}</div>}

                                {isDropdownOpen && (
                                    <div className="auth-dropdown-menu">
                                        {filteredRoles.length > 0 ? (
                                            filteredRoles.map(role => (
                                                <div 
                                                    key={role} 
                                                    className={`auth-dropdown-item ${selectedRole === role ? 'active' : ''}`}
                                                    onClick={() => handleRoleSelect(role)}
                                                >
                                                    {role}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="auth-dropdown-empty">No roles found</div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Custom Role Field (Visible if 'Other' is selected) */}
                            {selectedRole === 'Other' && (
                                <div className="auth-field" style={{ marginTop: '-0.5rem', animation: 'fadeIn 0.3s' }}>
                                    <div className="auth-input-wrapper">
                                        <input 
                                            type="text" 
                                            className={`auth-input ${errors.customRole ? 'error' : ''}`}
                                            placeholder="Please specify your role" 
                                            aria-label="Please specify your role"
                                            style={{ paddingLeft: '1.2rem' }}
                                            value={customRole}
                                            onChange={(e) => { setCustomRole(e.target.value); if(errors.customRole) setErrors({...errors, customRole: undefined}); }}
                                        />
                                    </div>
                                    {errors.customRole && <div className="auth-error-text">{errors.customRole}</div>}
                                </div>
                            )}

                            <div className="auth-field">
                                <div className={`auth-input-wrapper ${errors.password ? 'error' : ''}`}>
                                    <Lock className="auth-input-icon" />
                                    <input 
                                        type={showPassword ? 'text' : 'password'}
                                        className={`auth-input ${errors.password ? 'error' : ''}`}
                                        placeholder="Password (min. 8 characters)" 
                                        aria-label="Password (min. 8 characters)"
                                        autoComplete="new-password"
                                        value={password}
                                        onChange={(e) => { setPassword(e.target.value); if(errors.password) setErrors({...errors, password: undefined}); }}
                                    />
                                    <button
                                        type="button"
                                        className="auth-eye-btn"
                                        onClick={() => setShowPassword(prev => !prev)}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <Eye /> : <EyeOff />}
                                    </button>
                                </div>
                                {errors.password && <div className="auth-error-text">{errors.password}</div>}
                            </div>

                            <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
                                {loading ? 'Creating account…' : 'Create account'}
                                {!loading ? (
                                    <span className="btn-icon">→</span>
                                ) : null}
                            </button>
                        </form>
                    )}

                    {!checkEmail && (
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
                    )}

                    {!checkEmail && (
                        <div className="auth-switch" style={{ marginTop: '2rem' }}>
                            Already have an account? <Link href="/login">Log in</Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Side: Wavy Orange Panel */}
            <AuthRightPanel />
        </>
    );
}
