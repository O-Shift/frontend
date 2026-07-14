'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PROFILE_DATA = {
    name: 'Vasil Stoyanov',
    jobTitle: 'Head of Strategy',
    company: 'OShift',
    department: 'Strategic Intelligence',
    workspaceRole: 'Admin',
    bio: 'Driving competitive intelligence and market expansion strategies across MENA and European markets. Passionate about leveraging data-driven insights to uncover hidden opportunities and anticipating market shifts.',
    corporate: {
        company: 'OShift',
        industry: 'Competitive Intelligence & SaaS',
        department: 'Strategic Intelligence',
        position: 'Head of Strategy',
        workspaceRole: 'Admin',
    },
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
    markets: {
        countries: ['Egypt', 'UAE', 'Saudi Arabia', 'Germany', 'UK'],
        regions: ['MENA', 'Western Europe', 'North Africa'],
        industries: ['EdTech', 'FinTech', 'E-Commerce', 'SaaS', 'Logistics'],
    },
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
        { 
            name: 'Rabbit', 
            icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 22h20L12 2z"/></svg>
        },
        { 
            name: 'Talabat', 
            icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
        },
        { 
            name: 'InstaShop', 
            icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/></svg>
        },
        { 
            name: 'Breadfast', 
            icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
        },
        { 
            name: 'Noon', 
            icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        }
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
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
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
                @keyframes liveGradientProfile {
                    0% { transform: scale(1) translate(0px, 0px); opacity: 0.1; }
                    33% { transform: scale(1.05) translate(2% , 2%); opacity: 0.15; }
                    66% { transform: scale(0.95) translate(-2%, -2%); opacity: 0.1; }
                    100% { transform: scale(1) translate(0px, 0px); opacity: 0.1; }
                }
            `}</style>
            
            <div style={{
                position: 'absolute', top: -150, left: 0, right: 0, height: '800px',
                background: `radial-gradient(circle at 30% 0%, ${brandColor1}, transparent 40%), radial-gradient(circle at 70% 20%, ${brandColor2}, transparent 40%)`,
                filter: 'blur(120px)', animation: 'liveGradientProfile 20s ease-in-out infinite',
                pointerEvents: 'none', zIndex: 0
            }} />

            <div style={{ padding: '80px 60px', maxWidth: 1100, margin: '0 auto', width: '100%', position: 'relative', zIndex: 1 }}>
                
                {/* HERO SECTION */}
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                    style={{ position: 'relative', marginBottom: 80, minHeight: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
                >
                    {/* GIANT BACKGROUND LOGO */}
                    <div className="giant-bg-logo">
                        <svg width="400" height="400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                        </svg>
                    </div>

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        {/* HUGE CINEMATIC NAME */}
                        <h2 style={{ 
                            fontSize: 110, 
                            fontWeight: 400, 
                            margin: '0 0 32px 0', 
                            color: 'var(--text-primary)', 
                            fontFamily: '"Playfair Display", "Times New Roman", Times, serif',
                            letterSpacing: '0.05em',
                            lineHeight: 0.9,
                            textTransform: 'uppercase'
                        }}>
                            {PROFILE_DATA.name.split(' ')[0]}<br/>
                            {PROFILE_DATA.name.split(' ')[1]}
                        </h2>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <p style={{ 
                                    fontSize: 14, 
                                    color: '#FF5A00', 
                                    margin: '0 0 24px 0', 
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.2em'
                                }}>{PROFILE_DATA.jobTitle}</p>
                                
                                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                    <span className="profile-meta-chip">
                                        {PROFILE_DATA.company}
                                    </span>
                                    <span className="profile-meta-chip">
                                        {PROFILE_DATA.department}
                                    </span>
                                    <span className="profile-meta-chip role-chip">
                                        {PROFILE_DATA.workspaceRole}
                                    </span>
                                </div>
                            </div>
                            
                            <div style={{ paddingTop: 16 }}>
                                <button onClick={() => setIsEditing(!isEditing)} className="profile-edit-btn">
                                    {isEditing ? 'Save Changes' : 'Edit Profile'}
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* BIO */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    style={{ marginBottom: 40, maxWidth: 800 }}
                >
                    {isEditing ? (
                        <textarea 
                            value={bioText}
                            onChange={(e) => setBioText(e.target.value)}
                            style={{ 
                                width: '100%',
                                minHeight: '120px',
                                background: 'transparent',
                                border: '1px solid #FF5A00',
                                borderRadius: '8px',
                                padding: '16px',
                                color: 'var(--text-primary)',
                                fontSize: 16,
                                fontFamily: '"Playfair Display", "Times New Roman", Times, serif',
                                fontStyle: 'italic',
                                outline: 'none',
                                resize: 'vertical'
                            }}
                        />
                    ) : (
                        <p style={{ 
                            margin: 0, 
                            fontSize: 18, 
                            lineHeight: 1.8, 
                            color: 'var(--text-secondary)',
                            fontFamily: '"Playfair Display", "Times New Roman", Times, serif',
                            fontStyle: 'italic',
                            borderLeft: '2px solid #FF5A00',
                            paddingLeft: 32
                        }}>
                            "{bioText}"
                        </p>
                    )}
                </motion.div>

                {/* MONITORED COMPETITORS MARQUEE (RESTORED) */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 1 }}
                >
                    <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: 8, marginLeft: 32 }}>
                        Monitored Competitors
                    </div>
                    <div className="competitor-marquee-wrapper">
                        <div className="competitor-marquee-content">
                            {marqueeItems.map((comp, idx) => (
                                <div key={idx} className="competitor-logo">
                                    {comp.icon}
                                    <span className="competitor-name">{comp.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* TABS */}
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

                {/* CONTENT */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeSection}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    >
                        {/* OVERVIEW */}
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

                        {/* CORPORATE IDENTITY */}
                        {activeSection === 'corporate' && (
                            <motion.div variants={containerVariants} initial="hidden" animate="show" className="profile-detail-list">
                                {Object.entries(PROFILE_DATA.corporate).map(([key, value]) => (
                                    <motion.div variants={itemVariants} key={key} className="profile-detail-row">
                                        <span className="detail-label">
                                            {key.replace(/([A-Z])/g, ' $1')}
                                        </span>
                                        <span className="detail-value">{value}</span>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}

                        {/* AREAS OF FOCUS */}
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

                        {/* MARKETS & REGIONS */}
                        {activeSection === 'markets' && (
                            <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
                                <motion.div variants={itemVariants}>
                                    <h4 style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-secondary)', margin: '0 0 16px 0', letterSpacing: '0.15em' }}>Countries</h4>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                                        {PROFILE_DATA.markets.countries.map((c, i) => (
                                            <span key={i} className="market-pill">{c}</span>
                                        ))}
                                    </div>
                                </motion.div>
                                <motion.div variants={itemVariants}>
                                    <h4 style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-secondary)', margin: '0 0 16px 0', letterSpacing: '0.15em' }}>Regions</h4>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                                        {PROFILE_DATA.markets.regions.map((r, i) => (
                                            <span key={i} className="market-pill">{r}</span>
                                        ))}
                                    </div>
                                </motion.div>
                                <motion.div variants={itemVariants}>
                                    <h4 style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-secondary)', margin: '0 0 16px 0', letterSpacing: '0.15em' }}>Industries of Interest</h4>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                                        {PROFILE_DATA.markets.industries.map((ind, i) => (
                                            <span key={i} className="market-pill">{ind}</span>
                                        ))}
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}

                        {/* STRATEGIC OBJECTIVES */}
                        {activeSection === 'objectives' && (
                            <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                {PROFILE_DATA.objectives.map((obj, i) => (
                                    <motion.div variants={itemVariants} key={i} className="objective-card-large">
                                        <div>
                                            <h4 style={{ margin: '0 0 8px 0', fontSize: 24, fontFamily: '"Playfair Display", "Times New Roman", Times, serif', fontWeight: 400, color: 'var(--text-primary)', letterSpacing: '0.02em' }}>{obj.title}</h4>
                                            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)' }}>Target: {obj.deadline}</div>
                                        </div>
                                        <div>
                                            <span className="objective-status-badge" style={{
                                                background: obj.status === 'Completed' ? 'rgba(16, 185, 129, 0.1)' : obj.status === 'At Risk' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 90, 0, 0.1)',
                                                color: obj.status === 'Completed' ? '#10B981' : obj.status === 'At Risk' ? '#EF4444' : '#FF5A00',
                                                borderColor: obj.status === 'Completed' ? 'rgba(16, 185, 129, 0.2)' : obj.status === 'At Risk' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 90, 0, 0.2)'
                                            }}>
                                                {obj.status}
                                            </span>
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
