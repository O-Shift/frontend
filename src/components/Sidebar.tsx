'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Check, ChevronsUpDown, LayoutGrid, X } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { usePinned } from '@/context/PinnedContext';
import { useCurrentUser } from '@/hooks/use-current-user';
import { apiFetch, fetchCompany, getActiveWorkspaceId, setActiveWorkspaceId, type Workspace } from '@/lib/api';
import { EVENTS, setWorkspaceContext, track } from '@/lib/analytics';
import { logoUrl, sigilStyle, sigilInitials } from '@/lib/logos';

interface SidebarProps {
    mobileNavOpen?: boolean;
    onMobileClose?: () => void;
}

export default function Sidebar({ mobileNavOpen = false, onMobileClose }: SidebarProps) {
    const [collapsed, setCollapsed] = useState(false);
    const [competitorsExpanded, setCompetitorsExpanded] = useState(true);
    const pathname = usePathname();
    const router = useRouter();
    const { theme, toggle } = useTheme();
    const { pinned } = usePinned();
    const { user, loading: userLoading } = useCurrentUser();
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [workspaceName, setWorkspaceName] = useState('Workspace');
    const [workspaceId, setWorkspaceId] = useState<string | null>(null);
    const [companyName, setCompanyName] = useState<string | null>(null);
    const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null);
    const [logoLoadFailed, setLogoLoadFailed] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    // The drawer is always expanded; collapse stays a desktop-only affordance.
    const [isDesktop, setIsDesktop] = useState(true);

    useEffect(() => {
        const desktopQuery = window.matchMedia('(width >= 1024px)');
        const updateIsDesktop = () => setIsDesktop(desktopQuery.matches);
        updateIsDesktop();
        desktopQuery.addEventListener('change', updateIsDesktop);
        return () => desktopQuery.removeEventListener('change', updateIsDesktop);
    }, []);

    useEffect(() => {
        let active = true;

        const loadWorkspaceData = (wsId: string | null) => {
            setWorkspaceId(wsId);
            setLogoLoadFailed(false);
            if (!wsId) return;

            void Promise.all([
                apiFetch<Workspace[]>('/core/workspaces', { skipWorkspace: true }),
                fetchCompany(),
            ]).then(([wsRes, compRes]) => {
                if (!active) return;
                if (wsRes.ok) {
                    setWorkspaces(wsRes.data);
                    const workspace = wsRes.data.find((item) => item.id === wsId);
                    if (workspace) setWorkspaceName(workspace.name);
                }
                if (compRes.ok && compRes.data) {
                    setCompanyName(compRes.data.name);
                    const logo = compRes.data.website ? logoUrl(compRes.data.website) : null;
                    setCompanyLogoUrl(logo);
                } else {
                    setCompanyName(null);
                    setCompanyLogoUrl(null);
                }
            });
        };

        const initialWsId = getActiveWorkspaceId();
        loadWorkspaceData(initialWsId);

        const handleWorkspaceChange = () => {
            const nextWsId = getActiveWorkspaceId();
            loadWorkspaceData(nextWsId);
        };

        window.addEventListener('oshift:workspace-changed', handleWorkspaceChange);
        return () => {
            active = false;
            window.removeEventListener('oshift:workspace-changed', handleWorkspaceChange);
        };
    }, []);

    // Close dropdown on click outside or Escape key
    useEffect(() => {
        if (!dropdownOpen) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [dropdownOpen]);

    const handleSelectWorkspace = (selected: Workspace) => {
        setDropdownOpen(false);
        if (selected.id === workspaceId) return;

        setActiveWorkspaceId(selected.id);
        setWorkspaceContext(selected.id);
        track(EVENTS.WORKSPACE_SELECTED, { workspace_id: selected.id, automatic: false });
        router.refresh();
    };

    // The disclosure control is only meaningful when there is something to
    // disclose. With nothing pinned it used to render anyway and toggle an
    // empty list, so the chevron read as a broken menu.
    const hasPinned = pinned.length > 0;
    const showPinnedList = hasPinned && competitorsExpanded;

    const displayName = workspaceName || 'Workspace';
    const displayInitials = sigilInitials(companyName || displayName);
    const hasValidLogo = Boolean(companyLogoUrl && !logoLoadFailed);
    const effectiveCollapsed = collapsed && isDesktop;

    return (
        <div className={`sidebar ${effectiveCollapsed ? 'collapsed' : ''} ${mobileNavOpen ? 'mobile-open' : ''}`} id="appSidebar">
            <div className="sidebar-header">
                <div className="logo-area">
                    <img
                        src="/orange logo.png"
                        alt="OShift"
                        className="sidebar-logo"
                    />
                </div>
                <div className="sidebar-header-actions">
                    {/* Mobile drawer close (rendered only while the drawer is open) */}
                    {mobileNavOpen && (
                        <button
                            type="button"
                            className="collapse-btn mobile-nav-close-btn"
                            onClick={onMobileClose}
                            title="Close menu"
                            aria-label="Close navigation menu"
                        >
                            <X size={14} aria-hidden="true" />
                        </button>
                    )}
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
                    <button
                        type="button"
                        className="collapse-btn collapse-toggle"
                        onClick={() => setCollapsed(!collapsed)}
                        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <line x1="9" y1="3" x2="9" y2="21" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="sidebar-scroll-area">
                {/* Top Workspace Context Switcher Widget with Dropdown */}
                <div className="workspace-switcher-wrapper" ref={dropdownRef}>
                    <button
                        type="button"
                        className={`workspace-switcher ${dropdownOpen ? 'open' : ''}`}
                        onClick={() => setDropdownOpen((prev) => !prev)}
                        aria-expanded={dropdownOpen}
                        aria-haspopup="menu"
                        title={collapsed ? `Workspace: ${displayName}` : undefined}
                    >
                        <div className="workspace-switcher-visual" aria-hidden="true">
                            {hasValidLogo ? (
                                <img
                                    src={companyLogoUrl!}
                                    alt=""
                                    className="workspace-switcher-logo"
                                    onError={() => setLogoLoadFailed(true)}
                                />
                            ) : (
                                <span
                                    className="workspace-switcher-sigil"
                                    style={workspaceId ? sigilStyle(workspaceId) : undefined}
                                >
                                    {displayInitials}
                                </span>
                            )}
                        </div>
                        <div className="workspace-switcher-copy">
                            <span className="workspace-switcher-label">Workspace</span>
                            <span className="workspace-switcher-name">{displayName}</span>
                        </div>
                        <ChevronsUpDown
                            className={`workspace-switcher-chevron ${dropdownOpen ? 'rotate-180' : ''}`}
                            size={15}
                            aria-hidden="true"
                        />
                    </button>

                    {dropdownOpen && (
                        <div className="workspace-dropdown-menu" role="menu" aria-label="Select Workspace">
                            <div className="workspace-dropdown-header">
                                <span>Workspaces</span>
                                <span className="workspace-dropdown-count">{workspaces.length}</span>
                            </div>

                            <div className="workspace-dropdown-list">
                                {workspaces.length === 0 ? (
                                    <div className="workspace-dropdown-empty">No workspaces found</div>
                                ) : (
                                    workspaces.map((ws) => {
                                        const isCurrent = ws.id === workspaceId;
                                        return (
                                            <button
                                                key={ws.id}
                                                type="button"
                                                className={`workspace-dropdown-item ${isCurrent ? 'active' : ''}`}
                                                onClick={() => handleSelectWorkspace(ws)}
                                                role="menuitem"
                                            >
                                                <div
                                                    className="workspace-dropdown-item-sigil"
                                                    style={sigilStyle(ws.id)}
                                                    aria-hidden="true"
                                                >
                                                    {sigilInitials(ws.name)}
                                                </div>
                                                <div className="workspace-dropdown-item-info">
                                                    <div className="workspace-dropdown-item-name">{ws.name}</div>
                                                    {ws.plan && (
                                                        <div className="workspace-dropdown-item-meta">
                                                            <span className={`ws-plan-badge ${ws.plan.toLowerCase()}`}>
                                                                {ws.plan}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                {isCurrent && (
                                                    <Check size={14} className="workspace-dropdown-check" aria-hidden="true" />
                                                )}
                                            </button>
                                        );
                                    })
                                )}
                            </div>

                            <div className="workspace-dropdown-divider" />

                            <div className="workspace-dropdown-actions">
                                <Link
                                    href={`/workspaces?next=${encodeURIComponent(pathname)}`}
                                    className="workspace-dropdown-action-link"
                                    onClick={() => setDropdownOpen(false)}
                                >
                                    <LayoutGrid size={13} aria-hidden="true" />
                                    <span>Manage all workspaces</span>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>


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
                            <path d="M14 18a2 2 0 0 0-4 0" />
                            <path d="m19 11-2.11-6.657a2 2 0 0 0-2.752-1.148l-1.276.61A2 2 0 0 1 12 4H8.5a2 2 0 0 0-1.925 1.456L5 11" />
                            <path d="M2 11h20" />
                            <circle cx="17" cy="18" r="3" />
                            <circle cx="7" cy="18" r="3" />
                        </svg>
                        Agent
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
                    <Link href="/videos" className={`nav-item ${pathname === '/videos' ? 'active' : ''}`}>
                        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m22 8-6 4 6 4V8Z" />
                            <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
                        </svg>
                        Videos
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
                            {!collapsed && hasPinned && (
                                <button
                                    type="button"
                                    className="p-1.5 cursor-pointer hover:bg-[var(--item-hover-alt)] rounded-md flex items-center justify-center transition-colors"
                                    aria-expanded={competitorsExpanded}
                                    aria-label={competitorsExpanded ? 'Hide pinned competitors' : 'Show pinned competitors'}
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCompetitorsExpanded(!competitorsExpanded); }}
                                >
                                    <svg
                                        className={`w-3.5 h-3.5 transition-transform duration-200 ${competitorsExpanded ? 'rotate-90' : ''}`}
                                        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                    >
                                        <polyline points="9 18 15 12 9 6" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        {/* Nested Competitors List */}
                        {showPinnedList && (
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
                            <div className="avatar">{user?.initials ?? ''}</div>
                            <div className="user-info">
                                <div className="user-name">
                                    {user?.name ?? (userLoading ? '' : 'Signed out')}
                                </div>
                                <div className="user-email">{user?.email ?? ''}</div>
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
