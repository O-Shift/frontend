// oshift/src/components/video/SocialAccountsTab.tsx
'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useSocialAccounts } from '@/hooks/use-social-accounts';
import { useMounted } from '@/hooks/use-mounted';
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
  Radio,
  ExternalLink,
} from 'lucide-react';
import {
  FaInstagram,
  FaLinkedin,
  FaYoutube,
  FaFacebook,
  FaXTwitter,
  FaTiktok,
} from 'react-icons/fa6';
import { SocialPlatform } from '@/types/entities';
import { motion, AnimatePresence } from 'framer-motion';

interface SocialAccountsTabProps {
  onAddSuccess?: () => void;
}

export default function SocialAccountsTab({ onAddSuccess }: SocialAccountsTabProps) {
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
  } = useSocialAccounts();

  const [platformFilter, setPlatformFilter] = useState<'all' | SocialPlatform>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const mounted = useMounted();

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
      onAddSuccess?.();
    }
  };

  const getPlatformIcon = (platform: SocialPlatform) => {
    switch (platform) {
      case 'instagram':
        return <FaInstagram className="h-5 w-5 text-pink-500" />;
      case 'linkedin':
        return <FaLinkedin className="h-5 w-5 text-sky-500" />;
      case 'youtube':
        return <FaYoutube className="h-5 w-5 text-red-500" />;
      case 'facebook':
        return <FaFacebook className="h-5 w-5 text-blue-500" />;
      case 'tiktok':
        return <FaTiktok className="h-5 w-5 text-[var(--text-primary)]" />;
      case 'x':
      default:
        return <FaXTwitter className="h-5 w-5 text-[var(--text-primary)]" />;
    }
  };

  const getPlatformProfileUrl = (platform: SocialPlatform, handle: string) => {
    const cleanHandle = handle.replace(/^@/, '');
    switch (platform) {
      case 'instagram':
        return `https://instagram.com/${cleanHandle}`;
      case 'linkedin':
        return `https://linkedin.com/company/${cleanHandle}`;
      case 'youtube':
        return `https://youtube.com/@${cleanHandle}`;
      case 'facebook':
        return `https://facebook.com/${cleanHandle}`;
      case 'tiktok':
        return `https://tiktok.com/@${cleanHandle}`;
      case 'x':
      default:
        return `https://x.com/${cleanHandle}`;
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
    <div className="space-y-8">
      {/* ── HEADER BANNER & STATS ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)]/80 backdrop-blur-md shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--accent)] uppercase tracking-wider">
            <Share2 className="h-3.5 w-3.5" />
            <span>Automated Channel Sources</span>
          </div>
          <h2 className="text-xl font-black text-[var(--text-primary)] tracking-tight">
            Monitored Social Profiles & Crawlers
          </h2>
          <p className="text-xs text-[var(--text-secondary)] max-w-xl">
            Manage competitor social handles across X, TikTok, Instagram, YouTube, and LinkedIn for continuous video discovery and creative scraping.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => collectAll()}
            disabled={isCollecting}
            className="flex items-center gap-2 rounded-xl bg-[var(--text-primary)] text-[var(--card-bg)] px-4 py-2.5 text-xs font-bold hover:opacity-90 transition-all cursor-pointer shadow-sm disabled:opacity-50"
          >
            {isCollecting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            <span>{isCollecting ? 'Ingesting Signals...' : 'Collect Signals Now'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] px-4 py-2.5 text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--item-hover)] hover:border-[var(--accent)] transition-all cursor-pointer shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Track New Profile</span>
          </button>
        </div>
      </div>

      {/* ── KPI METRICS CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Monitored Channels</p>
            <h3 className="text-2xl font-black text-[var(--text-primary)] mt-1">{accounts.length}</h3>
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">Profiles across 6 platforms</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-[var(--card-bg-alt)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-primary)]">
            <Share2 className="h-5 w-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Active Crawlers</p>
            <h3 className="text-2xl font-black text-emerald-400 mt-1">{activeCount}</h3>
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">Automated scraper sync enabled</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Zap className="h-5 w-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Total Audience Reach</p>
            <h3 className="text-2xl font-black text-[var(--text-primary)] mt-1">
              {totalFollowers > 1_000_000
                ? (totalFollowers / 1_000_000).toFixed(1) + 'M'
                : totalFollowers > 1_000
                ? (totalFollowers / 1_000).toFixed(1) + 'K'
                : totalFollowers.toLocaleString()}
            </h3>
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">Combined competitor followers</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-[var(--card-bg-alt)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-primary)]">
            <Users className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Ingestion Response Banner */}
      {collectStats && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center gap-3 text-xs text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>
            Scrape completed successfully! Ingested {collectStats.posts_new} new posts and creative signals
            {'accounts_processed' in collectStats ? ` across ${collectStats.accounts_processed} accounts` : ''}.
          </span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 flex items-center gap-3 text-xs text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── FILTER & SEARCH TOOLBAR ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-4 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(
            [
              { id: 'all', label: 'All Channels' },
              { id: 'tiktok', label: 'TikTok' },
              { id: 'instagram', label: 'Instagram' },
              { id: 'youtube', label: 'YouTube' },
              { id: 'x', label: 'X / Twitter' },
              { id: 'linkedin', label: 'LinkedIn' },
              { id: 'facebook', label: 'Facebook' },
            ] as const
          ).map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setPlatformFilter(filter.id as 'all' | SocialPlatform)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
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
            className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-main-alt)] pl-9 pr-3.5 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-colors"
          />
        </div>
      </div>

      {/* ── CHANNELS GRID ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-44 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-5 animate-pulse flex flex-col justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--pill-bg)]" />
                <div className="space-y-2">
                  <div className="w-32 h-4 rounded bg-[var(--pill-bg)]" />
                  <div className="w-20 h-3 rounded bg-[var(--pill-bg)]" />
                </div>
              </div>
              <div className="w-full h-8 rounded bg-[var(--pill-bg)]" />
            </div>
          ))}
        </div>
      ) : filteredAccounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 text-center rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-xs space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center text-[var(--accent)]">
            <Share2 className="h-7 w-7" />
          </div>
          <div className="max-w-md space-y-1.5">
            <h3 className="text-lg font-bold text-[var(--text-primary)]">
              {searchQuery || platformFilter !== 'all'
                ? 'No matching social channels found'
                : 'No Social Channels Tracked Yet'}
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              {searchQuery || platformFilter !== 'all'
                ? 'Try resetting the filters or searching with a different handle.'
                : 'Track competitor TikTok, Instagram, YouTube, X, and LinkedIn profiles to automatically crawl video assets and creative hooks.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-[var(--text-primary)] text-[var(--card-bg)] px-5 py-2.5 text-xs font-bold hover:opacity-90 transition-all cursor-pointer shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Track First Profile</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAccounts.map((account) => {
            const profileUrl = getPlatformProfileUrl(account.platform, account.handle);

            return (
              <div
                key={account.id}
                className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-5 flex flex-col justify-between space-y-4 hover:border-[var(--text-secondary)] transition-all shadow-xs group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg-alt)] flex items-center justify-center shrink-0 shadow-2xs">
                      {getPlatformIcon(account.platform)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-[var(--text-primary)] truncate">
                        {account.display_name || account.handle}
                      </h4>
                      <a
                        href={profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--accent)] inline-flex items-center gap-1 transition-colors"
                      >
                        <span>@{account.handle.replace(/^@/, '')}</span>
                        <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                      </a>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => updateAccount(account.id, { is_active: !account.is_active })}
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                      account.is_active
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                        : 'border-[var(--border-color)] text-[var(--text-secondary)]'
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${account.is_active ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-500'}`} />
                    <span>{account.is_active ? 'Active' : 'Paused'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs py-2 px-3 rounded-xl bg-[var(--bg-main-alt)] border border-[var(--border-color)]">
                  <span className="text-[var(--text-secondary)] font-medium">Audience Reach:</span>
                  <span className="font-bold font-mono text-[var(--text-primary)]">
                    {account.follower_count
                      ? account.follower_count > 1_000_000
                        ? (account.follower_count / 1_000_000).toFixed(1) + 'M'
                        : account.follower_count > 1_000
                        ? (account.follower_count / 1_000).toFixed(1) + 'K'
                        : account.follower_count.toLocaleString()
                      : '0'}{' '}
                    followers
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[var(--border-color)] text-xs">
                  <button
                    type="button"
                    onClick={() => collectAll(25)}
                    disabled={isCollecting}
                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-semibold transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3 w-3 ${isCollecting ? 'animate-spin' : ''}`} />
                    <span>Sync Crawl</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteAccount(account.id)}
                    className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                    title="Remove Channel"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── ADD ACCOUNT MODAL (PORTALED TO BODY) ── */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {isAddModalOpen && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full max-w-md bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xl space-y-6"
                >
                  <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/15 flex items-center justify-center text-[var(--accent)]">
                        <Radio className="h-4 w-4" />
                      </div>
                      <h3 className="text-base font-bold text-[var(--text-primary)]">Track Social Profile</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
                      className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {formError && (
                    <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                    <div>
                      <label className="block text-[var(--text-secondary)] font-semibold mb-1.5">Platform</label>
                      <select
                        value={formData.platform}
                        onChange={(e) => setFormData({ ...formData, platform: e.target.value as SocialPlatform })}
                        className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-main-alt)] px-3.5 py-2.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)] font-medium"
                      >
                        <option value="tiktok">TikTok</option>
                        <option value="instagram">Instagram</option>
                        <option value="youtube">YouTube</option>
                        <option value="x">X / Twitter</option>
                        <option value="linkedin">LinkedIn</option>
                        <option value="facebook">Facebook</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[var(--text-secondary)] font-semibold mb-1.5">Handle (e.g. teslamotors)</label>
                      <input
                        type="text"
                        value={formData.handle}
                        onChange={(e) => setFormData({ ...formData, handle: e.target.value })}
                        placeholder="teslamotors"
                        className="w-full font-mono rounded-xl border border-[var(--border-color)] bg-[var(--bg-main-alt)] px-3.5 py-2.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                      />
                    </div>

                    <div>
                      <label className="block text-[var(--text-secondary)] font-semibold mb-1.5">Display Name (Optional)</label>
                      <input
                        type="text"
                        value={formData.display_name}
                        onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                        placeholder="Tesla Motors"
                        className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-main-alt)] px-3.5 py-2.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                      />
                    </div>

                    <div>
                      <label className="block text-[var(--text-secondary)] font-semibold mb-1.5">Follower Count (Optional)</label>
                      <input
                        type="number"
                        value={formData.follower_count}
                        onChange={(e) => setFormData({ ...formData, follower_count: Number(e.target.value) })}
                        placeholder="0"
                        className="w-full font-mono rounded-xl border border-[var(--border-color)] bg-[var(--bg-main-alt)] px-3.5 py-2.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
                      <button
                        type="button"
                        onClick={() => setIsAddModalOpen(false)}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting || !formData.handle.trim()}
                        className="px-4 py-2 rounded-xl bg-[var(--text-primary)] text-[var(--card-bg)] text-xs font-bold hover:opacity-90 disabled:opacity-40 transition-all cursor-pointer"
                      >
                        {isSubmitting ? 'Saving...' : 'Track Channel'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
