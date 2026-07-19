'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import './onboarding.css';

export default function OnboardingPage() {
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const router = useRouter();

    const handleContinue = () => {
        // In a real flow, save the option to the backend, then navigate to next step
        router.push('/onboarding/step-2');
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
                <div className="onboarding-subtitle">Onboarding</div>
                <h1 className="onboarding-title">What is your primary goal with OShift?</h1>
                <p className="onboarding-desc">
                    Select your main objective so we can tailor the dashboard and insights to focus on what matters most to your business.
                </p>

                <div className="onboarding-options">
                    <div 
                        className={`onboarding-option ${selectedOption === 'expansion' ? 'selected' : ''}`}
                        onClick={() => setSelectedOption('expansion')}
                    >
                        <div className="onboarding-option-icon">
                            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="2" y1="12" x2="22" y2="12"/>
                                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                            </svg>
                        </div>
                        <div>
                            <h3>Market Expansion</h3>
                            <p>Discover new markets and analyze entry viability.</p>
                        </div>
                    </div>

                    <div 
                        className={`onboarding-option ${selectedOption === 'tracking' ? 'selected' : ''}`}
                        onClick={() => setSelectedOption('tracking')}
                    >
                        <div className="onboarding-option-icon">
                            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"/>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                            </svg>
                        </div>
                        <div>
                            <h3>Competitor Tracking</h3>
                            <p>Monitor pricing, features, and sentiment changes.</p>
                        </div>
                    </div>

                    <div 
                        className={`onboarding-option ${selectedOption === 'innovation' ? 'selected' : ''}`}
                        onClick={() => setSelectedOption('innovation')}
                    >
                        <div className="onboarding-option-icon">
                            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                            </svg>
                        </div>
                        <div>
                            <h3>Product Innovation</h3>
                            <p>Identify feature gaps and user pain points.</p>
                        </div>
                    </div>
                </div>

                <div className="onboarding-footer">
                    <div className="onboarding-dots">
                        <div className="onboarding-dot active"></div>
                        <div className="onboarding-dot"></div>
                        <div className="onboarding-dot"></div>
                        <div className="onboarding-dot"></div>
                        <div className="onboarding-dot"></div>
                        <div className="onboarding-dot"></div>
                    </div>
                    
                    <div className="onboarding-actions">
                        <button className="onboarding-back" onClick={() => router.push('/signup')}>
                            <FiChevronLeft />
                            Back
                        </button>
                        <button 
                            className="onboarding-continue" 
                            onClick={handleContinue} 
                            disabled={!selectedOption} 
                            style={{ opacity: selectedOption ? 1 : 0.5, cursor: selectedOption ? 'pointer' : 'not-allowed' }}
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
