// oshift/src/components/video/SocialAccountsTab.tsx
'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useSocialAccounts } from '@/hooks/use-social-accounts';
import { useMounted } from '@/hooks/use-mounted';
import { socialAccountCreateSchema } from '@/types/schemas';
import ChannelUrlInput from './ChannelUrlInput';
import {
  Plus,
  Trash2,
  CheckCircle2,
  Loader2,
  X,
  AlertCircle,
  Search,
  Radio,
} from 'lucide-react';


import {
  FaInstagram,
  FaLinkedin,
  FaYoutube,
  FaFacebook,
  FaXTwitter,
  FaTiktok,
} from 'react-icons/fa6';
import { SocialPlatform, SocialAccount } from '@/types/entities';
import { motion, AnimatePresence } from 'framer-motion';

interface SocialAccountsTabProps {
  onAddSuccess?: () => void;
  onSelectAccount?: (account: SocialAccount) => void;
}

export default function SocialAccountsTab({
  onAddSuccess,
  onSelectAccount,
}: SocialAccountsTabProps) {
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
    platform: 'instagram' as SocialPlatform,
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
        platform: 'instagram',
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
        return <FaInstagram className="h-4 w-4 text-pink-500" />;
      case 'linkedin':
        return <FaLinkedin className="h-4 w-4 text-sky-400" />;
      case 'youtube':
        return <FaYoutube className="h-4 w-4 text-red-500" />;
      case 'facebook':
        return <FaFacebook className="h-4 w-4 text-blue-500" />;
      case 'tiktok':
        return <FaTiktok className="h-4 w-4 text-cyan-400" />;
      case 'x':
      default:
        return <FaXTwitter className="h-4 w-4 text-[var(--text-primary)]" />;
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

  return (
    <div className="space-y-6">
      {/* ── TOP HERO CHANNEL URL INPUT (CLEAN PINTEREST-STYLE) ── */}
      <ChannelUrlInput
        onAddAccount={async (payload) => {
          const res = await createAccount(payload);
          if (res) onAddSuccess?.();
          return res;
        }}
        isCollecting={isCollecting}
        onCollectAll={async () => collectAll(25)}
      />

      {/* Ingestion Response Banner */}
      {collectStats && (
        <div className="p-3.5 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] flex items-center gap-3 text-xs text-emerald-400 animate-in fade-in duration-150">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>
            Scrape completed! Ingested {collectStats.posts_new} new posts and creative signals.
          </span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-2xl border border-rose-500/20 bg-rose-500/10 flex items-center gap-3 text-xs text-rose-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── FILTER & SEARCH TOOLBAR ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'tiktok', label: 'TikTok' },
              { id: 'instagram', label: 'Reels' },
              { id: 'youtube', label: 'YouTube' },
              { id: 'x', label: 'X' },
              { id: 'linkedin', label: 'LinkedIn' },
            ] as const
          ).map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setPlatformFilter(filter.id as 'all' | SocialPlatform)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                platformFilter === filter.id
                  ? 'bg-[var(--text-primary)] text-[var(--card-bg)]'
                  : 'bg-[var(--pill-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder="Filter channels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-[var(--border-color)] bg-[var(--card-bg-alt)] pl-8 pr-3 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--border-color)] transition-colors"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="p-2 rounded-full border border-[var(--border-color)] bg-[var(--card-bg)] hover:bg-[var(--item-hover)] text-[var(--text-primary)] transition-all cursor-pointer shrink-0"
            title="Add handle manually"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── CHANNELS GRID (CLICK TO LAUNCH CINEMATIC HORIZONTAL DECK) ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-36 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4 animate-pulse flex flex-col justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--pill-bg)]" />
                <div className="space-y-2">
                  <div className="w-28 h-4 rounded bg-[var(--pill-bg)]" />
                  <div className="w-16 h-3 rounded bg-[var(--pill-bg)]" />
                </div>
              </div>
              <div className="w-full h-6 rounded bg-[var(--pill-bg)]" />
            </div>
          ))}
        </div>
      ) : filteredAccounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-xs space-y-2">
          <p className="text-sm font-bold text-[var(--text-primary)]">
            {searchQuery || platformFilter !== 'all'
              ? 'No matching channels found'
              : 'No channels tracked yet'}
          </p>
          <p className="text-xs text-[var(--text-secondary)]">
            Paste a link above to track your first competitor channel.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredAccounts.map((account, idx) => (
            <motion.div
              key={account.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: Math.min(idx * 0.04, 0.3) }}
              whileHover={{ y: -3, transition: { duration: 0.15 } }}
              onClick={() => onSelectAccount?.(account)}
              className="group relative rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4 flex flex-col items-center gap-2.5 text-center cursor-pointer hover:border-white/20 hover:shadow-xl transition-all duration-200"
            >
              {/* Platform icon */}
              <div className="w-12 h-12 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg-alt)] flex items-center justify-center shrink-0">
                {getPlatformIcon(account.platform)}
              </div>

              {/* Name */}
              <div className="min-w-0 w-full">
                <h4 className="font-bold text-xs text-[var(--text-primary)] truncate">
                  {account.display_name || account.handle}
                </h4>
                <p className="text-[10px] text-[var(--text-secondary)] font-mono truncate">
                  @{account.handle.replace(/^@/, '')}
                </p>
              </div>

              {/* Active pulse */}
              {account.is_active && (
                <span className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              )}

              {/* Delete button on hover */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteAccount(account.id);
                }}
                className="absolute bottom-2 right-2 p-1 rounded-lg text-transparent group-hover:text-[var(--text-secondary)] hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                title="Remove Channel"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </motion.div>
          ))}
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
                      <div className="w-8 h-8 rounded-lg bg-[var(--card-bg-alt)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-primary)]">
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

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">
                        Platform
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['instagram', 'tiktok', 'youtube', 'x', 'linkedin', 'facebook'] as SocialPlatform[]).map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setFormData({ ...formData, platform: p })}
                            className={`flex items-center justify-center gap-2 py-2 rounded-xl border text-xs font-bold capitalize transition-all cursor-pointer ${
                              formData.platform === p
                                ? 'border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--card-bg)]'
                                : 'border-[var(--border-color)] bg-[var(--card-bg-alt)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                          >
                            {getPlatformIcon(p)}
                            <span>{p}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">
                        Profile Handle
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. nike or @nike"
                        value={formData.handle}
                        onChange={(e) => setFormData({ ...formData, handle: e.target.value })}
                        required
                        className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--card-bg-alt)] px-3.5 py-2.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--border-color)]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">
                        Display Name (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Nike Official"
                        value={formData.display_name}
                        onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                        className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--card-bg-alt)] px-3.5 py-2.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--border-color)]"
                      />
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-3 border-t border-[var(--border-color)]">
                      <button
                        type="button"
                        onClick={() => setIsAddModalOpen(false)}
                        className="px-4 py-2 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center gap-2 rounded-xl bg-[var(--text-primary)] text-[var(--card-bg)] hover:opacity-90 px-5 py-2 text-xs font-bold transition-all cursor-pointer shadow-sm disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Plus className="h-3.5 w-3.5" />
                        )}
                        <span>Track Profile</span>
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
