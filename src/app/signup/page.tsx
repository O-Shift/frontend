'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import '../signup.css';

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
];

const ONBOARDING_OPTIONS = [
    { id: 'opportunities', label: 'Discover opportunities', icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
    )},
    { id: 'competitors', label: 'Track competitors', icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 22h20L12 2z"/></svg>
    )},
    { id: 'partnerships', label: 'Build partnerships', icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    )},
    { id: 'campaigns', label: 'Plan campaigns', icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
    )},
    { id: 'signals', label: 'Analyze market signals', icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
    )},
];

export default function SignupPage() {
    const [step, setStep] = useState<'signup' | 'onboarding'>('signup');
    const [form, setForm] = useState({ fullName: '', email: '', role: '', customRole: '', phone: '', password: '' });
    const [roleSearch, setRoleSearch] = useState('');
    const [roleOpen, setRoleOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
    const [mascotState, setMascotState] = useState<'idle' | 'wave' | 'peek'>('idle');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const filteredRoles = ROLES.filter(r => r.toLowerCase().includes(roleSearch.toLowerCase()));

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setRoleOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Mascot reacts when user focuses password field
    const handlePasswordFocus = () => setMascotState('peek');
    const handlePasswordBlur = () => setMascotState('idle');
    const handleNameFocus = () => setMascotState('wave');
    const handleNameBlur = () => setMascotState('idle');

    const toggleGoal = (id: string) => {
        setSelectedGoals(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setStep('onboarding');
    };

    return (
        <div className="signup-root">
            {/* Animated gradient background */}
            <div className="signup-bg-gradient" />

            <div className="signup-split">
                {/* LEFT PANEL */}
                <div className="signup-left">
                    {/* Giant animated background logo watermark */}
                    <div className="signup-bg-logo">
                        <svg viewBox="0 0 200 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="signup-logo-svg">
                            <text x="0" y="70" fontFamily="inherit" fontWeight="900" fontSize="90" fill="white" opacity="1">OShift</text>
                        </svg>
                    </div>

                    <div className="signup-left-content">
                        {/* Logo top-left */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            className="signup-logo"
                        >
                            <div className="signup-logo-mark">O</div>
                            <span>OShift</span>
                        </motion.div>

                        {/* Mascot */}
                        <motion.div
                            className="signup-mascot-wrapper"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <motion.div
                                className="signup-mascot"
                                animate={
                                    mascotState === 'wave' ? { rotate: [0, -10, 10, -10, 0], scale: [1, 1.05, 1] } :
                                    mascotState === 'peek' ? { y: [0, -12, 0], rotate: [-5, 5, -5] } :
                                    { y: [0, -8, 0], rotate: [0, 1, -1, 0] }
                                }
                                transition={
                                    mascotState === 'idle'
                                        ? { duration: 4, repeat: Infinity, ease: 'easeInOut' }
                                        : { duration: 0.6, ease: 'easeInOut' }
                                }
                            >
                                <Image src="/mascot.png" alt="OShift Mascot" width={220} height={280} priority style={{ objectFit: 'contain', filter: 'drop-shadow(0 24px 48px rgba(0,0,0,0.35))' }} />
                            </motion.div>

                            {/* Speech bubble reacting to actions */}
                            <AnimatePresence>
                                {mascotState === 'wave' && (
                                    <motion.div className="mascot-bubble" initial={{ opacity: 0, scale: 0.7, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.7 }} transition={{ duration: 0.3 }}>
                                        Nice to meet you! 👋
                                    </motion.div>
                                )}
                                {mascotState === 'peek' && (
                                    <motion.div className="mascot-bubble" initial={{ opacity: 0, scale: 0.7, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.7 }} transition={{ duration: 0.3 }}>
                                        I&apos;ll look away... 🤫
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>

                        {/* Tagline */}
                        <motion.div
                            className="signup-tagline"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.8 }}
                        >
                            <h1>Always one step<br /><em>ahead.</em></h1>
                            <p>Competitive intelligence built for the bold.</p>
                        </motion.div>
                    </div>
                </div>

                {/* RIGHT PANEL */}
                <div className="signup-right">
                    <AnimatePresence mode="wait">
                        {step === 'signup' ? (
                            <motion.div
                                key="signup"
                                className="signup-form-container"
                                initial={{ opacity: 0, x: 40 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -40 }}
                                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                            >
                                <div className="signup-form-header">
                                    <h2>Create your OShift account</h2>
                                    <p>Tell us who you are so we can personalize your experience.</p>
                                </div>

                                <form onSubmit={handleSubmit} className="signup-form">
                                    {/* Full Name */}
                                    <div className="signup-field">
                                        <label>Full name</label>
                                        <div className="signup-input-wrapper">
                                            <svg className="signup-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                            <input
                                                type="text"
                                                placeholder="Jane Doe"
                                                value={form.fullName}
                                                onChange={e => setForm({ ...form, fullName: e.target.value })}
                                                onFocus={handleNameFocus}
                                                onBlur={handleNameBlur}
                                                className="signup-input"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Work Email */}
                                    <div className="signup-field">
                                        <label>Work email</label>
                                        <div className="signup-input-wrapper">
                                            <svg className="signup-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                                            <input
                                                type="email"
                                                placeholder="you@company.com"
                                                value={form.email}
                                                onChange={e => setForm({ ...form, email: e.target.value })}
                                                className="signup-input"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Role Searchable Dropdown */}
                                    <div className="signup-field" ref={dropdownRef}>
                                        <label>Role in company</label>
                                        <div className="signup-dropdown-wrapper">
                                            <div className="signup-input-wrapper" onClick={() => setRoleOpen(!roleOpen)} style={{ cursor: 'pointer' }}>
                                                <svg className="signup-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                                                <input
                                                    type="text"
                                                    placeholder="Select your role..."
                                                    value={roleOpen ? roleSearch : form.role}
                                                    onChange={e => { setRoleSearch(e.target.value); setRoleOpen(true); }}
                                                    onFocus={() => { setRoleOpen(true); setRoleSearch(''); }}
                                                    className="signup-input"
                                                    readOnly={!roleOpen}
                                                    required
                                                />
                                                <motion.div animate={{ rotate: roleOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="signup-dropdown-chevron">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                                                </motion.div>
                                            </div>
                                            <AnimatePresence>
                                                {roleOpen && (
                                                    <motion.div
                                                        className="signup-dropdown-menu"
                                                        initial={{ opacity: 0, y: -8, scaleY: 0.95 }}
                                                        animate={{ opacity: 1, y: 0, scaleY: 1 }}
                                                        exit={{ opacity: 0, y: -8, scaleY: 0.95 }}
                                                        transition={{ duration: 0.15 }}
                                                        style={{ transformOrigin: 'top' }}
                                                    >
                                                        {filteredRoles.length === 0 ? (
                                                            <div className="signup-dropdown-empty">No roles found</div>
                                                        ) : filteredRoles.map(role => (
                                                            <button
                                                                key={role}
                                                                type="button"
                                                                className={`signup-dropdown-item ${form.role === role ? 'active' : ''}`}
                                                                onClick={() => {
                                                                    setForm({ ...form, role });
                                                                    setRoleSearch('');
                                                                    setRoleOpen(false);
                                                                }}
                                                            >
                                                                {form.role === role && (
                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                                                                )}
                                                                {role}
                                                            </button>
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        {/* Custom role field */}
                                        <AnimatePresence>
                                            {form.role === 'Other' && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    transition={{ duration: 0.25 }}
                                                    style={{ overflow: 'hidden', marginTop: 8 }}
                                                >
                                                    <input
                                                        type="text"
                                                        placeholder="Describe your role..."
                                                        value={form.customRole}
                                                        onChange={e => setForm({ ...form, customRole: e.target.value })}
                                                        className="signup-input"
                                                        style={{ paddingLeft: 16 }}
                                                    />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Phone */}
                                    <div className="signup-field">
                                        <label>Phone number</label>
                                        <div className="signup-input-wrapper">
                                            <svg className="signup-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.6 19.79 19.79 0 0 1 1.58 5a2 2 0 0 1 1.99-2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.46a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                                            <input
                                                type="tel"
                                                placeholder="+1 (555) 000-0000"
                                                value={form.phone}
                                                onChange={e => setForm({ ...form, phone: e.target.value })}
                                                className="signup-input"
                                            />
                                        </div>
                                    </div>

                                    {/* Password */}
                                    <div className="signup-field">
                                        <label>Password</label>
                                        <div className="signup-input-wrapper">
                                            <svg className="signup-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                placeholder="Create a strong password"
                                                value={form.password}
                                                onChange={e => setForm({ ...form, password: e.target.value })}
                                                onFocus={handlePasswordFocus}
                                                onBlur={handlePasswordBlur}
                                                className="signup-input"
                                                required
                                            />
                                            <button type="button" className="signup-password-toggle" onClick={() => setShowPassword(!showPassword)}>
                                                {showPassword
                                                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                                                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                                }
                                            </button>
                                        </div>

                                        {/* Password strength indicator */}
                                        {form.password.length > 0 && (
                                            <div className="signup-password-strength">
                                                {[0, 1, 2, 3].map(i => (
                                                    <div key={i} className={`strength-bar ${form.password.length > i * 3 ? (form.password.length < 6 ? 'weak' : form.password.length < 10 ? 'medium' : 'strong') : ''}`} />
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <motion.button
                                        type="submit"
                                        className="signup-submit-btn"
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                    >
                                        Create my account
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                                    </motion.button>

                                    <p className="signup-login-link">
                                        Already have an account? <Link href="/login">Log in</Link>
                                    </p>
                                </form>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="onboarding"
                                className="signup-form-container"
                                initial={{ opacity: 0, x: 40 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -40 }}
                                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                            >
                                <div className="signup-form-header">
                                    <div className="signup-success-badge">Account created!</div>
                                    <h2>How do you plan to use OShift?</h2>
                                    <p>Select all that apply. We&apos;ll tailor your experience accordingly.</p>
                                </div>

                                <div className="onboarding-options">
                                    {ONBOARDING_OPTIONS.map((opt, i) => (
                                        <motion.button
                                            key={opt.id}
                                            type="button"
                                            className={`onboarding-option ${selectedGoals.includes(opt.id) ? 'selected' : ''}`}
                                            onClick={() => toggleGoal(opt.id)}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.08, duration: 0.4 }}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <div className="onboarding-option-icon">{opt.icon}</div>
                                            <span>{opt.label}</span>
                                            <div className="onboarding-option-check">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                                            </div>
                                        </motion.button>
                                    ))}
                                </div>

                                <motion.button
                                    className="signup-submit-btn"
                                    style={{ marginTop: 32 }}
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    onClick={() => {}}
                                >
                                    Get started
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                                </motion.button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
