'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FiChevronLeft, FiChevronRight, FiSend } from 'react-icons/fi';
import '../onboarding.css';

export default function OnboardingStep5() {
    const [messages, setMessages] = useState<{role: 'agent'|'user', text: string}[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(true);
    const router = useRouter();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Check if PDF was uploaded to determine the opening message
        const hasPdf = localStorage.getItem('oshift_has_pdf') === 'true';
        
        setTimeout(() => {
            if (hasPdf) {
                setMessages([{
                    role: 'agent', 
                    text: "I've reviewed your uploaded business model. It looks solid. To help me narrow down the competitor signals, could you clarify your primary target demographic within the next 12 months?"
                }]);
            } else {
                setMessages([{
                    role: 'agent', 
                    text: "No problem! Let's build your profile together. To start, can you tell me what your primary product or service is in one sentence?"
                }]);
            }
            setIsTyping(false);
        }, 1500);
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const handleSend = () => {
        if (!inputValue.trim()) return;
        
        const newMsg = { role: 'user' as const, text: inputValue };
        setMessages(prev => [...prev, newMsg]);
        setInputValue('');
        setIsTyping(true);

        // Mock Hermes reply
        setTimeout(() => {
            setMessages(prev => [...prev, {
                role: 'agent',
                text: "Got it, that's really helpful context. I'll make sure to prioritize signals relevant to that. We can continue refining this on your dashboard later."
            }]);
            setIsTyping(false);
        }, 2000);
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
            <div className="onboarding-card" style={{ padding: '40px', minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
                <div className="onboarding-subtitle">Step 5 of 6</div>
                <h1 className="onboarding-title" style={{ marginBottom: '8px' }}>Chat with Hermes</h1>
                <p className="onboarding-desc" style={{ marginBottom: '24px' }}>
                    Hermes is your dedicated competitive intelligence agent. Let's finish your profile setup.
                </p>

                {/* Chat UI */}
                <div style={{ 
                    flex: 1, 
                    width: '100%', 
                    background: 'var(--bg-main)', 
                    borderRadius: '16px', 
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    marginBottom: '0'
                }}>
                    <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {messages.map((msg, i) => (
                            <div key={i} style={{ 
                                display: 'flex', 
                                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' 
                            }}>
                                <div style={{
                                    maxWidth: '75%',
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    background: msg.role === 'user' ? 'var(--accent)' : 'var(--item-hover)',
                                    color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
                                    border: msg.role === 'agent' ? '1px solid var(--border-color)' : 'none',
                                    fontSize: '15px',
                                    lineHeight: 1.5
                                }}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                                <div style={{
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    background: 'var(--item-hover)',
                                    border: '1px solid var(--border-color)',
                                    color: 'var(--text-secondary)',
                                    fontSize: '14px'
                                }}>
                                    Hermes is typing...
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    
                    {/* Input Field */}
                    <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)', background: 'var(--card-bg)' }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            background: 'var(--item-hover)',
                            borderRadius: '12px',
                            border: '1px solid var(--border-color)',
                            padding: '8px 16px'
                        }}>
                            <input 
                                type="text"
                                placeholder="Type your answer..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                disabled={isTyping}
                                style={{
                                    flex: 1,
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--text-primary)',
                                    outline: 'none',
                                    fontSize: '15px'
                                }}
                            />
                            <button 
                                onClick={handleSend}
                                disabled={!inputValue.trim() || isTyping}
                                style={{
                                    background: 'var(--accent)',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    width: '32px',
                                    height: '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: inputValue.trim() && !isTyping ? 'pointer' : 'not-allowed',
                                    opacity: inputValue.trim() && !isTyping ? 1 : 0.5
                                }}
                            >
                                <FiSend size={14} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="onboarding-footer" style={{ marginTop: '32px' }}>
                    <div className="onboarding-dots">
                        <div className="onboarding-dot"></div>
                        <div className="onboarding-dot"></div>
                        <div className="onboarding-dot"></div>
                        <div className="onboarding-dot"></div>
                        <div className="onboarding-dot active"></div>
                        <div className="onboarding-dot"></div>
                    </div>
                    
                    <div className="onboarding-actions">
                        <button className="onboarding-back" onClick={() => router.push('/onboarding/step-4')}>
                            <FiChevronLeft />
                            Back
                        </button>
                        <button 
                            className="onboarding-continue" 
                            onClick={() => router.push('/onboarding/step-6')}
                        >
                            {messages.length > 1 ? 'Continue' : 'Skip for now'}
                            <FiChevronRight />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
