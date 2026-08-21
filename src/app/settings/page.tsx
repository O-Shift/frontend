'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import PromptField from '@/components/PromptField';
import { useTheme } from '@/components/ThemeProvider';
import { EVENTS, track } from '@/lib/analytics';
import { createClient } from '@/utils/supabase/client';
import { useSettings } from '@/hooks/use-settings';
import { useMediaQuery } from '@/hooks/use-media-query';
import NotificationSettings from '@/components/settings/NotificationSettings';

const SampleBadge = () => (
  <span style={{ fontSize: 10, background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', padding: '2px 6px', borderRadius: 4, marginLeft: 8, verticalAlign: 'middle', textTransform: 'uppercase', fontWeight: 600 }}>Mock data</span>
);

export default function SettingsPage() {
  const router = useRouter();
  const { users, featureFlags, updateFeatureFlag } = useSettings();
  const [activeTab, setActiveTab] = useState('main');
  const [loggingOut, setLoggingOut] = useState(false);
  const { theme, toggle } = useTheme();

  // PromptField State
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [commandActive, setCommandActive] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [, setSidebarCollapsed] = useState(false);

  // Responsive container padding: 60px desktop, 24px tablet, 16px mobile
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isTablet = useMediaQuery('(min-width: 768px)');

  // Global thinking class toggle
  useEffect(() => {
    if (isThinking) {
      document.body.classList.add('is-thinking-active');
      const timer = setTimeout(() => {
        setIsThinking(false);
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      document.body.classList.remove('is-thinking-active');
    }
  }, [isThinking]);

  // Sidebar command interaction
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setCommandActive(false);
        setSelectedNode(null);
        setSidebarCollapsed(false);
      }
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    // Captured before signOut so the event still belongs to the identified
    // person; the auth listener resets the PostHog identity right after.
    track(EVENTS.LOGGED_OUT, { source: 'settings' });
    const supabase = createClient();
    await supabase.auth.signOut();
    sessionStorage.removeItem('oshift.workspace_id');
    router.push('/login');
    router.refresh();
  };

  const renderHeader = (title: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
      <button
        onClick={() => setActiveTab('main')}
        className="skeleton-target rounded-md"
        style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--item-hover)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
      </button>
      <h1 className="skeleton-target" style={{ fontSize: 32, fontWeight: 600, color: 'var(--text-primary)', margin: 0, fontFamily: 'var(--font-poppins)' }}>{title}</h1>
    </div>
  );

  const rowStyle = {
    width: '100%',
    padding: '20px 24px',
    background: 'transparent',
    border: 'none',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: 'var(--text-primary)',
    fontSize: 16,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background 0.2s'
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'main':
        return (
          <motion.div key="main" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            <h1 className="skeleton-target" style={{ fontSize: 32, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 32, fontFamily: 'var(--font-poppins)' }}>Settings</h1>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

              {/* General Group */}
              <div>
                <h2 className="skeleton-target" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em', paddingLeft: 16 }}>General</h2>
                <div className="skeleton-target" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '16px 24px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ background: 'var(--card-bg-alt)', width: 40, height: 40, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                    </div>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>Theme Appearance</h3>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>Toggle between dark mode and light mode.</p>
                    </div>
                  </div>
                  <button onClick={toggle} className="rounded-md" style={{ width: 52, height: 28, background: theme === 'dark' ? 'var(--accent)' : 'var(--border-color)', position: 'relative', cursor: 'pointer', border: 'none', transition: 'background 0.3s' }}>
                    <motion.div layout initial={false} animate={{ x: theme === 'dark' ? 26 : 2 }} style={{ width: 24, height: 24, borderRadius: 12, background: 'white', position: 'absolute', top: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
                  </button>
                </div>

                <div className="skeleton-target" style={{ background: 'var(--card-bg)', borderRadius: 12, border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                  <button onClick={() => setActiveTab('notifications')} style={rowStyle} onMouseEnter={e => e.currentTarget.style.background = 'var(--item-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                      <span>Notifications & Delivery Cadence</span>
                    </div>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                  </button>
                </div>
              </div>

              {/* Workspace Group */}
              <div>
                <h2 className="skeleton-target" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em', paddingLeft: 16 }}>Workspace</h2>
                <div className="skeleton-target" style={{ background: 'var(--card-bg)', borderRadius: 12, border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                  <button onClick={() => setActiveTab('users')} style={rowStyle} onMouseEnter={e => e.currentTarget.style.background = 'var(--item-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                      <span>Workspace Users</span>
                    </div>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                  </button>
                </div>
              </div>

              {/* Account & Legal Group */}
              <div>
                <h2 className="skeleton-target" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em', paddingLeft: 16 }}>Account & Legal</h2>

                <div className="skeleton-target" style={{ background: 'var(--card-bg)', borderRadius: 12, border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                  <button onClick={() => setActiveTab('terms')} style={rowStyle} onMouseEnter={e => e.currentTarget.style.background = 'var(--item-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                      <span>Terms of Service</span>
                    </div>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                  </button>
                  <div style={{ height: 1, background: 'var(--border-color)', margin: '0 24px' }} />
                  <button onClick={() => setActiveTab('privacy')} style={rowStyle} onMouseEnter={e => e.currentTarget.style.background = 'var(--item-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                      <span>Privacy Policy</span>
                    </div>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                  </button>
                </div>

                <div className="skeleton-target" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '16px 24px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ background: 'var(--card-bg-alt)', width: 40, height: 40, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    </div>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>Password Reset <SampleBadge /></h3>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>Send a password reset link to your email.</p>
                    </div>
                  </div>
                  <button className="rounded-md" style={{ background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--text-primary)', padding: '6px 12px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                    Send Link
                  </button>
                </div>

                <div className="skeleton-target" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '16px 24px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ background: 'var(--item-hover)', width: 40, height: 40, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                    </div>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 500, color: '#ef4444', marginBottom: 4 }}>Logout</h3>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>Securely sign out of your account on this device.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="rounded-md"
                    style={{ background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', padding: '6px 12px', fontSize: 13, fontWeight: 500, cursor: loggingOut ? 'wait' : 'pointer', opacity: loggingOut ? 0.7 : 1 }}
                  >
                    {loggingOut ? 'Signing out…' : 'Logout'}
                  </button>
                </div>
              </div>

              {/* Developer Group */}
              <div>
                <h2 className="skeleton-target" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em', paddingLeft: 16 }}>Developer</h2>
                <div className="skeleton-target" style={{ background: 'var(--card-bg)', borderRadius: 12, border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                  <button onClick={() => setActiveTab('feature-flags')} style={rowStyle} onMouseEnter={e => e.currentTarget.style.background = 'var(--item-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
                      <span>Feature Flags</span>
                    </div>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                  </button>
                </div>
              </div>

            </div>
          </motion.div>
        );

      case 'feature-flags':
        return (
          <motion.div key="feature-flags" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
            {renderHeader('Feature Flags')}
            <div className="skeleton-target" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden' }}>
              {featureFlags.loading ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading flags...</div>
              ) : featureFlags.error ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#ef4444' }}>{featureFlags.error}</div>
              ) : featureFlags.items.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>No feature flags found.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {featureFlags.items.map((flag, i) => (
                    <div key={flag.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: i < featureFlags.items.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                      <div>
                        <h3 style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>{flag.name}</h3>
                      </div>
                      <button 
                        onClick={() => updateFeatureFlag(flag.name, !flag.enabled)} 
                        className="rounded-md"
                        style={{ width: 44, height: 24, background: flag.enabled ? 'var(--accent)' : 'var(--border-color)', position: 'relative', cursor: 'pointer', border: 'none', transition: 'background 0.3s' }}>
                        <motion.div layout initial={false} animate={{ x: flag.enabled ? 22 : 2 }} style={{ width: 20, height: 20, borderRadius: 10, background: 'white', position: 'absolute', top: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        );

      case 'users':
        return (
          <motion.div key="users" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
              {renderHeader('Workspace Users')}
              <button className="skeleton-target rounded-md" style={{ background: 'var(--text-primary)', color: 'var(--bg-body)', padding: '10px 20px', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer', marginTop: -32 }}>
                + Invite User
              </button>
            </div>

            <div className="skeleton-target" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden' }}>
              {users.loading ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading users...</div>
              ) : users.error ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#ef4444' }}>{users.error}</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--card-bg-alt)' }}>
                      <th style={{ padding: '16px 24px', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>User</th>
                      <th style={{ padding: '16px 24px', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Role</th>
                      <th style={{ padding: '16px 24px', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Access</th>
                      <th style={{ padding: '16px 24px', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.items.map((user: { id: string; name: string; email: string; role: string; access: string; status: string }) => (
                      <tr key={user.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '16px 24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 14 }}>
                              {user.name.charAt(0)}
                            </div>
                            <div>
                              <div style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: 15 }}>{user.name}</div>
                              <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px 24px', color: 'var(--text-primary)', fontSize: 14 }}>{user.role}</td>
                        <td style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontSize: 14 }}>{user.access}</td>
                        <td style={{ padding: '16px 24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: user.status === 'Active' ? '#4ade80' : '#FF6700' }} />
                            {user.status}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        );

      case 'terms':
        return (
          <motion.div key="terms" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
            {renderHeader('Terms of Service')}
            <div className="skeleton-target" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 12, padding: 32, color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: 14 }}>
              <h3 style={{ color: 'var(--text-primary)', fontSize: 18, marginBottom: 16 }}>1. Acceptance of Terms</h3>
              <p style={{ marginBottom: 24 }}>By accessing or using OShift, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.</p>

              <h3 style={{ color: 'var(--text-primary)', fontSize: 18, marginBottom: 16 }}>2. Use License</h3>
              <p style={{ marginBottom: 24 }}>Permission is granted to temporarily download one copy of the materials (information or software) on OShift&apos;s website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.</p>

              <h3 style={{ color: 'var(--text-primary)', fontSize: 18, marginBottom: 16 }}>3. Disclaimer</h3>
              <p style={{ marginBottom: 24 }}>The materials on OShift&apos;s website are provided on an &apos;as is&apos; basis. OShift makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
            </div>
          </motion.div>
        );

      case 'privacy':
        return (
          <motion.div key="privacy" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
            {renderHeader('Privacy Policy')}
            <div className="skeleton-target" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 12, padding: 32, color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: 14 }}>
              <h3 style={{ color: 'var(--text-primary)', fontSize: 18, marginBottom: 16 }}>1. Information We Collect</h3>
              <p style={{ marginBottom: 24 }}>We collect information that you provide directly to us, including your name, email address, password, and any other information you choose to provide when creating your OShift account or communicating with us.</p>

              <h3 style={{ color: 'var(--text-primary)', fontSize: 18, marginBottom: 16 }}>2. How We Use Your Information</h3>
              <p style={{ marginBottom: 24 }}>We use the information we collect to provide, maintain, and improve our services, to process transactions and send related information, and to monitor and analyze trends, usage, and activities in connection with our services.</p>

              <h3 style={{ color: 'var(--text-primary)', fontSize: 18, marginBottom: 16 }}>3. Data Security</h3>
              <p style={{ marginBottom: 24 }}>We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction. However, no data transmission over the Internet can be guaranteed to be 100% secure.</p>
            </div>
          </motion.div>
        );

      case 'notifications':
        return (
          <motion.div key="notifications" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
            {renderHeader('Notification Preferences')}
            <NotificationSettings />
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <div className="main-content" style={{ overflowY: 'auto', padding: isDesktop ? 60 : isTablet ? 24 : 16, display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 768 }}>
          <AnimatePresence mode="wait">
            {renderContent()}
          </AnimatePresence>
        </div>
      </div>

      <PromptField
        selectedNode={selectedNode}
        setSelectedNode={setSelectedNode}
        commandActive={commandActive}
        setCommandActive={setCommandActive}
        setSidebarCollapsed={setSidebarCollapsed}
        onThinkingChange={setIsThinking}
      />
    </>
  );
}
