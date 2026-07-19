'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Globe from '@/components/Globe';

const PROFILE_DATA = {
    // BACKEND: core.core_workspace_members + core.core_roles
    name: 'Vasil Stoyanov',
    jobTitle: 'Head of Strategy',
    company: 'OShift',
    department: 'Strategic Intelligence',
    workspaceRole: 'Admin',
    // BACKEND: ⚠️ NO EQUIVALENT — no bio field in any table
    bio: 'Driving competitive intelligence and market expansion strategies across MENA and European markets. Passionate about leveraging data-driven insights to uncover hidden opportunities and anticipating market shifts.',
    // BACKEND: core.core_workspaces + core.core_workspace_members
    corporate: {
        company: 'OShift',
        industry: 'Competitive Intelligence & SaaS',
        department: 'Strategic Intelligence',
        position: 'Head of Strategy',
        workspaceRole: 'Admin',
    },
    // BACKEND: ⚠️ NO EQUIVALENT — needs design decision
    areasOfFocus: [
        { 
            label: 'Market Expansion', 
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="2" y1="12" x2="22" y2="12"/>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
            )
        },
        { 
            label: 'Competitor Intelligence', 
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
            )
        },
        { 
            label: 'Strategic Partnerships', 
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
            )
        },
        { 
            label: 'Product Innovation', 
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
            )
        },
        { 
            label: 'Customer Experience', 
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
            )
        },
    ],
    // BACKEND: ⚠️ NO EQUIVALENT — could be stored in core.core_workspaces JSONB metadata column
    markets: {
        countries: ['Egypt', 'UAE', 'Saudi Arabia', 'Germany', 'UK'],
        regions: ['MENA', 'Western Europe', 'North Africa'],
        industries: ['EdTech', 'FinTech', 'E-Commerce', 'SaaS', 'Logistics'],
    },
    // BACKEND: ⚠️ NO EQUIVALENT — needs design decision
    objectives: [
        {
            title: 'Expand MENA Market Presence',
            status: 'On Track',
            deadline: 'Q3 2026',
        },
        {
            title: 'Launch Partner Intelligence Module',
            status: 'At Risk',
            deadline: 'Q4 2026',
        },
        {
            title: 'Achieve 200+ Enterprise Clients',
            status: 'Completed',
            deadline: 'Q2 2026',
        },
    ],
    competitors: [
        { name: 'Rabbit', logo: 'https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://www.rabbitmart.com&size=128' },
        { name: 'Talabat', logo: 'https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://www.talabat.com&size=128' },
        { name: 'InstaShop', logo: 'https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://instashop.com&size=128' },
        { name: 'Breadfast', logo: 'https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://www.breadfast.com&size=128' },
        { name: 'Noon', logo: 'https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://www.noon.com&size=128' }
    ]
};

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
};

const corporateCardVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring' as const, stiffness: 400, damping: 20 } }
};

const objectiveVariants = {
    hidden: { opacity: 0, x: -30 },
    show: { opacity: 1, x: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
};



export default function ProfilePage() {
    const [activeSection, setActiveSection] = useState<string>('overview');
    const [isEditing, setIsEditing] = useState(false);
    const [bioText, setBioText] = useState(PROFILE_DATA.bio);

    const sections = [
        { id: 'overview', label: 'Overview' },
        { id: 'corporate', label: 'Corporate Identity' },
        { id: 'focus', label: 'Focus Areas' },
        { id: 'markets', label: 'Markets' },
        { id: 'objectives', label: 'Objectives' },
    ];

    const brandColor1 = '#C4841D';
    const brandColor2 = '#A16207';

    // Duplicate competitors for infinite marquee effect
    const marqueeItems = [...PROFILE_DATA.competitors, ...PROFILE_DATA.competitors, ...PROFILE_DATA.competitors, ...PROFILE_DATA.competitors];

    return (
        <div className="main-content" style={{ overflowY: 'auto', paddingBottom: 60, display: 'flex', flexDirection: 'column', position: 'relative', background: 'var(--bg-main)' }}>
            <style>{`
                .competitor-orb {
                    width: 56px;
                    height: 56px;
                    border-radius: 50%;
                    background: #ffffff;
                    border: 1px solid var(--border-color);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                    position: relative;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                    overflow: hidden;
                }
                .competitor-logo-hover {
                    position: relative;
                    cursor: pointer;
                }
                .competitor-logo-hover:hover .competitor-orb {
                    transform: translateY(-6px) scale(1.1);
                    border-color: #FF5A00;
                    box-shadow: 0 10px 25px rgba(255, 90, 0, 0.2);
                }
                .competitor-logo-hover:hover .comp-tooltip {
                    opacity: 1;
                    transform: translate(-50%, -10px);
                }
                .comp-tooltip {
                    position: absolute;
                    top: -30px;
                    left: 50%;
                    transform: translate(-50%, 0);
                    background: var(--text-primary);
                    color: var(--bg-main);
                    padding: 6px 12px;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 700;
                    opacity: 0;
                    pointer-events: none;
                    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                    white-space: nowrap;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                }
            `}</style>
            
            {/* Subtle Grid Overlay */}
            <div style={{
                position: 'absolute', inset: 0, zIndex: 0, opacity: 0.3, pointerEvents: 'none',
                backgroundImage: `linear-gradient(to right, var(--border-color) 1px, transparent 1px), linear-gradient(to bottom, var(--border-color) 1px, transparent 1px)`,
                backgroundSize: '40px 40px',
                maskImage: 'linear-gradient(to bottom, black 0%, transparent 60%)',
                WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 60%)'
            }} />

            <div style={{ padding: '80px 60px', maxWidth: 1200, margin: '0 auto', width: '100%', position: 'relative', zIndex: 1 }}>
                
                {/* TOP 2-COLUMN SECTION */}
                <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '60px' }}>
                    
                    {/* LEFT SIDEBAR: PROFILE CARD */}
                <div style={{ 
                    width: '340px', 
                    background: 'var(--card-bg)', 
                    borderRadius: '24px', 
                    padding: '16px',
                    border: '1px solid var(--border-color)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
                    display: 'flex', flexDirection: 'column'
                }}>
                    <div style={{ position: 'relative' }}>
                        <div style={{
                            height: '140px',
                            borderRadius: '16px',
                            position: 'relative',
                            background: 'linear-gradient(135deg, #FF5A00 0%, #A16207 100%)',
                            overflow: 'hidden'
                        }}>
                        </div>

                        <div style={{
                            position: 'absolute', bottom: '-40px', left: '20px',
                            width: '80px', height: '80px', borderRadius: '50%',
                            background: 'var(--card-bg)', padding: '4px', zIndex: 1
                        }}>
                            <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    
                    <div style={{ marginTop: '50px', padding: '0 10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>{PROFILE_DATA.name}</h2>
                                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>{PROFILE_DATA.jobTitle} @ {PROFILE_DATA.company}</p>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => setIsEditing(!isEditing)} style={{ 
                                    background: 'var(--text-primary)', color: 'var(--bg-main)', border: 'none',
                                    padding: '6px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer'
                                }}>
                                    {isEditing ? 'Save' : 'Edit'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div style={{ height: '1px', background: 'var(--border-color)', margin: '24px 10px' }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 20px', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                                <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{PROFILE_DATA.areasOfFocus.length}</span>
                            </div>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Focus</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path></svg>
                                <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{PROFILE_DATA.objectives.length}</span>
                            </div>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Objectives</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line></svg>
                                <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{PROFILE_DATA.markets.countries.length}</span>
                            </div>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Markets</span>
                        </div>
                    </div>

                    <div style={{ padding: '0 10px 10px 10px' }}>
                        <button style={{
                            width: '100%', padding: '14px', borderRadius: '16px', border: 'none',
                            background: 'var(--text-primary)', color: 'var(--bg-main)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                            fontSize: '14px', fontWeight: 600, cursor: 'pointer'
                        }}>
                            <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                            </div>
                            Get in Touch
                        </button>
                    </div>
                </div>

                {/* RIGHT MAIN CONTENT */}
                <div style={{ flex: 1, minWidth: '300px' }}>

                {/* Clean Bio Section */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    style={{ marginBottom: 60, maxWidth: 800 }}
                >
                    <h3 style={{ 
                        fontSize: 14, 
                        fontWeight: 600, 
                        color: 'var(--text-secondary)', 
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        marginBottom: '16px'
                    }}>
                        About
                    </h3>
                    {isEditing ? (
                        <textarea 
                            value={bioText}
                            onChange={(e) => setBioText(e.target.value)}
                            style={{ 
                                width: '100%', minHeight: '120px',
                                background: 'transparent', border: '1px solid var(--border-color)',
                                borderRadius: '8px', padding: '16px',
                                color: 'var(--text-primary)', fontSize: 16,
                                outline: 'none', resize: 'vertical'
                            }}
                        />
                    ) : (
                        <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: 'var(--text-primary)' }}>
                            {bioText}
                        </p>
                    )}
                </motion.div>


                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 1 }}
                    style={{ marginBottom: 60 }}
                >
                    <h3 style={{ 
                        fontSize: 14, 
                        fontWeight: 600, 
                        color: 'var(--text-secondary)', 
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        marginBottom: '20px'
                    }}>
                        Monitored Competitors
                    </h3>
                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {PROFILE_DATA.competitors.map((comp, idx) => (
                            <div key={idx} className="competitor-logo-hover">
                                <div className="competitor-orb">
                                    <img src={comp.logo} alt={comp.name} style={{ width: 32, height: 32, objectFit: 'contain' }} />
                                </div>
                                <div className="comp-tooltip">
                                    {comp.name}
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
                
                </div> {/* END RIGHT MAIN CONTENT */}
            </div> {/* END TOP 2-COLUMN SECTION */}

            {/* FULL WIDTH TABS SECTION */}
            <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                    style={{ display: 'flex', gap: 32, marginBottom: 40, borderBottom: '1px solid var(--border-color)' }}
                >
                    {sections.map((s) => (
                        <button
                            key={s.id}
                            className={`profile-tab ${activeSection === s.id ? 'active' : ''}`}
                            onClick={() => setActiveSection(s.id)}
                            style={{ 
                                padding: '16px 0', 
                                background: 'transparent', 
                                border: 'none', 
                                fontSize: 12, 
                                fontWeight: 600, 
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                cursor: 'pointer',
                                color: activeSection === s.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                                position: 'relative',
                                transition: 'color 0.3s'
                            }}
                        >
                            {s.label}
                            {activeSection === s.id && (
                                <motion.div layoutId="activeTab" transition={{ type: 'spring', stiffness: 300, damping: 30 }} style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: 2, background: '#FF5A00' }} />
                            )}
                        </button>
                    ))}
                </motion.div>


                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeSection}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    >

                        {activeSection === 'overview' && (
                            <motion.div variants={containerVariants} initial="hidden" animate="show">
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 60 }}>
                                    <motion.div variants={itemVariants} className="profile-stat-card">
                                        <span className="stat-label">Focus Areas</span>
                                        <span className="stat-value">{PROFILE_DATA.areasOfFocus.length}</span>
                                    </motion.div>
                                    <motion.div variants={itemVariants} className="profile-stat-card">
                                        <span className="stat-label">Countries Monitored</span>
                                        <span className="stat-value">{PROFILE_DATA.markets.countries.length}</span>
                                    </motion.div>
                                    <motion.div variants={itemVariants} className="profile-stat-card">
                                        <span className="stat-label">Active Objectives</span>
                                        <span className="stat-value">{PROFILE_DATA.objectives.length}</span>
                                    </motion.div>
                                </div>
                            </motion.div>
                        )}


                        {activeSection === 'corporate' && (
                            <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 24 }}>
                                {Object.entries(PROFILE_DATA.corporate).map(([key, value], idx) => (
                                    <motion.div 
                                        variants={corporateCardVariants} 
                                        key={key} 
                                        className="corporate-card"
                                        whileHover={{ scale: 1.02, rotate: idx % 2 === 0 ? 1 : -1 }}
                                    >
                                        <div className="corporate-glow-blob" />
                                        <span className="corporate-label">
                                            {key.replace(/([A-Z])/g, ' $1')}
                                        </span>
                                        <span className="corporate-value">{value}</span>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}


                        {activeSection === 'focus' && (
                            <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
                                {PROFILE_DATA.areasOfFocus.map((area, i) => (
                                    <motion.div variants={itemVariants} key={i} className="focus-card">
                                        <div className="focus-icon-container">
                                            {area.icon}
                                        </div>
                                        <span style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, color: 'var(--text-primary)' }}>{area.label}</span>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}


                        {activeSection === 'markets' && (
                            <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '80px', alignItems: 'center' }}>
                                {/* Left Side: 3D Globe */}
                                <motion.div variants={itemVariants} style={{ width: '100%' }}>
                                    <div style={{ marginBottom: 16 }}>
                                        <h3 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Global Footprint</h3>
                                        <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Monitored strategic regions</p>
                                    </div>
                                    {/* Explicit height required for Three.js renderer to measure container */}
                                    <div style={{ width: '100%', height: '500px', position: 'relative' }}>
                                        <Globe key="globe-v7" />
                                    </div>
                                </motion.div>

                                {/* Right Side: Data */}
                                <motion.div variants={containerVariants} style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
                                    <motion.div variants={itemVariants}>
                                        <h4 style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--text-secondary)', margin: '0 0 12px 0', letterSpacing: '0.15em', fontWeight: 600 }}>Active Countries</h4>
                                        <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: 16, lineHeight: 1.6, fontWeight: 400 }}>
                                            {PROFILE_DATA.markets.countries.join(' • ')}
                                        </p>
                                    </motion.div>
                                    
                                    <motion.div variants={itemVariants}>
                                        <h4 style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--text-secondary)', margin: '0 0 12px 0', letterSpacing: '0.15em', fontWeight: 600 }}>Broader Regions</h4>
                                        <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: 16, lineHeight: 1.6, fontWeight: 400 }}>
                                            {PROFILE_DATA.markets.regions.join(' • ')}
                                        </p>
                                    </motion.div>

                                    <motion.div variants={itemVariants}>
                                        <h4 style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--text-secondary)', margin: '0 0 12px 0', letterSpacing: '0.15em', fontWeight: 600 }}>Industries of Interest</h4>
                                        <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: 16, lineHeight: 1.6, fontWeight: 400 }}>
                                            {PROFILE_DATA.markets.industries.join(' • ')}
                                        </p>
                                    </motion.div>
                                </motion.div>
                            </motion.div>
                        )}


                        {activeSection === 'objectives' && (
                            <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: 32, position: 'relative', paddingLeft: 40 }}>
                                <motion.div 
                                    initial={{ height: 0 }} 
                                    animate={{ height: '100%' }} 
                                    transition={{ duration: 1.5, ease: "easeInOut" }}
                                    style={{ position: 'absolute', left: 8, top: 0, width: 2, background: 'linear-gradient(to bottom, #FF5A00, transparent)' }} 
                                />
                                {PROFILE_DATA.objectives.map((obj, i) => (
                                    <motion.div 
                                        variants={objectiveVariants} 
                                        key={i} 
                                        className="objective-timeline-card group"
                                    >
                                        <div className="objective-timeline-dot" />
                                        <div className="objective-card-inner">
                                            <div style={{ flex: 1 }}>
                                                <h4 className="objective-title">{obj.title}</h4>
                                                <div className="objective-meta">Target: {obj.deadline}</div>
                                            </div>
                                            <div className="objective-status-wrapper">
                                                <span className={`objective-status-badge status-${obj.status.replace(/\s+/g, '-').toLowerCase()}`}>
                                                    <span className="status-dot" />
                                                    {obj.status}
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
