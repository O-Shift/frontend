'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiChevronLeft, FiChevronRight, FiSearch, FiX, FiCheck } from 'react-icons/fi';
import '../onboarding.css';
import Image from 'next/image';
import { createCompetitorsBatch } from '@/lib/api';


const MOCK_COMPANIES = [
    { name: 'Apple', domain: 'apple.com' },
    { name: 'Tesla', domain: 'tesla.com' },
    { name: 'Microsoft', domain: 'microsoft.com' },
    { name: 'Google', domain: 'google.com' },
    { name: 'Amazon', domain: 'amazon.com' },
    { name: 'Netflix', domain: 'netflix.com' },
    { name: 'Meta', domain: 'meta.com' },
    { name: 'OpenAI', domain: 'openai.com' },
    { name: 'Anthropic', domain: 'anthropic.com' },
    { name: 'Stripe', domain: 'stripe.com' },
    { name: 'Shopify', domain: 'shopify.com' },
    { name: 'Spotify', domain: 'spotify.com' }
];

export default function OnboardingStep2() {
    const [inputValue, setInputValue] = useState('');
    const [selectedCompetitors, setSelectedCompetitors] = useState<Array<{name: string, domain: string}>>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);

    const filteredSuggestions = MOCK_COMPANIES.filter(
        c => c.name.toLowerCase().includes(inputValue.toLowerCase()) || 
             c.domain.toLowerCase().includes(inputValue.toLowerCase())
    ).filter(c => !selectedCompetitors.find(s => s.domain === c.domain));

    const handleSelect = (company: {name: string, domain: string}) => {
        if (!selectedCompetitors.find(c => c.domain === company.domain)) {
            setSelectedCompetitors([...selectedCompetitors, company]);
        }
        setInputValue('');
        setShowSuggestions(false);
        inputRef.current?.focus();
    };

    const handleRemove = (domain: string) => {
        setSelectedCompetitors(selectedCompetitors.filter(c => c.domain !== domain));
    };

    const [isSubmitting, setIsSubmitting] = useState(false);


    const handleContinue = async () => {
        if (selectedCompetitors.length === 0 || isSubmitting) return;
        setIsSubmitting(true);
        try {
            const items = selectedCompetitors.map((c) => ({
                name: c.name,
                website: c.domain.startsWith('http') ? c.domain : `https://${c.domain}`,
                seed_pages: [c.domain.startsWith('http') ? c.domain : `https://${c.domain}`],
            }));
            await createCompetitorsBatch(items);
        } catch {
            // Proceed even if batch submission encounters non-fatal warning
        }
        setIsSubmitting(false);
        router.push('/onboarding/step-3');
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
            <div className="onboarding-card" style={{ paddingBottom: '30px' }}>
                <div className="onboarding-subtitle">Step 2 of 6</div>
                <h1 className="onboarding-title">Who are your top competitors?</h1>
                <p className="onboarding-desc">
                    Enter the domains of the companies you want to track. Hermes will automatically begin monitoring their signals.
                </p>

                <div style={{ width: '100%', maxWidth: '600px', marginBottom: '40px', position: 'relative' }}>
                    
                    {/* Selected Chips */}
                    {selectedCompetitors.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                            {selectedCompetitors.map(c => (
                                <div key={c.domain} style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    background: 'var(--item-hover)', border: '1px solid var(--border-color)',
                                    padding: '4px 12px', borderRadius: '16px', fontSize: '14px', color: 'var(--text-primary)'
                                }}>
                                    <img src={`https://logo.clearbit.com/${c.domain}`} alt={c.name} style={{ width: '16px', height: '16px', borderRadius: '4px' }} onError={(e) => { (e.target as any).style.display = 'none'; }} />
                                    {c.name}
                                    <FiX style={{ cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => handleRemove(c.domain)} />
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
                        gap: '12px',
                        position: 'relative',
                        zIndex: 20
                    }}>
                        <FiSearch style={{ color: 'var(--text-secondary)', fontSize: '20px' }} />
                        <input 
                            ref={inputRef}
                            type="text" 
                            placeholder={selectedCompetitors.length === 0 ? "e.g. apple.com, tesla.com" : "Add another competitor..."}
                            value={inputValue}
                            onChange={(e) => {
                                setInputValue(e.target.value);
                                setShowSuggestions(true);
                            }}
                            onFocus={() => setShowSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
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

                    {/* Suggestions Dropdown */}
                    {showSuggestions && inputValue.length > 0 && (
                        <div style={{
                            position: 'absolute',
                            top: 'calc(100% + 8px)',
                            left: 0,
                            right: 0,
                            background: 'var(--card-bg)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '12px',
                            boxShadow: '0 10px 30px var(--shadow-color)',
                            zIndex: 100,
                            maxHeight: '300px',
                            overflowY: 'auto'
                        }}>
                            {filteredSuggestions.length > 0 ? (
                                filteredSuggestions.map((c) => (
                                    <div 
                                        key={c.domain}
                                        onMouseDown={(e) => { e.preventDefault(); handleSelect(c); }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            padding: '12px 16px',
                                            cursor: 'pointer',
                                            borderBottom: '1px solid var(--border-color)',
                                            transition: 'background 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--item-hover)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <img src={`https://logo.clearbit.com/${c.domain}`} alt={c.name} style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#fff' }} onError={(e) => { (e.target as any).src = `https://ui-avatars.com/api/?name=${c.name}&background=random`; }} />
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{c.name}</span>
                                            <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{c.domain}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div style={{ padding: '16px', color: 'var(--text-secondary)', textAlign: 'center', fontSize: '14px' }}>
                                    No matches found. Press enter to add custom domain.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="onboarding-footer">
                    <div className="onboarding-dots">
                        <div className="onboarding-dot"></div>
                        <div className="onboarding-dot active"></div>
                        <div className="onboarding-dot"></div>
                        <div className="onboarding-dot"></div>
                        <div className="onboarding-dot"></div>
                        <div className="onboarding-dot"></div>
                    </div>
                    
                    <div className="onboarding-actions">
                        <button className="onboarding-back" onClick={() => router.push('/onboarding')}>
                            <FiChevronLeft />
                            Back
                        </button>
                        <button 
                            className="onboarding-continue" 
                            onClick={handleContinue} 
                            disabled={selectedCompetitors.length === 0} 
                            style={{ opacity: selectedCompetitors.length > 0 ? 1 : 0.5, cursor: selectedCompetitors.length > 0 ? 'pointer' : 'not-allowed' }}
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
