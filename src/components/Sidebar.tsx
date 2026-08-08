'use client';
import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTheme } from './ThemeProvider';
import { usePinned } from '@/context/PinnedContext';

export default function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const [competitorsExpanded, setCompetitorsExpanded] = useState(true);
    const pathname = usePathname();
    const { theme, toggle } = useTheme();
    const { pinned } = usePinned();

    return (
        <div className={`sidebar ${collapsed ? 'collapsed' : ''}`} id="appSidebar">
            <div className="sidebar-header">
                <div className="logo-area">
                    <img
                        src="/orange logo.png"
                        alt="OShift"
                        className="sidebar-logo"
                    />
                </div>
                <div className="sidebar-header-actions">
                    {/* Theme toggle */}
                    <button
                        className="collapse-btn theme-toggle-btn"
                        onClick={toggle}
                        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        aria-label="Toggle theme"
                    >
                        {theme === 'dark' ? (
                            /* Sun icon */
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="5" />
                                <line x1="12" y1="1" x2="12" y2="3" />
                                <line x1="12" y1="21" x2="12" y2="23" />
                                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                                <line x1="1" y1="12" x2="3" y2="12" />
                                <line x1="21" y1="12" x2="23" y2="12" />
                                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                            </svg>
                        ) : (
                            /* Moon icon */
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                            </svg>
                        )}
                    </button>
                    {/* Collapse toggle */}
                    <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <line x1="9" y1="3" x2="9" y2="21" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="sidebar-scroll-area">

                <div className="nav-section">
                    <Link href="/" className={`nav-item ${pathname === '/' ? 'active' : ''}`}>
                        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <path d="M3 9h18" />
                            <path d="M9 21V9" />
                        </svg>
                        Dashboard
                    </Link>
                    <Link href="/chat" className={`nav-item ${pathname === '/chat' ? 'active' : ''}`}>
                        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        AI Agent Chat
                    </Link>
                    <Link href="/opportunities" className={`nav-item ${pathname === '/opportunities' ? 'active' : ''}`}>
                        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 16 16 12 12 8" />
                            <line x1="8" y1="12" x2="16" y2="12" />
                        </svg>
                        Opportunities
                    </Link>
                    <Link href="/partnerships" className={`nav-item ${pathname === '/partnerships' ? 'active' : ''}`}>
                        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        Partnerships
                    </Link>
                    <Link href="/campaigns" className={`nav-item ${pathname === '/campaigns' ? 'active' : ''}`}>
                        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <circle cx="12" cy="12" r="6" />
                            <circle cx="12" cy="12" r="2" />
                        </svg>
                        Campaigns
                    </Link>

                    <div className="flex flex-col">
                        <div
                            className={`nav-item justify-between w-full ${pathname.startsWith('/competitors') || pathname.startsWith('/company') ? 'active' : ''} ${!collapsed ? 'pr-1' : ''}`}
                        >
                            <Link href="/competitors" className="flex items-center gap-3 flex-1 h-full" style={{ textDecoration: 'none', color: 'inherit' }}>
                                <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="12 2 2 7 12 12 22 7 12 2" />
                                    <polyline points="2 12 12 17 22 12" />
                                    <polyline points="2 17 12 22 22 17" />
                                </svg>
                                {!collapsed && <span>Competitors</span>}
                            </Link>
                            {!collapsed && (
                                <div
                                    className="p-1.5 cursor-pointer hover:bg-[var(--item-hover-alt)] rounded-md flex items-center justify-center transition-colors"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCompetitorsExpanded(!competitorsExpanded); }}
                                >
                                    <svg
                                        className={`w-3.5 h-3.5 transition-transform duration-200 ${competitorsExpanded ? 'rotate-90' : ''}`}
                                        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                    >
                                        <polyline points="9 18 15 12 9 6" />
                                    </svg>
                                </div>
                            )}
                        </div>

                        {/* Nested Competitors List */}
                        {competitorsExpanded && pinned && pinned.length > 0 && (
                            <div className={`flex flex-col mt-1 mb-2 ${collapsed ? 'items-center gap-2' : 'pl-4 ml-4 border-l border-[var(--border-color)]'}`}>
                                {pinned.map(comp => (
                                    <Link key={comp.competitor_id} href={`/company/${comp.domain}`} className={`flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--item-hover)] rounded-md transition-colors relative ${collapsed ? 'p-1' : 'py-2 px-3'}`}>
                                        <div className="relative shrink-0 flex items-center justify-center w-5 h-5">
                                            <img src={comp.logo} alt={comp.name} className="w-full h-full object-cover rounded border border-[var(--border-color)]" />
                                            {comp.hasNews && (
                                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-[var(--bg-main-alt)] z-10" />
                                            )}
                                        </div>
                                        {!collapsed && <span className="truncate">{comp.name}</span>}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="nav-section">
                    <div className="nav-label">WORKFLOWS & INTEGRATIONS</div>
                    <Link href="/automations" className={`nav-item ${pathname === '/automations' ? 'active' : ''}`}>
                        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                        Automations
                    </Link>
                    <Link href="/exports" className={`nav-item ${pathname === '/exports' ? 'active' : ''}`}>
                        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                            <polyline points="16 6 12 2 8 6" />
                            <line x1="12" y1="2" x2="12" y2="15" />
                        </svg>
                        Exports
                    </Link>
                    <Link href="/social-accounts" className={`nav-item ${pathname === '/social-accounts' ? 'active' : ''}`}>
                        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                        </svg>
                        Social Accounts
                    </Link>
                </div>

                <div className="nav-section">
                    <div className="nav-label">OTHER</div>
                    <Link href="/settings" className={`nav-item ${pathname === '/settings' ? 'active' : ''}`}>
                        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                        </svg>
                        Settings
                    </Link>
                </div>

                <div className="sidebar-bottom">
                    <Link href="/profile" style={{ textDecoration: 'none' }}>
                        <div className={`user-profile ${pathname === '/profile' ? 'active' : ''}`}>
                            <div className="avatar"></div>
                            <div className="user-info">
                                <div className="user-name">Vasil S.</div>
                                <div className="user-email">vasil@pshift.com</div>
                            </div>
                            <div className="chevron-up-down">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="18 15 12 9 6 15" />
                                </svg>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="6 9 12 15 18 9" />
                                </svg>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
