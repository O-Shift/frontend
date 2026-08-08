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
} from 'lucide-react';
import { FaInstagram, FaLinkedin, FaYoutube, FaFacebook, FaXTwitter, FaTiktok } from 'react-icons/fa6';
import { SocialPlatform } from '@/types/entities';

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
        return <FaInstagram className="h-5 w-5 text-[var(--text-secondary)]" />;
      case 'linkedin':
        return <FaLinkedin className="h-5 w-5 text-[var(--text-secondary)]" />;
      case 'youtube':
        return <FaYoutube className="h-5 w-5 text-[var(--text-secondary)]" />;
      case 'facebook':
        return <FaFacebook className="h-5 w-5 text-[var(--text-secondary)]" />;
      case 'tiktok':
        return <FaTiktok className="h-5 w-5 text-[var(--text-secondary)]" />;
      case 'x':
      default:
        return <FaXTwitter className="h-5 w-5 text-[var(--text-secondary)]" />;
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto font-sans text-[var(--text-primary)]">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] p-6">
        <div>
          <div className="flex items-center gap-2">
            <Share2 className="h-6 w-6 text-[var(--text-primary)]" />
            <h1 className="text-xl font-bold">Social Media Accounts</h1>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Track social channels (X, Instagram, LinkedIn, YouTube, TikTok, Facebook) for automatic signal collection.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => collectAll()}
            disabled={isCollecting}
            className="flex items-center gap-2 h-8 px-3 bg-[var(--card-bg)] border border-[var(--border-color)] hover:bg-[var(--item-hover)] shadow-sm rounded-md transition-all text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-semibold cursor-pointer disabled:opacity-50"
          >
            {isCollecting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            <span>Collect All Social Posts</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 h-8 px-3 bg-[var(--card-bg)] border border-[var(--border-color)] hover:bg-[var(--item-hover)] shadow-sm rounded-md transition-all text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-semibold cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Account
          </button>
        </div>
      </div>

      {/* Collection Stats Toast / Alert */}
      {collectStats && (
        <div className="flex items-center justify-between rounded-md border border-emerald-500/30 bg-transparent p-4 text-xs text-emerald-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>
              Collection completed! Processed accounts. New posts: <strong>{'posts_new' in collectStats ? collectStats.posts_new : 0}</strong>, Skipped: <strong>{'posts_skipped' in collectStats ? collectStats.posts_skipped : 0}</strong>.
            </span>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-2 rounded-md border border-red-500/30 bg-transparent p-4 text-xs text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid of Accounts */}
      <div className="rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Tracked Social Profiles ({accounts.length})</h2>
          <button
            onClick={() => refreshAccounts()}
            className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
          >
            Refresh List
          </button>
        </div>

        {isLoading && accounts.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-xs text-[var(--text-secondary)]">
            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading accounts...
          </div>
        ) : accounts.length === 0 ? (
          <div className="py-16 text-center text-xs text-[var(--text-secondary)]">
            No social accounts configured yet. Click "Add Account" to track competitors' social handles.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((acct) => (
              <div
                key={acct.id}
                className="flex flex-col justify-between rounded-lg border border-[var(--border-color)] bg-[var(--bg-body)] p-4 text-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {getPlatformIcon(acct.platform)}
                    <div>
                      <span className="font-bold text-sm block">@{acct.handle}</span>
                      {acct.display_name && (
                        <span className="text-[11px] text-[var(--text-secondary)]">
                          {acct.display_name}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => updateAccount(acct.id, { is_active: !acct.is_active })}
                    className={`h-7 px-2.5 text-[10px] font-semibold rounded-md border transition-all bg-[var(--card-bg)] hover:bg-[var(--item-hover)] shadow-sm cursor-pointer ${
                      acct.is_active
                        ? 'border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {acct.is_active ? 'Active' : 'Paused'}
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)] pt-2 border-t border-[var(--border-color)]">
                  <div className="flex items-center gap-1 font-mono">
                    <Users className="h-3.5 w-3.5" />
                    <span>{acct.follower_count?.toLocaleString() ?? 0} followers</span>
                  </div>

                  <button
                    onClick={() => deleteAccount(acct.id)}
                    className="w-7 h-7 flex items-center justify-center bg-[var(--card-bg)] border border-[var(--border-color)] hover:bg-[var(--item-hover)] shadow-sm rounded-md transition-all text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                    title="Remove Account"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Account Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Add Social Media Account</h3>
              <button onClick={() => setIsAddModalOpen(false)}>
                <X className="h-4 w-4 text-[var(--text-secondary)]" />
              </button>
            </div>

            {formError && (
              <div className="flex items-center gap-2 rounded-md border border-red-500/30 bg-transparent p-3 text-xs text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[var(--text-secondary)] mb-1">Platform</label>
                <select
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value as SocialPlatform })}
                  className="w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-body)] px-3 py-2 text-[var(--text-primary)] outline-none focus:border-[var(--text-primary)]"
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
                <label className="block text-[var(--text-secondary)] mb-1">Handle (e.g. teslamotors)</label>
                <input
                  type="text"
                  value={formData.handle}
                  onChange={(e) => setFormData({ ...formData, handle: e.target.value })}
                  placeholder="teslamotors"
                  className="w-full font-mono rounded-md border border-[var(--border-color)] bg-[var(--bg-body)] px-3 py-2 text-[var(--text-primary)] outline-none focus:border-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] mb-1">Display Name (optional)</label>
                <input
                  type="text"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  placeholder="Tesla, Inc."
                  className="w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-body)] px-3 py-2 text-[var(--text-primary)] outline-none focus:border-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] mb-1">Follower Count (optional)</label>
                <input
                  type="number"
                  value={formData.follower_count}
                  onChange={(e) => setFormData({ ...formData, follower_count: Number(e.target.value) })}
                  placeholder="0"
                  className="w-full font-mono rounded-md border border-[var(--border-color)] bg-[var(--bg-body)] px-3 py-2 text-[var(--text-primary)] outline-none focus:border-[var(--text-primary)]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 h-8 flex items-center justify-center bg-[var(--card-bg)] border border-[var(--border-color)] hover:bg-[var(--item-hover)] shadow-sm rounded-md transition-all text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 h-8 flex items-center justify-center bg-[var(--text-primary)] text-[var(--card-bg)] border border-transparent hover:bg-[var(--text-secondary)] shadow-sm rounded-md transition-all text-sm font-semibold cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Add Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
