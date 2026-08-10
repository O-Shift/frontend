// oshift/src/app/social-accounts/page.tsx
'use client';

import { useState } from 'react';
import { useSocialAccounts } from '@/hooks/use-social-accounts';
import { socialAccountCreateSchema } from '@/types/schemas';
import {
  Share2,
  Plus,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Loader2,
  X,
  AlertCircle,
  Users,
  Search,
  Zap,
  Check,
  Radio,
  SlidersHorizontal,
} from 'lucide-react';
import { FaInstagram, FaLinkedin, FaYoutube, FaFacebook, FaXTwitter, FaTiktok } from 'react-icons/fa6';
import { SocialPlatform } from '@/types/entities';
import { motion, AnimatePresence } from 'framer-motion';

export default function SocialAccountsPage() {
  const {
    accounts,
    isLoading,
    isCollecting,
    collectStats,
    error,
    createAccount,
    updateAccount,
    deleteAccount,
    collectAll,
    refreshAccounts,
  } = useSocialAccounts();

  const [platformFilter, setPlatformFilter] = useState<'all' | SocialPlatform>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    platform: 'x' as SocialPlatform,
    handle: '',
    display_name: '',
    follower_count: 0,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const parseRes = socialAccountCreateSchema.safeParse(formData);
    if (!parseRes.success) {
      setFormError(parseRes.error.issues[0]?.message || 'Invalid input');
      return;
    }

    setIsSubmitting(true);
    const res = await createAccount({
      platform: parseRes.data.platform as SocialPlatform,
      handle: parseRes.data.handle,
      display_name: parseRes.data.display_name,
      competitor_id: parseRes.data.competitor_id || null,
      follower_count: parseRes.data.follower_count,
    });
    setIsSubmitting(false);

    if (res) {
      setFormData({
        platform: 'x',
        handle: '',
        display_name: '',
        follower_count: 0,
      });
      setIsAddModalOpen(false);
    }
  };

  const getPlatformIcon = (platform: SocialPlatform) => {
    switch (platform) {
      case 'instagram':
        return <FaInstagram className="h-5 w-5 text-[var(--text-primary)]" />;
      case 'linkedin':
        return <FaLinkedin className="h-5 w-5 text-[var(--text-primary)]" />;
      case 'youtube':
        return <FaYoutube className="h-5 w-5 text-[var(--text-primary)]" />;
      case 'facebook':
        return <FaFacebook className="h-5 w-5 text-[var(--text-primary)]" />;
      case 'tiktok':
        return <FaTiktok className="h-5 w-5 text-[var(--text-primary)]" />;
      case 'x':
      default:
        return <FaXTwitter className="h-5 w-5 text-[var(--text-primary)]" />;
    }
  };

  const filteredAccounts = accounts.filter((acct) => {
    const matchesPlatform = platformFilter === 'all' || acct.platform === platformFilter;
    const matchesQuery =
      !searchQuery.trim() ||
      acct.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (acct.display_name && acct.display_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesPlatform && matchesQuery;
  });

  const totalFollowers = accounts.reduce((acc, a) => acc + (a.follower_count || 0), 0);
  const activeCount = accounts.filter((a) => a.is_active).length;

  return (
    <div className="flex-1 w-full overflow-y-auto p-6 md:p-10 pb-24 bg-[var(--bg-main-alt)] text-[var(--text-primary)] font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* ── HEADER BAR ── */}
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between border-b border-[var(--border-color)] pb-6">
          <div>
            <div className="flex items-center gap-3">
              <Share2 className="h-6 w-6 text-[var(--text-primary)]" />
              <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Social Media Intelligence</h1>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-1.5">
              Monitor competitor social profiles (X, Instagram, LinkedIn, YouTube, TikTok, Facebook) for automated signal scraping.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => collectAll()}
              disabled={isCollecting}
              className="flex items-center gap-2 rounded-lg bg-[var(--text-primary)] text-[var(--card-bg)] px-4 py-2.5 text-xs font-semibold hover:opacity-90 transition-all cursor-pointer shadow-sm disabled:opacity-50"
            >
              {isCollecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span>Collect Signals Now</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] px-4 py-2.5 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--item-hover)] transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Channel</span>
            </button>
          </div>
        </div>

        {/* ── FILTER & SEARCH TOOLBAR (FIRST!) ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-4 shadow-xs">
          <div className="flex items-center gap-2 overflow-x-auto">
            {(
              [
                { id: 'all', label: 'All Channels' },
                { id: 'x', label: 'X (Twitter)' },
                { id: 'instagram', label: 'Instagram' },
                { id: 'linkedin', label: 'LinkedIn' },
                { id: 'youtube', label: 'YouTube' },
                { id: 'tiktok', label: 'TikTok' },
                { id: 'facebook', label: 'Facebook' },
              ] as const
            ).map((filter) => (
              <button
                key={filter.id}
                onClick={() => setPlatformFilter(filter.id as any)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  platformFilter === filter.id
                    ? 'bg-[var(--text-primary)] text-[var(--card-bg)] shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-bg-alt)]'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder="Search profile handles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-main-alt)] pl-9 pr-3 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--text-secondary)]"
            />
          </div>
        </div>

        {/* ── COMPACT METRICS STRIP ── */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] px-5 py-3 text-xs">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-[var(--text-secondary)]" />
              <span className="text-[var(--text-secondary)]">Tracked Profiles:</span>
              <strong className="font-bold text-[var(--text-primary)]">{accounts.length}</strong>
              <span className="text-[11px] text-[var(--text-secondary)]">({activeCount} active)</span>
            </div>

            <div className="h-3 w-px bg-[var(--border-color)] hidden sm:block" />

            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[var(--text-secondary)]" />
              <span className="text-[var(--text-secondary)] font-medium">Combined Audience:</span>
              <strong className="font-bold text-[var(--text-primary)]">{totalFollowers.toLocaleString()}</strong>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[var(--text-secondary)]">Collector Engine:</span>
            <span className="inline-flex items-center gap-1.5 font-semibold px-2.5 py-0.5 rounded-full border border-[var(--border-color)] text-[var(--text-primary)] bg-[var(--card-bg-alt)] text-[11px]">
              <Zap className="h-3 w-3" />
              {isCollecting ? 'Scraping...' : 'Idle / Ready'}
            </span>
          </div>
        </div>

        {/* ── ALERTS BANNERS ── */}
        {collectStats && (
          <div className="flex items-center gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4 text-xs text-[var(--text-primary)]">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--text-primary)]" />
            <span>
              Collection completed! Processed accounts. New posts: <strong>{'posts_new' in collectStats ? collectStats.posts_new : 0}</strong>, Skipped: <strong>{'posts_skipped' in collectStats ? collectStats.posts_skipped : 0}</strong>.
            </span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4 text-xs text-[var(--text-primary)]">
            <AlertCircle className="h-4 w-4 shrink-0 text-[var(--text-secondary)]" />
            <span>{error}</span>
          </div>
        )}

        {/* ── PROFILE CARDS GRID ── */}
        <div>
          {isLoading && accounts.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-xs text-[var(--text-secondary)]">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span>Fetching tracked profiles...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Add Account Card Button */}
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="group border border-dashed border-[var(--border-color)] bg-[var(--card-bg)] hover:bg-[var(--card-bg-alt)] hover:border-[var(--text-primary)] transition-all rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-3 min-h-[200px] cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full border border-[var(--border-color)] bg-[var(--bg-main-alt)] group-hover:scale-105 transition-transform flex items-center justify-center">
                  <Plus className="h-6 w-6 text-[var(--text-primary)]" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-[var(--text-primary)]">Track New Channel</h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-[200px]">Add X, Instagram, LinkedIn, or YouTube profile.</p>
                </div>
              </button>

              {filteredAccounts.map((acct) => (
                <div
                  key={acct.id}
                  className="border border-[var(--border-color)] bg-[var(--card-bg)] rounded-2xl p-6 flex flex-col justify-between space-y-5 hover:border-[var(--text-secondary)] transition-all shadow-xs"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg-alt)] flex items-center justify-center shrink-0">
                          {getPlatformIcon(acct.platform)}
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-[var(--text-primary)]">@{acct.handle}</h3>
                          {acct.display_name && (
                            <p className="text-xs text-[var(--text-secondary)] truncate max-w-[150px]">
                              {acct.display_name}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => updateAccount(acct.id, { is_active: !acct.is_active })}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer border ${
                          acct.is_active
                            ? 'border-[var(--border-color)] text-[var(--text-primary)] bg-[var(--card-bg-alt)]'
                            : 'border-[var(--border-color)] text-[var(--text-secondary)] bg-[var(--bg-main-alt)]'
                        }`}
                      >
                        {acct.is_active ? 'Active' : 'Paused'}
                      </button>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-[var(--border-color)] bg-[var(--bg-main-alt)] p-3 text-xs">
                      <span className="text-[var(--text-secondary)] font-medium">Follower Count</span>
                      <span className="font-mono font-bold text-[var(--text-primary)]">
                        {acct.follower_count ? acct.follower_count.toLocaleString() : 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[var(--border-color)] text-xs">
                    <span className="text-[10px] text-[var(--text-secondary)] uppercase font-mono">
                      Platform: {acct.platform}
                    </span>

                    <button
                      onClick={() => deleteAccount(acct.id)}
                      className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Delete profile"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ── ADD ACCOUNT MODAL ── */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xl space-y-6"
            >
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
                <h3 className="text-base font-semibold text-[var(--text-primary)]">Track Social Profile</h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {formError && (
                <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-transparent p-3 text-xs text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[var(--text-secondary)] font-medium mb-1.5">Social Platform</label>
                  <select
                    value={formData.platform}
                    onChange={(e) => setFormData({ ...formData, platform: e.target.value as SocialPlatform })}
                    className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-main-alt)] px-3 py-2.5 text-xs text-[var(--text-primary)] outline-none"
                  >
                    <option value="x">X / Twitter</option>
                    <option value="instagram">Instagram</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="youtube">YouTube</option>
                    <option value="tiktok">TikTok</option>
                    <option value="facebook">Facebook</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] font-medium mb-1.5">Handle (e.g. teslamotors)</label>
                  <input
                    type="text"
                    value={formData.handle}
                    onChange={(e) => setFormData({ ...formData, handle: e.target.value })}
                    placeholder="teslamotors"
                    className="w-full font-mono rounded-lg border border-[var(--border-color)] bg-[var(--bg-main-alt)] px-3.5 py-2.5 text-xs text-[var(--text-primary)] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] font-medium mb-1.5">Display Name (Optional)</label>
                  <input
                    type="text"
                    value={formData.display_name}
                    onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                    placeholder="Tesla Motors"
                    className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-main-alt)] px-3.5 py-2.5 text-xs text-[var(--text-primary)] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] font-medium mb-1.5">Follower Count (Optional)</label>
                  <input
                    type="number"
                    value={formData.follower_count}
                    onChange={(e) => setFormData({ ...formData, follower_count: Number(e.target.value) })}
                    placeholder="0"
                    className="w-full font-mono rounded-lg border border-[var(--border-color)] bg-[var(--bg-main-alt)] px-3.5 py-2.5 text-xs text-[var(--text-primary)] outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-lg bg-[var(--text-primary)] text-[var(--card-bg)] text-xs font-semibold hover:opacity-90 disabled:opacity-40 transition-all cursor-pointer"
                  >
                    {isSubmitting ? 'Saving...' : 'Add Channel'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

