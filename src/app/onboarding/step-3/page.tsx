'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiChevronLeft, FiChevronRight, FiHash, FiX } from 'react-icons/fi';
import '../onboarding.css';

export default function OnboardingStep3() {
    const [inputValue, setInputValue] = useState('');
    const [topics, setTopics] = useState<string[]>([]);
    const router = useRouter();

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && inputValue.trim()) {
            if (!topics.includes(inputValue.trim())) {
                setTopics([...topics, inputValue.trim()]);
            }
            setInputValue('');
        }
    };

    const handleRemove = (topic: string) => {
        setTopics(topics.filter(t => t !== topic));
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
                <div className="onboarding-subtitle">Step 3 of 6</div>
                <h1 className="onboarding-title">What topics matter most?</h1>
                <p className="onboarding-desc">
                    Add keywords, product categories, or industry trends. Hermes will prioritize signals related to these topics.
                </p>

                <div style={{ width: '100%', maxWidth: '600px', marginBottom: '60px' }}>
                    
                    {topics.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                            {topics.map(t => (
                                <div key={t} style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    background: 'var(--item-hover)', border: '1px solid var(--border-color)',
                                    padding: '6px 12px', borderRadius: '16px', fontSize: '14px', color: 'var(--text-primary)'
                                }}>
                                    <FiHash style={{ color: 'var(--accent)' }} />
                                    {t}
                                    <FiX style={{ cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => handleRemove(t)} />
                                </div>
                            ))}
                        </div>
                    )}

                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        background: 'var(--card-bg-alt)', 
                        border: '1px solid var(--border-color)', 
                        borderRadius: '12px',
                        padding: '14px 16px',
                        gap: '12px'
                    }}>
                        <FiHash style={{ color: 'var(--text-secondary)', fontSize: '20px' }} />
                        <input 
                            type="text" 
                            placeholder="Type a topic and press Enter..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-primary)',
                                fontSize: '16px',
                                outline: 'none',
                                width: '100%'
                            }}
                        />
                    </div>
                </div>

                <div className="onboarding-footer">
                    <div className="onboarding-dots">
                        <div className="onboarding-dot"></div>
                        <div className="onboarding-dot"></div>
                        <div className="onboarding-dot active"></div>
                        <div className="onboarding-dot"></div>
                        <div className="onboarding-dot"></div>
                        <div className="onboarding-dot"></div>
                    </div>
                    
                    <div className="onboarding-actions">
                        <button className="onboarding-back" onClick={() => router.push('/onboarding/step-2')}>
                            <FiChevronLeft />
                            Back
                        </button>
                        <button 
                            className="onboarding-continue" 
                            onClick={() => router.push('/onboarding/step-4')}
                        >
                            Continue
                            <FiChevronRight />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
