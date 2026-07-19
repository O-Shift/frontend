'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiChevronLeft, FiChevronRight, FiMail, FiUserPlus } from 'react-icons/fi';
import '../onboarding.css';

export default function OnboardingStep6() {
    const [emails, setEmails] = useState(['']);
    const router = useRouter();

    const handleEmailChange = (index: number, value: string) => {
        const newEmails = [...emails];
        newEmails[index] = value;
        setEmails(newEmails);
    };

    const addEmailField = () => {
        setEmails([...emails, '']);
    };

    const handleComplete = () => {
        // In a real app, send invites, then redirect
        router.push('/');
    };

    return (
        <div className="onboarding-container">
            <div className="onboarding-bg-mesh">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
                <div className="blob blob-3"></div>
                <div className="blob blob-4"></div>
                <div className="blob blob-5"></div>
                <div className="blob blob-6"></div>
            </div>
            <div className="onboarding-card">
                <div className="onboarding-subtitle">Step 6 of 6</div>
                <h1 className="onboarding-title">Invite your team</h1>
                <p className="onboarding-desc">
                    OShift works best when your whole team is aligned on competitor movements. Invite your colleagues to your workspace.
                </p>

                <div style={{ width: '100%', maxWidth: '500px', marginBottom: '40px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    
                    {emails.map((email, i) => (
                        <div key={i} style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            background: 'var(--card-bg-alt)', 
                            border: '1px solid var(--border-color)', 
                            borderRadius: '12px',
                            padding: '12px 16px',
                            gap: '12px'
                        }}>
                            <FiMail style={{ color: 'var(--text-secondary)' }} />
                            <input 
                                type="email" 
                                placeholder="colleague@company.com"
                                value={email}
                                onChange={(e) => handleEmailChange(i, e.target.value)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--text-primary)',
                                    fontSize: '15px',
                                    outline: 'none',
                                    width: '100%'
                                }}
                            />
                        </div>
                    ))}

                    <button 
                        onClick={addEmailField}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            background: 'transparent',
                            border: '1px dashed var(--border-color)',
                            color: 'var(--text-secondary)',
                            padding: '12px',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            marginTop: '8px',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                    >
                        <FiUserPlus />
                        Add another
                    </button>
                </div>

                <div className="onboarding-footer">
                    <div className="onboarding-dots">
                        <div className="onboarding-dot"></div>
                        <div className="onboarding-dot"></div>
                        <div className="onboarding-dot"></div>
                        <div className="onboarding-dot"></div>
                        <div className="onboarding-dot"></div>
                        <div className="onboarding-dot active"></div>
                    </div>
                    
                    <div className="onboarding-actions">
                        <button className="onboarding-back" onClick={() => router.push('/onboarding/step-5')}>
                            <FiChevronLeft />
                            Back
                        </button>
                        <button 
                            className="onboarding-continue" 
                            onClick={handleComplete}
                        >
                            Go to Dashboard
                            <FiChevronRight />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
