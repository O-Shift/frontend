'use client';
import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Search, X, Check, UploadCloud, MessageSquare } from 'lucide-react';
import { EVENTS, track } from '@/lib/analytics';
import { upsertCompany, createCompetitorsBatch } from '@/lib/api';
import mascotImg from '../../../public/investigator_mascot.png';
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

// Readable funnel labels: a bare step number tells you nothing in a PostHog
// breakdown, and the name keeps its meaning if the steps are ever reordered.
const STEP_NAMES: Record<number, string> = {
    1: 'mission',
    2: 'company',
    3: 'competitors',
    4: 'signals',
    5: 'business_profile',
    6: 'sources',
    7: 'review'
};

const stepProps = (step: number, extra?: Record<string, unknown>) => ({
    step,
    step_name: STEP_NAMES[step],
    ...extra
});

const onActivateKey = (action: () => void) => (e: KeyboardEvent<HTMLElement>) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    action();
};

/** Strip a bare domain down to its host. Returns '' when there is nothing usable. */
const toHost = (input: string): string => {
    const raw = input.trim().replace(/\s+/g, '');
    if (!raw) return '';
    try {
        const url = new URL(raw.includes('://') ? raw : `https://${raw}`);
        return url.hostname.replace(/^www\./, '');
    } catch {
        return '';
    }
};

/**
 * The wizard collects bare domains; PUT /company and POST /competitors/batch
 * both validate `website` as an absolute URL, so it gets a scheme here.
 */
const toWebsite = (input: string): string => {
    const host = toHost(input);
    return host ? `https://${host}` : '';
};

/** 'career180.com' -> 'Career180'. Prefills the name field; never invents one. */
const nameFromHost = (host: string): string => {
    const label = host.split('.')[0] ?? '';
    return label ? label.charAt(0).toUpperCase() + label.slice(1) : '';
};

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
    const [saveError, setSaveError] = useState<string | null>(null);
    const [skipped, setSkipped] = useState<string[]>([]);

    // Step-Specific UI State
    const [compInput, setCompInput] = useState('');
    const [activeTab, setActiveTab] = useState<'keywords' | 'products' | 'trends'>('keywords');
    const [inputVal, setInputVal] = useState('');
    const [method, setMethod] = useState<'choice' | 'pdf' | 'interview' | 'review'>('choice');
    const [qIndex, setQIndex] = useState(0);

    // Which path produced the business profile. Held in a ref because `method`
    // is overwritten with 'review' once either path finishes, losing the answer.
    const profileMethod = useRef<'document' | 'interview' | null>(null);

    const hasTrackedStart = useRef(false);
    useEffect(() => {
        // Guarded because StrictMode re-runs effects in development, which would
        // otherwise double-count every entry into the funnel.
        if (hasTrackedStart.current) return;
        hasTrackedStart.current = true;
        track(EVENTS.ONBOARDING_STARTED);
    }, []);

    const viewedStep = useRef<number | null>(null);
    useEffect(() => {
        if (viewedStep.current === step) return;
        viewedStep.current = step;
        track(EVENTS.ONBOARDING_STEP_VIEWED, stepProps(step));
    }, [step]);

    // Each call site passes its own step's context. Never wire this straight to
    // onClick — React would hand it the click event as the payload.
    const nextStep = (completed?: Record<string, unknown>) => {
        track(EVENTS.ONBOARDING_STEP_COMPLETED, stepProps(step, completed));
        if (step < 7) setStep(step + 1);
    };

    const prevStep = () => {
        // Returns early so the event only fires on a move that actually happens.
        if (step <= 1) return;
        track(EVENTS.ONBOARDING_STEP_BACK, stepProps(step));
        setStep(step - 1);
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

    /**
     * Write the wizard to the backend, then enter the app.
     *
     * The company profile goes first: the competitor rows are meaningless
     * without something to compare them against, and a partial save that
     * created competitors under no profile would be worse than none. Anything
     * the wizard collects that has no column of its own (mission, market,
     * stage, signals, sources, business model) rides along in `metadata`, so
     * the agent can read back the same answers the user typed here.
     */
    const activate = async () => {
        setSaveError(null);
        setSkipped([]);
        setIsProcessing(true);

        // Captured on submit so a user who completes onboarding counts even if
        // backend requests are running.
        track(EVENTS.ONBOARDING_COMPLETED, {
            mission,
            industry: company.industry,
            stage: company.stage,
            competitor_count: competitors.length,
            signal_count: signals.keywords.length + signals.categories.length + signals.trends.length,
            platform_count: sources.platforms.length,
            frequency: sources.frequency,
            profile_method: profileMethod.current,
        });

        setProcessLabel('Saving your company profile...');
        const companyRes = await upsertCompany({
            name: company.name.trim(),
            website: toWebsite(company.website),
            industry: company.industry.trim() || null,
            metadata: {
                mission,
                market: company.market.trim(),
                stage: company.stage,
                signals,
                sources,
                business_profile: businessProfile,
            },
        });

        if (!companyRes.ok) {
            setIsProcessing(false);
            setSaveError(`Could not save your company profile: ${companyRes.error}`);
            return;
        }

        if (competitors.length > 0) {
            setProcessLabel('Adding competitors to your watch list...');
            const compRes = await createCompetitorsBatch(
                competitors.map(c => ({
                    name: c.name.trim(),
                    website: toWebsite(c.domain),
                    industry: company.industry.trim() || null,
                    metadata: { relation: c.relation, added_during: 'onboarding' },
                })),
            );
            if (!compRes.ok) {
                setIsProcessing(false);
                setSaveError(`Your profile is saved, but the competitors were not: ${compRes.error}`);
                return;
            }
            // A name the backend already had is a re-run, not a failure — say so
            // and keep going rather than blocking the user on it.
            if (compRes.data.skipped.length > 0) setSkipped(compRes.data.skipped);
        }

        setProcessLabel('Preparing your first snapshot...');
        router.push('/');
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
                <div
                    className={`ob-card ${mission === 'campaigns' ? 'selected' : ''}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => setMission('campaigns')}
                    onKeyDown={onActivateKey(() => setMission('campaigns'))}
                >
                    <div className="ob-card-title">Decode competitor campaigns</div>
                    <div className="ob-card-desc">Discover which campaigns succeeded, why they worked, and how your company can adapt the winning strategy.</div>
                </div>
                <div
                    className={`ob-card ${mission === 'gaps' ? 'selected' : ''}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => setMission('gaps')}
                    onKeyDown={onActivateKey(() => setMission('gaps'))}
                >
                    <div className="ob-card-title">Find market gaps</div>
                    <div className="ob-card-desc">Identify competitor weaknesses, customer complaints, unmet needs, and opportunities your company can own.</div>
                </div>
                <div
                    className={`ob-card ${mission === 'moves' ? 'selected' : ''}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => setMission('moves')}
                    onKeyDown={onActivateKey(() => setMission('moves'))}
                >
                    <div className="ob-card-title">Track strategic moves</div>
                    <div className="ob-card-desc">Monitor partnerships, expansions, acquisitions, sponsorships, product launches, and important market activity.</div>
                </div>
                <div
                    className={`ob-card ${mission === 'complete' ? 'selected' : ''}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => setMission('complete')}
                    onKeyDown={onActivateKey(() => setMission('complete'))}
                >
                    <div className="ob-card-title">Build a complete intelligence view</div>
                    <div className="ob-card-desc">Combine campaign analysis, opportunity discovery, and strategic-movement tracking.</div>
                </div>
            </div>

            <div className="ob-footer">
                <div />
                <button className="ob-btn-primary" onClick={() => nextStep({ mission })} disabled={!mission} style={{ opacity: mission ? 1 : 0.5 }}>
                    Build my intelligence workspace <ChevronRight />
                </button>
            </div>
        </div>
    );

    const renderStep2 = () => {
        const host = toHost(company.website);

        // No backend endpoint profiles an arbitrary website, so this fills only
        // what the domain genuinely tells us — the name. Industry and market are
        // left for the user instead of being invented.
        const fillNameFromDomain = () => {
            if (!host) return;
            setCompany({ ...company, name: nameFromHost(host) });
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
                        <div style={{ fontWeight: 600, color: 'var(--ob-accent-deep)' }}>{processLabel}</div>
                    </div>
                )}

                <div className="ob-input-group" style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-end' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <label htmlFor="ob-company-website" className="ob-label">Company Website</label>
                        <input id="ob-company-website" className="ob-input" placeholder="e.g. yourcompany.com" value={company.website} onChange={e => setCompany({ ...company, website: e.target.value })} />
                    </div>
                    <button className="ob-btn-secondary" onClick={fillNameFromDomain} disabled={!host}>
                        Use domain as name
                    </button>
                </div>

                <div className="ob-input-group">
                    <label htmlFor="ob-company-name" className="ob-label">Company Name</label>
                    <input id="ob-company-name" className="ob-input" value={company.name} onChange={e => setCompany({ ...company, name: e.target.value })} />
                </div>

                <div style={{ display: 'flex', gap: 20 }}>
                    <div className="ob-input-group" style={{ flex: 1 }}>
                        <label htmlFor="ob-company-industry" className="ob-label">Industry</label>
                        <input id="ob-company-industry" className="ob-input" value={company.industry} onChange={e => setCompany({ ...company, industry: e.target.value })} />
                    </div>
                    <div className="ob-input-group" style={{ flex: 1 }}>
                        <label htmlFor="ob-company-market" className="ob-label">Main Market / Country</label>
                        <input id="ob-company-market" className="ob-input" value={company.market} onChange={e => setCompany({ ...company, market: e.target.value })} />
                    </div>
                </div>

                <div className="ob-input-group">
                    <label htmlFor="ob-company-stage" className="ob-label">Company Stage</label>
                    <select id="ob-company-stage" className="ob-select" value={company.stage} onChange={e => setCompany({ ...company, stage: e.target.value })}>
                        <option value="Idea">Idea</option>
                        <option value="Early stage">Early stage</option>
                        <option value="Growing">Growing</option>
                        <option value="Established">Established</option>
                        <option value="Enterprise">Enterprise</option>
                    </select>
                </div>

                <div className="ob-footer">
                    <button className="ob-btn-text" onClick={prevStep}><ChevronLeft /> Back</button>
                    <button className="ob-btn-primary" onClick={() => nextStep({
                        has_website: Boolean(company.website),
                        industry: company.industry,
                        market: company.market,
                        stage: company.stage
                    })} disabled={!company.name || !host} style={{ opacity: company.name && host ? 1 : 0.5 }}>
                        Continue to competitors <ChevronRight />
                    </button>
                </div>
            </div>
        );
    };

    const renderStep3 = () => {
        // Each competitor becomes a real row with a real crawl seed, so the
        // domain has to come from the user. The previous version appended
        // '.com' to whatever was typed, which sent the crawlers at a domain
        // nobody had confirmed existed.
        const typedHost = toHost(compInput);
        const alreadyAdded = competitors.some(c => c.domain === typedHost);
        const canAdd = Boolean(typedHost) && !alreadyAdded && competitors.length < 5;

        const addCompetitor = () => {
            if (!canAdd) return;
            setCompetitors([
                ...competitors,
                { name: nameFromHost(typedHost), domain: typedHost, relation: 'Direct competitor' },
            ]);
            setCompInput('');
        };

        const renameCompetitor = (domain: string, name: string) => {
            setCompetitors(competitors.map(c => (c.domain === domain ? { ...c, name } : c)));
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
                <p className="ob-desc">Add the companies competing for the same customers, attention, or market position. Enter each one&apos;s website — that is where Oshift starts looking. (Max 5)</p>

                {competitors.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                        {competitors.map(c => (
                            <div key={c.domain} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--ob-surface)', border: '1px solid var(--ob-border-warm)', borderRadius: 16, padding: '10px 16px' }}>
                                <input
                                    className="ob-input"
                                    style={{ flex: 1, border: 'none', padding: 0, background: 'transparent', fontWeight: 600 }}
                                    value={c.name}
                                    aria-label={`Name for ${c.domain}`}
                                    onChange={e => renameCompetitor(c.domain, e.target.value)}
                                />
                                <span style={{ color: 'var(--ob-brown-muted)', fontSize: 13 }}>{c.domain}</span>
                                <button className="ob-btn-text" style={{ padding: 0 }} aria-label={`Remove ${c.name}`} onClick={() => removeCompetitor(c.domain)}>
                                    <X />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {competitors.length < 5 && (
                    <div className="ob-input-group" style={{ position: 'relative' }}>
                        <Search style={{ position: 'absolute', left: 20, top: 20, color: 'var(--ob-brown-muted)' }} />
                        <input
                            className="ob-input"
                            style={{ paddingLeft: 50 }}
                            placeholder="competitor.com"
                            value={compInput}
                            onChange={e => setCompInput(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') addCompetitor();
                            }}
                        />
                        {compInput && !typedHost && (
                            <div style={{ marginTop: 8, fontSize: 13, color: 'var(--ob-accent-deep)' }}>
                                That is not a website yet — try something like acme.com
                            </div>
                        )}
                        {alreadyAdded && (
                            <div style={{ marginTop: 8, fontSize: 13, color: 'var(--ob-brown-muted)' }}>
                                {typedHost} is already on the list
                            </div>
                        )}
                    </div>
                )}

                <div style={{ display: 'flex', gap: 12, marginBottom: 40 }}>
                    <button className="ob-btn-secondary" onClick={addCompetitor} disabled={!canAdd} style={{ opacity: canAdd ? 1 : 0.5 }}>
                        Add competitor
                    </button>
                </div>

                <div className="ob-footer">
                    <button className="ob-btn-text" onClick={prevStep}><ChevronLeft /> Back</button>
                    <button className="ob-btn-primary" onClick={() => nextStep({ competitor_count: competitors.length })}>
                        Define what matters <ChevronRight />
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

        const addSuggestedKeyword = (s: string) => {
            setSignals({ ...signals, keywords: [...signals.keywords, s] });
        };

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
                    <div style={{ fontSize: 13, color: 'var(--ob-brown-muted)', marginBottom: 12, fontWeight: 600 }}>SUGGESTIONS</div>
                    <div className="ob-chips-container">
                        {['AI automation', 'Pricing changes', 'Social commerce'].map(s => (
                            <div
                                key={s}
                                className="ob-chip"
                                style={{ background: 'var(--ob-surface-warm)', border: 'none' }}
                                role="button"
                                tabIndex={0}
                                onClick={() => addSuggestedKeyword(s)}
                                onKeyDown={onActivateKey(() => addSuggestedKeyword(s))}
                            >+ {s}</div>
                        ))}
                    </div>
                </div>

                <div className="ob-footer">
                    <button className="ob-btn-text" onClick={prevStep}><ChevronLeft /> Back</button>
                    <button className="ob-btn-primary" onClick={() => nextStep({
                        keyword_count: signals.keywords.length,
                        category_count: signals.categories.length,
                        trend_count: signals.trends.length
                    })}>
                        Add business context <ChevronRight />
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
                        <button className="ob-btn-primary" onClick={() => nextStep({ profile_method: profileMethod.current, skipped: false })}>Continue <ChevronRight /></button>
                    </div>
                </div>
            );
        }

        if (method === 'interview') {
            return (
                <div className="ob-step-container">
                    <h1 className="ob-title">Guided Agent Interview</h1>
                    <p className="ob-desc">Question {qIndex + 1} of {questions.length}</p>

                    <div style={{ background: 'var(--ob-surface)', padding: 24, borderRadius: 24, border: '1px solid var(--ob-border-warm)', marginBottom: 24 }}>
                        <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--ob-brown-dark)', marginBottom: 16 }}>{questions[qIndex]}</div>
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
                            {qIndex < questions.length - 1 ? 'Next Question' : 'Complete Interview'} <ChevronRight />
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
                    <div
                        className="ob-card"
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                            profileMethod.current = 'document';
                            track(EVENTS.ONBOARDING_PROFILE_METHOD_CHOSEN, stepProps(5, { method: 'document' }));
                            simulateProcessing(['Detecting value proposition...', 'Identifying customer segments...', 'Understanding revenue streams...'], () => setMethod('review'));
                        }}
                        onKeyDown={e => {
                            if (e.key !== 'Enter' && e.key !== ' ') return;
                            e.preventDefault();
                            profileMethod.current = 'document';
                            track(EVENTS.ONBOARDING_PROFILE_METHOD_CHOSEN, stepProps(5, { method: 'document' }));
                            simulateProcessing(['Detecting value proposition...', 'Identifying customer segments...', 'Understanding revenue streams...'], () => setMethod('review'));
                        }}
                    >
                        <UploadCloud size={32} color="var(--ob-accent-strong)" style={{ marginBottom: 12 }} />
                        <div className="ob-card-title">Upload a business document</div>
                        <div className="ob-card-desc">Upload an existing Business Model Canvas, company profile, strategy document, pitch deck, or business plan.</div>
                        <div style={{ marginTop: 16, fontSize: 13, color: 'var(--ob-accent)', fontWeight: 600 }}>Click to simulate upload</div>
                    </div>
                    <div
                        className="ob-card"
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                            profileMethod.current = 'interview';
                            track(EVENTS.ONBOARDING_PROFILE_METHOD_CHOSEN, stepProps(5, { method: 'interview' }));
                            setMethod('interview');
                        }}
                        onKeyDown={e => {
                            if (e.key !== 'Enter' && e.key !== ' ') return;
                            e.preventDefault();
                            profileMethod.current = 'interview';
                            track(EVENTS.ONBOARDING_PROFILE_METHOD_CHOSEN, stepProps(5, { method: 'interview' }));
                            setMethod('interview');
                        }}
                    >
                        <div style={{ position: 'absolute', top: -12, right: 20, background: 'var(--ob-success)', color: 'var(--ob-surface)', fontSize: 11, padding: '4px 12px', borderRadius: 12, fontWeight: 700 }}>RECOMMENDED</div>
                        <MessageSquare size={32} color="var(--ob-accent-strong)" style={{ marginBottom: 12 }} />
                        <div className="ob-card-title">Let Oshift interview you</div>
                        <div className="ob-card-desc">Answer a few simple questions and the agent will create your company profile and Business Model Canvas.</div>
                    </div>
                </div>

                <div className="ob-footer">
                    <button className="ob-btn-text" onClick={prevStep}><ChevronLeft /> Back</button>
                    <button className="ob-btn-text" onClick={() => nextStep({ profile_method: null, skipped: true })}>Skip for now</button>
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
                            <div
                                key={p}
                                className="ob-chip"
                                style={{ background: sources.platforms.includes(p) ? 'var(--ob-accent)' : 'var(--ob-surface)', color: sources.platforms.includes(p) ? 'var(--ob-surface)' : 'var(--ob-accent-deep)' }}
                                role="button"
                                tabIndex={0}
                                aria-pressed={sources.platforms.includes(p)}
                                onClick={() => togglePlat(p)}
                                onKeyDown={onActivateKey(() => togglePlat(p))}
                            >
                                {p}
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ marginBottom: 32 }}>
                    <div className="ob-label" style={{ marginBottom: 12 }}>Review Sources</div>
                    <div className="ob-chips-container">
                        {['Google Reviews', 'Trustpilot', 'G2', 'App Store'].map(p => (
                            <div
                                key={p}
                                className="ob-chip"
                                style={{ background: sources.platforms.includes(p) ? 'var(--ob-accent)' : 'var(--ob-surface)', color: sources.platforms.includes(p) ? 'var(--ob-surface)' : 'var(--ob-accent-deep)' }}
                                role="button"
                                tabIndex={0}
                                aria-pressed={sources.platforms.includes(p)}
                                onClick={() => togglePlat(p)}
                                onKeyDown={onActivateKey(() => togglePlat(p))}
                            >
                                {p}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="ob-input-group">
                    <label htmlFor="ob-brief-frequency" className="ob-label">How often should Oshift brief you?</label>
                    <select id="ob-brief-frequency" className="ob-select" value={sources.frequency} onChange={e => setSources({ ...sources, frequency: e.target.value })}>
                        <option>Important alerts only</option>
                        <option>Daily summary</option>
                        <option>Weekly intelligence brief</option>
                        <option>Monthly strategic report</option>
                    </select>
                </div>

                <div className="ob-footer">
                    <button className="ob-btn-text" onClick={prevStep}><ChevronLeft /> Back</button>
                    <button className="ob-btn-primary" onClick={() => nextStep({
                        platform_count: sources.platforms.length,
                        platforms: sources.platforms,
                        frequency: sources.frequency
                    })}>
                        Review my setup <ChevronRight />
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
                <p className="ob-desc">
                    Oshift will monitor {competitors.length} {competitors.length === 1 ? 'competitor' : 'competitors'}, follow {signalCount} strategic {signalCount === 1 ? 'signal' : 'signals'}, and focus on {mission || 'market intelligence'}.
                </p>

                <div style={{ background: 'var(--ob-surface)', border: '1px solid var(--ob-border-warm)', borderRadius: 24, padding: 24, marginBottom: 24, boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, borderBottom: '1px solid var(--ob-divider)', paddingBottom: 16 }}>
                        <div><span style={{ color: 'var(--ob-brown-muted)', fontSize: 13, display: 'block' }}>Company</span><strong>{company.name || 'Setup Pending'}</strong></div>
                        <div><span style={{ color: 'var(--ob-brown-muted)', fontSize: 13, display: 'block' }}>Briefing</span><strong>{sources.frequency}</strong></div>
                    </div>
                    <div style={{ color: 'var(--ob-accent-deep)', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Check /> Ready to save
                    </div>
                </div>

                {saveError && (
                    <div role="alert" style={{ background: 'var(--ob-surface-warm)', border: '1px solid var(--ob-accent-deep)', borderRadius: 16, padding: 16, marginBottom: 24, color: 'var(--ob-accent-deep)', fontSize: 14 }}>
                        {saveError}
                    </div>
                )}

                {skipped.length > 0 && (
                    <div style={{ background: 'var(--ob-surface-warm-2)', border: '1px solid var(--ob-border-warm)', borderRadius: 16, padding: 16, marginBottom: 24, color: 'var(--ob-brown-muted)', fontSize: 14 }}>
                        Already being tracked, so left as they are: {skipped.join(', ')}
                    </div>
                )}

                <div className="ob-footer">
                    <button className="ob-btn-text" onClick={prevStep}><ChevronLeft /> Edit setup</button>
                    <button className="ob-btn-primary" onClick={activate} disabled={isProcessing || !company.name || !toHost(company.website)} style={{ opacity: isProcessing || !company.name || !toHost(company.website) ? 0.5 : 1 }}>
                        {isProcessing ? 'Saving...' : saveError ? 'Try again' : 'Activate Oshift'} <ChevronRight />
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
                        <Image
                            src={mascotImg}
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
                    <div style={{ borderBottom: '2px solid var(--ob-border-warm)', paddingBottom: 12, marginBottom: 16, fontWeight: 700, color: 'var(--ob-accent-deep)' }}>
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
                        <span className="ob-case-value" style={{ color: step > 5 ? 'var(--ob-success)' : 'var(--ob-accent)' }}>
                            {step > 5 ? 'Compiled' : 'Gathering Data...'}
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    const isActivating = isProcessing && step === 7;
    const signalCount = signals.keywords.length + signals.categories.length + signals.trends.length;

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
