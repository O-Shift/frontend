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
        return <FaInstagram className="h-5 w-5 text-pink-500" />;
      case 'linkedin':
        return <FaLinkedin className="h-5 w-5 text-blue-500" />;
      case 'youtube':
        return <FaYoutube className="h-5 w-5 text-red-500" />;
      case 'facebook':
        return <FaFacebook className="h-5 w-5 text-blue-600" />;
      case 'tiktok':
        return <FaTiktok className="h-5 w-5 text-purple-400" />;
      case 'x':
      default:
        return <FaXTwitter className="h-5 w-5 text-[var(--accent)]" />;
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto font-sans text-[var(--text-primary)]">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Share2 className="h-6 w-6 text-[var(--accent)]" />
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
            className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white shadow transition hover:opacity-90 disabled:opacity-50"
          >
            {isCollecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            <span>Collect All Social Posts</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-main)] px-3.5 py-2 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent)] transition"
          >
            <Plus className="h-4 w-4 text-[var(--accent)]" /> Add Account
          </button>
        </div>
      </div>

      {/* Collection Stats Toast / Alert */}
      {collectStats && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-400">
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
        <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid of Accounts */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-sm space-y-4">
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
                className="flex flex-col justify-between rounded-xl border border-[var(--border)] bg-[var(--bg-main)] p-4 text-xs space-y-3"
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
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold transition ${
                      acct.is_active
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                    }`}
                  >
                    {acct.is_active ? 'Active' : 'Paused'}
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)] pt-2 border-t border-[var(--border)]">
                  <div className="flex items-center gap-1 font-mono">
                    <Users className="h-3.5 w-3.5" />
                    <span>{acct.follower_count?.toLocaleString() ?? 0} followers</span>
                  </div>

                  <button
                    onClick={() => deleteAccount(acct.id)}
                    className="text-red-400 hover:text-red-300 p-1 transition"
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
          <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Add Social Media Account</h3>
              <button onClick={() => setIsAddModalOpen(false)}>
                <X className="h-4 w-4 text-[var(--text-secondary)]" />
              </button>
            </div>

            {formError && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
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
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-main)] px-3 py-2 text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
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
                  className="w-full font-mono rounded-xl border border-[var(--border)] bg-[var(--bg-main)] px-3 py-2 text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] mb-1">Display Name (optional)</label>
                <input
                  type="text"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  placeholder="Tesla, Inc."
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-main)] px-3 py-2 text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] mb-1">Follower Count (optional)</label>
                <input
                  type="number"
                  value={formData.follower_count}
                  onChange={(e) => setFormData({ ...formData, follower_count: Number(e.target.value) })}
                  placeholder="0"
                  className="w-full font-mono rounded-xl border border-[var(--border)] bg-[var(--bg-main)] px-3 py-2 text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 rounded-xl border border-[var(--border)] py-2 text-[var(--text-secondary)] font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded-xl bg-[var(--accent)] py-2 font-semibold text-white shadow disabled:opacity-50"
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
