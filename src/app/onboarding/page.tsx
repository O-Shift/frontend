'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiChevronLeft, FiChevronRight, FiSearch, FiX, FiCheck, FiUploadCloud, FiMessageSquare } from 'react-icons/fi';
import './onboarding.css';

// Type Definitions
type Mission = 'campaigns' | 'gaps' | 'moves' | 'complete' | null;
type Company = { name: string, website: string, industry: string, market: string, stage: string };
type Competitor = { name: string, domain: string, relation: string };
type Signals = { keywords: string[], categories: string[], trends: string[] };
type BusinessProfile = {
    segments: string, valueProps: string, channels: string, relationships: string,
    revenue: string, resources: string, activities: string, partners: string, costs: string
};

const MOCK_COMPETITORS = [
    { name: 'Apple', domain: 'apple.com' },
    { name: 'Tesla', domain: 'tesla.com' },
    { name: 'Microsoft', domain: 'microsoft.com' },
    { name: 'Google', domain: 'google.com' },
    { name: 'Amazon', domain: 'amazon.com' }
];

export default function IntelligenceBriefing() {
    const router = useRouter();
    const [step, setStep] = useState(1);

    // Global State
    const [mission, setMission] = useState<Mission>(null);
    const [company, setCompany] = useState<Company>({ name: '', website: '', industry: '', market: '', stage: 'Growing' });
    const [competitors, setCompetitors] = useState<Competitor[]>([]);
    const [signals, setSignals] = useState<Signals>({ keywords: [], categories: [], trends: [] });
    const [businessProfile, setBusinessProfile] = useState<BusinessProfile>({
        segments: '', valueProps: '', channels: '', relationships: '',
        revenue: '', resources: '', activities: '', partners: '', costs: ''
    });
    const [sources, setSources] = useState({ platforms: [] as string[], frequency: 'Weekly intelligence brief' });

    // UI State
    const [isProcessing, setIsProcessing] = useState(false);
    const [processLabel, setProcessLabel] = useState('');

    // Step-Specific UI State
    const [compInput, setCompInput] = useState('');
    const [activeTab, setActiveTab] = useState<'keywords' | 'products' | 'trends'>('keywords');
    const [inputVal, setInputVal] = useState('');
    const [method, setMethod] = useState<'choice' | 'pdf' | 'interview' | 'review'>('choice');
    const [qIndex, setQIndex] = useState(0);

    const nextStep = () => {
        if (step < 7) setStep(step + 1);
        else router.push('/dashboard');
    };

    const prevStep = () => {
        if (step > 1) setStep(step - 1);
    };

    const simulateProcessing = async (labels: string[], callback: () => void, keepProcessingState = false) => {
        setIsProcessing(true);
        for (const label of labels) {
            setProcessLabel(label);
            await new Promise(r => setTimeout(r, 1500)); // Increased time so the loop lasts longer
        }
        if (!keepProcessingState) {
            setIsProcessing(false);
        }
        callback();
    };

    // --- STEP COMPONENTS ---

    const renderStep1 = () => (
        <div className="ob-step-container">
            <div className="ob-step-indicator" style={{ marginBottom: 40 }}>
                {[1, 2, 3, 4, 5, 6, 7].map(s => <div key={s} className={`ob-step-dot ${s === 1 ? 'active' : ''}`} />)}
            </div>
            <h1 className="ob-title">What would you like Oshift to uncover first?</h1>
            <p className="ob-desc">Choose what matters most right now. You can activate additional intelligence modules later.</p>

            <div className="ob-cards-grid">
                <div className={`ob-card ${mission === 'campaigns' ? 'selected' : ''}`} onClick={() => setMission('campaigns')}>
                    <div className="ob-card-title">Decode competitor campaigns</div>
                    <div className="ob-card-desc">Discover which campaigns succeeded, why they worked, and how your company can adapt the winning strategy.</div>
                </div>
                <div className={`ob-card ${mission === 'gaps' ? 'selected' : ''}`} onClick={() => setMission('gaps')}>
                    <div className="ob-card-title">Find market gaps</div>
                    <div className="ob-card-desc">Identify competitor weaknesses, customer complaints, unmet needs, and opportunities your company can own.</div>
                </div>
                <div className={`ob-card ${mission === 'moves' ? 'selected' : ''}`} onClick={() => setMission('moves')}>
                    <div className="ob-card-title">Track strategic moves</div>
                    <div className="ob-card-desc">Monitor partnerships, expansions, acquisitions, sponsorships, product launches, and important market activity.</div>
                </div>
                <div className={`ob-card ${mission === 'complete' ? 'selected' : ''}`} onClick={() => setMission('complete')}>
                    <div className="ob-card-title">Build a complete intelligence view</div>
                    <div className="ob-card-desc">Combine campaign analysis, opportunity discovery, and strategic-movement tracking.</div>
                </div>
            </div>

            <div className="ob-footer">
                <div />
                <button className="ob-btn-primary" onClick={nextStep} disabled={!mission} style={{ opacity: mission ? 1 : 0.5 }}>
                    Build my intelligence workspace <FiChevronRight />
                </button>
            </div>
        </div>
    );

    const renderStep2 = () => {
        const handleAutoFill = () => {
            if (!company.website) return;
            simulateProcessing(['Scanning website...', 'Extracting profile...', 'Mapping industry...'], () => {
                setCompany({ ...company, name: 'Acme Corp', industry: 'E-commerce', market: 'Global', stage: 'Established' });
            });
        };

        return (
            <div>
                <div className="ob-step-indicator" style={{ marginBottom: 40 }}>
                    {[1, 2, 3, 4, 5, 6, 7].map(s => <div key={s} className={`ob-step-dot ${s === 2 ? 'active' : ''}`} />)}
                </div>
                <h1 className="ob-title">Tell Oshift who you are</h1>
                <p className="ob-desc">We will use this information to make every competitor insight relevant to your company.</p>

                {isProcessing && (
                    <div className="ob-processing-overlay">
                        <div className="ob-spinner" />
                        <div style={{ fontWeight: 600, color: '#d84315' }}>{processLabel}</div>
                    </div>
                )}

                <div className="ob-input-group" style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-end' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <label className="ob-label">Company Website</label>
                        <input className="ob-input" placeholder="e.g. yourcompany.com" value={company.website} onChange={e => setCompany({ ...company, website: e.target.value })} />
                    </div>
                    <button className="ob-btn-secondary" onClick={handleAutoFill} disabled={!company.website}>
                        Import from website
                    </button>
                </div>

                <div className="ob-input-group">
                    <label className="ob-label">Company Name</label>
                    <input className="ob-input" value={company.name} onChange={e => setCompany({ ...company, name: e.target.value })} />
                </div>

                <div style={{ display: 'flex', gap: 20 }}>
                    <div className="ob-input-group" style={{ flex: 1 }}>
                        <label className="ob-label">Industry</label>
                        <input className="ob-input" value={company.industry} onChange={e => setCompany({ ...company, industry: e.target.value })} />
                    </div>
                    <div className="ob-input-group" style={{ flex: 1 }}>
                        <label className="ob-label">Main Market / Country</label>
                        <input className="ob-input" value={company.market} onChange={e => setCompany({ ...company, market: e.target.value })} />
                    </div>
                </div>

                <div className="ob-input-group">
                    <label className="ob-label">Company Stage</label>
                    <select className="ob-select" value={company.stage} onChange={e => setCompany({ ...company, stage: e.target.value })}>
                        <option value="Idea">Idea</option>
                        <option value="Early stage">Early stage</option>
                        <option value="Growing">Growing</option>
                        <option value="Established">Established</option>
                        <option value="Enterprise">Enterprise</option>
                    </select>
                </div>

                <div className="ob-footer">
                    <button className="ob-btn-text" onClick={prevStep}><FiChevronLeft /> Back</button>
                    <button className="ob-btn-primary" onClick={nextStep} disabled={!company.name} style={{ opacity: company.name ? 1 : 0.5 }}>
                        Continue to competitors <FiChevronRight />
                    </button>
                </div>
            </div>
        );
    };

    const renderStep3 = () => {

        const addCompetitor = (c: { name: string, domain: string }) => {
            if (!competitors.find(x => x.domain === c.domain) && competitors.length < 5) {
                setCompetitors([...competitors, { ...c, relation: 'Direct competitor' }]);
            }
            setCompInput('');
        };

        const removeCompetitor = (domain: string) => {
            setCompetitors(competitors.filter(c => c.domain !== domain));
        };

        return (
            <div className="ob-step-container">
                <div className="ob-step-indicator" style={{ marginBottom: 40 }}>
                    {[1, 2, 3, 4, 5, 6, 7].map(s => <div key={s} className={`ob-step-dot ${s === 3 ? 'active' : ''}`} />)}
                </div>
                <h1 className="ob-title">Who should Oshift keep an eye on?</h1>
                <p className="ob-desc">Add the companies competing for the same customers, attention, or market position. (Max 5)</p>

                <div className="ob-chips-container">
                    {competitors.map(c => (
                        <div key={c.domain} className="ob-chip">
                            {c.name}
                            <FiX onClick={() => removeCompetitor(c.domain)} style={{ cursor: 'pointer' }} />
                        </div>
                    ))}
                </div>

                {competitors.length < 5 && (
                    <div className="ob-input-group" style={{ position: 'relative' }}>
                        <FiSearch style={{ position: 'absolute', left: 20, top: 20, color: '#8d6e63' }} />
                        <input
                            className="ob-input"
                            style={{ paddingLeft: 50 }}
                            placeholder="Type competitor name or domain..."
                            value={compInput}
                            onChange={e => setCompInput(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && compInput) addCompetitor({ name: compInput, domain: compInput + '.com' })
                            }}
                        />
                        {compInput && (
                            <div style={{ position: 'absolute', top: 60, left: 0, right: 0, background: '#fff', border: '1px solid #e0e0e0', borderRadius: 16, zIndex: 10, padding: 8, boxShadow: '0 10px 20px rgba(0,0,0,0.05)' }}>
                                {MOCK_COMPETITORS.filter(c => c.name.toLowerCase().includes(compInput.toLowerCase())).map(c => (
                                    <div key={c.domain} onClick={() => addCompetitor(c)} style={{ padding: '12px 16px', cursor: 'pointer', borderRadius: 8 }}>
                                        <strong>{c.name}</strong> <span style={{ color: '#8d6e63', fontSize: 13 }}>{c.domain}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div style={{ display: 'flex', gap: 12, marginBottom: 40 }}>
                    <button className="ob-btn-text" style={{ padding: 0 }} onClick={() => {
                        setCompetitors([{ name: 'Generic Corp', domain: 'generic.com', relation: 'Direct' }]);
                    }}>Suggest competitors for me</button>
                </div>

                <div className="ob-footer">
                    <button className="ob-btn-text" onClick={prevStep}><FiChevronLeft /> Back</button>
                    <button className="ob-btn-primary" onClick={nextStep}>
                        Define what matters <FiChevronRight />
                    </button>
                </div>
            </div>
        );
    };

    const renderStep4 = () => {

        const handleAdd = () => {
            if (!inputVal) return;
            if (activeTab === 'keywords') setSignals({ ...signals, keywords: [...signals.keywords, inputVal] });
            if (activeTab === 'products') setSignals({ ...signals, categories: [...signals.categories, inputVal] });
            if (activeTab === 'trends') setSignals({ ...signals, trends: [...signals.trends, inputVal] });
            setInputVal('');
        };

        const list = activeTab === 'keywords' ? signals.keywords : activeTab === 'products' ? signals.categories : signals.trends;

        return (
            <div className="ob-step-container">
                <div className="ob-step-indicator" style={{ marginBottom: 40 }}>
                    {[1, 2, 3, 4, 5, 6, 7].map(s => <div key={s} className={`ob-step-dot ${s === 4 ? 'active' : ''}`} />)}
                </div>
                <h1 className="ob-title">What signals matter most to your company?</h1>
                <p className="ob-desc">These signals help Oshift filter the noise and surface the developments that deserve your attention.</p>

                <div className="ob-tabs">
                    <button className={`ob-tab ${activeTab === 'keywords' ? 'active' : ''}`} onClick={() => setActiveTab('keywords')}>Keywords</button>
                    <button className={`ob-tab ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>Products & Services</button>
                    <button className={`ob-tab ${activeTab === 'trends' ? 'active' : ''}`} onClick={() => setActiveTab('trends')}>Industry Trends</button>
                </div>

                <div className="ob-chips-container">
                    {list.map(item => (
                        <div key={item} className="ob-chip">
                            {item}
                        </div>
                    ))}
                </div>

                <div className="ob-input-group" style={{ flexDirection: 'row', gap: 12 }}>
                    <input
                        className="ob-input"
                        style={{ flex: 1 }}
                        placeholder={activeTab === 'keywords' ? "Type a keyword and press Enter" : activeTab === 'products' ? "Add a product or service category" : "Add an industry trend"}
                        value={inputVal}
                        onChange={e => setInputVal(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAdd()}
                    />
                    <button className="ob-btn-secondary" onClick={handleAdd}>Add</button>
                </div>

                <div style={{ marginTop: 24 }}>
                    <div style={{ fontSize: 13, color: '#8d6e63', marginBottom: 12, fontWeight: 600 }}>SUGGESTIONS</div>
                    <div className="ob-chips-container">
                        {['AI automation', 'Pricing changes', 'Social commerce'].map(s => (
                            <div key={s} className="ob-chip" style={{ background: '#fff3e0', border: 'none' }} onClick={() => {
                                setSignals({ ...signals, keywords: [...signals.keywords, s] });
                            }}>+ {s}</div>
                        ))}
                    </div>
                </div>

                <div className="ob-footer">
                    <button className="ob-btn-text" onClick={prevStep}><FiChevronLeft /> Back</button>
                    <button className="ob-btn-primary" onClick={nextStep}>
                        Add business context <FiChevronRight />
                    </button>
                </div>
            </div>
        );
    };

    const renderStep5 = () => {
        const questions = [
            "What product or service does your company provide?",
            "What problem does it solve?",
            "Who are your main customers?"
        ];

        if (isProcessing) {
            return (
                <div className="ob-step-container" style={{ alignItems: 'center', justifyContent: 'center' }}>
                    <div className="ob-spinner" />
                    <h2 className="ob-title" style={{ fontSize: 24 }}>{processLabel}</h2>
                </div>
            );
        }

        if (method === 'review') {
            return (
                <div className="ob-step-container">
                    <h1 className="ob-title">Your business model is ready</h1>
                    <p className="ob-desc">Oshift has converted your answers into a structured company profile.</p>

                    <div className="ob-bmc-grid">
                        <div className="ob-bmc-item filled"><span className="ob-bmc-item-label">Value Proposition</span>{businessProfile.valueProps || 'Extracted value...'}</div>
                        <div className="ob-bmc-item filled"><span className="ob-bmc-item-label">Customer Segments</span>{businessProfile.segments || 'Extracted segments...'}</div>
                        <div className="ob-bmc-item"><span className="ob-bmc-item-label">Channels</span>...</div>
                        <div className="ob-bmc-item"><span className="ob-bmc-item-label">Revenue</span>...</div>
                        <div className="ob-bmc-item"><span className="ob-bmc-item-label">Key Activities</span>...</div>
                        <div className="ob-bmc-item"><span className="ob-bmc-item-label">Key Resources</span>...</div>
                    </div>

                    <div className="ob-footer" style={{ marginTop: 24 }}>
                        <button className="ob-btn-text" onClick={() => setMethod('choice')}>Edit later</button>
                        <button className="ob-btn-primary" onClick={nextStep}>Continue <FiChevronRight /></button>
                    </div>
                </div>
            );
        }

        if (method === 'interview') {
            return (
                <div className="ob-step-container">
                    <h1 className="ob-title">Guided Agent Interview</h1>
                    <p className="ob-desc">Question {qIndex + 1} of {questions.length}</p>

                    <div style={{ background: '#fff', padding: 24, borderRadius: 24, border: '1px solid #ffcc80', marginBottom: 24 }}>
                        <div style={{ fontSize: 18, fontWeight: 600, color: '#3e2723', marginBottom: 16 }}>{questions[qIndex]}</div>
                        <textarea className="ob-input" style={{ width: '100%', height: 100, boxSizing: 'border-box' }} placeholder="Type your answer here..." />
                    </div>

                    <div className="ob-footer">
                        <button className="ob-btn-text" onClick={() => setMethod('choice')}>Cancel</button>
                        <button className="ob-btn-primary" onClick={() => {
                            if (qIndex < questions.length - 1) setQIndex(qIndex + 1);
                            else {
                                simulateProcessing(['Analyzing answers...', 'Mapping to BMC...'], () => setMethod('review'));
                            }
                        }}>
                            {qIndex < questions.length - 1 ? 'Next Question' : 'Complete Interview'} <FiChevronRight />
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div className="ob-step-container">
                <div className="ob-step-indicator" style={{ marginBottom: 40 }}>
                    {[1, 2, 3, 4, 5, 6, 7].map(s => <div key={s} className={`ob-step-dot ${s === 5 ? 'active' : ''}`} />)}
                </div>
                <h1 className="ob-title">Help Oshift understand how your business works</h1>
                <p className="ob-desc">The more context Oshift has, the more relevant its opportunities, threats, and recommendations become.</p>

                <div className="ob-cards-grid">
                    <div className="ob-card" onClick={() => {
                        simulateProcessing(['Detecting value proposition...', 'Identifying customer segments...', 'Understanding revenue streams...'], () => setMethod('review'));
                    }}>
                        <FiUploadCloud size={32} color="#ff7043" style={{ marginBottom: 12 }} />
                        <div className="ob-card-title">Upload a business document</div>
                        <div className="ob-card-desc">Upload an existing Business Model Canvas, company profile, strategy document, pitch deck, or business plan.</div>
                        <div style={{ marginTop: 16, fontSize: 13, color: '#ff9800', fontWeight: 600 }}>Click to simulate upload</div>
                    </div>
                    <div className="ob-card" onClick={() => setMethod('interview')}>
                        <div style={{ position: 'absolute', top: -12, right: 20, background: '#4CAF50', color: '#fff', fontSize: 11, padding: '4px 12px', borderRadius: 12, fontWeight: 700 }}>RECOMMENDED</div>
                        <FiMessageSquare size={32} color="#ff7043" style={{ marginBottom: 12 }} />
                        <div className="ob-card-title">Let Oshift interview you</div>
                        <div className="ob-card-desc">Answer a few simple questions and the agent will create your company profile and Business Model Canvas.</div>
                    </div>
                </div>

                <div className="ob-footer">
                    <button className="ob-btn-text" onClick={prevStep}><FiChevronLeft /> Back</button>
                    <button className="ob-btn-text" onClick={nextStep}>Skip for now</button>
                </div>
            </div>
        );
    };

    const renderStep6 = () => {
        const togglePlat = (p: string) => setSources(s => ({ ...s, platforms: s.platforms.includes(p) ? s.platforms.filter(x => x !== p) : [...s.platforms, p] }));

        return (
            <div className="ob-step-container">
                <div className="ob-step-indicator" style={{ marginBottom: 40 }}>
                    {[1, 2, 3, 4, 5, 6, 7].map(s => <div key={s} className={`ob-step-dot ${s === 6 ? 'active' : ''}`} />)}
                </div>
                <h1 className="ob-title">Where should Oshift look?</h1>
                <p className="ob-desc">Select the channels that are most important in your industry.</p>

                <div style={{ marginBottom: 24 }}>
                    <div className="ob-label" style={{ marginBottom: 12 }}>Social Sources</div>
                    <div className="ob-chips-container">
                        {['LinkedIn', 'Instagram', 'TikTok', 'X'].map(p => (
                            <div key={p} className="ob-chip" style={{ background: sources.platforms.includes(p) ? '#ff9800' : '#fff', color: sources.platforms.includes(p) ? '#fff' : '#d84315' }} onClick={() => togglePlat(p)}>
                                {p}
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ marginBottom: 32 }}>
                    <div className="ob-label" style={{ marginBottom: 12 }}>Review Sources</div>
                    <div className="ob-chips-container">
                        {['Google Reviews', 'Trustpilot', 'G2', 'App Store'].map(p => (
                            <div key={p} className="ob-chip" style={{ background: sources.platforms.includes(p) ? '#ff9800' : '#fff', color: sources.platforms.includes(p) ? '#fff' : '#d84315' }} onClick={() => togglePlat(p)}>
                                {p}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="ob-input-group">
                    <label className="ob-label">How often should Oshift brief you?</label>
                    <select className="ob-select" value={sources.frequency} onChange={e => setSources({ ...sources, frequency: e.target.value })}>
                        <option>Important alerts only</option>
                        <option>Daily summary</option>
                        <option>Weekly intelligence brief</option>
                        <option>Monthly strategic report</option>
                    </select>
                </div>

                <div className="ob-footer">
                    <button className="ob-btn-text" onClick={prevStep}><FiChevronLeft /> Back</button>
                    <button className="ob-btn-primary" onClick={nextStep}>
                        Review my setup <FiChevronRight />
                    </button>
                </div>
            </div>
        );
    };

    const renderStep7 = () => {
        return (
            <div className="ob-step-container">
                <div className="ob-step-indicator" style={{ marginBottom: 40 }}>
                    {[1, 2, 3, 4, 5, 6, 7].map(s => <div key={s} className={`ob-step-dot ${s === 7 ? 'active' : ''}`} />)}
                </div>
                <h1 className="ob-title">Your intelligence workspace is ready</h1>
                <p className="ob-desc">Oshift will monitor {Math.max(1, competitors.length)} competitors, follow {signals.keywords.length + signals.categories.length + signals.trends.length} strategic signals, and focus on {mission || 'market intelligence'}.</p>

                <div style={{ background: '#ffffff', border: '1px solid #ffcc80', borderRadius: 24, padding: 24, marginBottom: 40, boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, borderBottom: '1px solid #f5f5f5', paddingBottom: 16 }}>
                        <div><span style={{ color: '#8d6e63', fontSize: 13, display: 'block' }}>Company</span><strong>{company.name || 'Setup Pending'}</strong></div>
                        <div><span style={{ color: '#8d6e63', fontSize: 13, display: 'block' }}>Briefing</span><strong>{sources.frequency}</strong></div>
                    </div>
                    <div style={{ color: '#d84315', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FiCheck /> Workspace Configuration Complete
                    </div>
                </div>

                <div className="ob-footer">
                    <button className="ob-btn-text" onClick={prevStep}><FiChevronLeft /> Edit setup</button>
                    <button className="ob-btn-primary" onClick={() => simulateProcessing(['Activating Oshift...', 'Preparing first snapshot...'], () => router.push('/dashboard'), true)}>
                        Activate Oshift <FiChevronRight />
                    </button>
                </div>
            </div>
        );
    };

    // --- RIGHT PANEL RENDERING ---
    const renderRightPanel = () => {
        const isRunning = isProcessing || step === 1 || step === 7;

        return (
            <div className="ob-radar-container">
                <div className="ob-radar-rings" key={competitors.length} style={{ animationDuration: isActivating ? '2s' : '60s' }}>
                    {/* Render competitors as nodes on the radar */}
                    {competitors.map((c, i) => {
                        const angle = (i * 360 / competitors.length) * (Math.PI / 180);
                        const radius = 330; // on the outer ring (just inside 350px radius)
                        const x = Math.cos(angle) * radius;
                        const y = Math.sin(angle) * radius;
                        return (
                            <div key={c.domain} style={{
                                position: 'absolute',
                                left: '50%', top: '50%',
                                transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                                transition: 'all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                            }}>
                                <div className="ob-radar-node" style={{ animationDuration: isActivating ? '2s' : '60s' }}>
                                    {c.name}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {(() => {
                    // Mascot is perfectly centered, static and big
                    let currentScale = 1.3;
                    
                    return (
                        <img
                            src="/investigator_mascot.png"
                            alt="Oshift Mascot"
                            className="ob-mascot"
                            style={{
                                position: 'absolute',
                                left: '50%',
                                top: '50%',
                                transform: `translate(-50%, -50%) scale(${currentScale})`,
                                opacity: 0.9
                            }}
                        />
                    );
                })()}

                {/* Case File visual for Company steps only */}
                <div className={`ob-case-file ${(step === 2) ? 'visible' : ''}`}>
                    <div style={{ borderBottom: '2px solid #ffcc80', paddingBottom: 12, marginBottom: 16, fontWeight: 700, color: '#d84315' }}>
                        INVESTIGATION CASE FILE
                    </div>
                    <div className="ob-case-row">
                        <span className="ob-case-label">SUBJECT</span>
                        <span className="ob-case-value">{company.name || 'Unknown'}</span>
                    </div>
                    <div className="ob-case-row">
                        <span className="ob-case-label">INDUSTRY</span>
                        <span className="ob-case-value">{company.industry || 'Pending'}</span>
                    </div>
                    <div className="ob-case-row">
                        <span className="ob-case-label">MARKET</span>
                        <span className="ob-case-value">{company.market || 'Pending'}</span>
                    </div>
                    <div className="ob-case-row" style={{ border: 'none' }}>
                        <span className="ob-case-label">PROFILE STATUS</span>
                        <span className="ob-case-value" style={{ color: step > 5 ? '#4CAF50' : '#ff9800' }}>
                            {step > 5 ? 'Compiled' : 'Gathering Data...'}
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    const isActivating = isProcessing && step === 7;

    return (
        <div className={`onboarding-wrapper ${isActivating ? 'activating' : ''}`}>
            <div className="onboarding-left custom-scrollbar">
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
                {step === 4 && renderStep4()}
                {step === 5 && renderStep5()}
                {step === 6 && renderStep6()}
                {step === 7 && renderStep7()}
            </div>
            <div className="onboarding-right">
                {renderRightPanel()}
            </div>
        </div>
    );
}
