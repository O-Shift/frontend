// oshift/src/components/video/ChannelUrlInput.tsx
'use client';

import React, { useState } from 'react';
import {
  Link as LinkIcon,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  ArrowRight,
} from 'lucide-react';
import type { SocialPlatform, SocialAccountCreate } from '@/types/entities';

interface ChannelUrlInputProps {
  onAddAccount: (payload: SocialAccountCreate) => Promise<any>;
  isCollecting?: boolean;
  onCollectAll?: () => Promise<any>;
}

function parseChannelInput(input: string): {
  platform: SocialPlatform;
  handle: string;
  displayName?: string;
} {
  const clean = input.trim();

  // 1. TikTok
  if (clean.includes('tiktok.com')) {
    const match = clean.match(/@([a-zA-Z0-9_.-]+)/);
    if (match) return { platform: 'tiktok', handle: match[1] };
    const parts = clean.split('/').filter(Boolean);
    const last = parts[parts.length - 1]?.replace(/^@/, '');
    return { platform: 'tiktok', handle: last || 'creator' };
  }

  // 2. Instagram
  if (clean.includes('instagram.com')) {
    const parts = clean.split('?')[0].split('/').filter(Boolean);
    const last = parts[parts.length - 1];
    return { platform: 'instagram', handle: last || 'brand' };
  }

  // 3. YouTube
  if (clean.includes('youtube.com')) {
    const match = clean.match(/@([a-zA-Z0-9_.-]+)/);
    if (match) return { platform: 'youtube', handle: match[1] };
    const parts = clean.split('?')[0].split('/').filter(Boolean);
    const last = parts[parts.length - 1];
    return { platform: 'youtube', handle: last || 'channel' };
  }

  // 4. X / Twitter
  if (clean.includes('x.com') || clean.includes('twitter.com')) {
    const parts = clean.split('?')[0].split('/').filter(Boolean);
    const last = parts[parts.length - 1];
    return { platform: 'x', handle: last || 'account' };
  }

  // 5. LinkedIn
  if (clean.includes('linkedin.com')) {
    const parts = clean.split('?')[0].split('/').filter(Boolean);
    const last = parts[parts.length - 1];
    return { platform: 'linkedin', handle: last || 'company' };
  }

  // 6. Facebook
  if (clean.includes('facebook.com')) {
    const parts = clean.split('?')[0].split('/').filter(Boolean);
    const last = parts[parts.length - 1];
    return { platform: 'facebook', handle: last || 'page' };
  }

  // 7. Bare handle
  const bareHandle = clean.replace(/^@/, '');
  return { platform: 'instagram', handle: bareHandle };
}

export default function ChannelUrlInput({
  onAddAccount,
}: ChannelUrlInputProps) {
  const [channelInput, setChannelInput] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform>('instagram');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setChannelInput(val);
    setErrorMsg(null);
    setSuccessMsg(null);

    // Auto-detect platform
    if (val.includes('tiktok.com')) setSelectedPlatform('tiktok');
    else if (val.includes('instagram.com')) setSelectedPlatform('instagram');
    else if (val.includes('youtube.com')) setSelectedPlatform('youtube');
    else if (val.includes('x.com') || val.includes('twitter.com')) setSelectedPlatform('x');
    else if (val.includes('linkedin.com')) setSelectedPlatform('linkedin');
    else if (val.includes('facebook.com')) setSelectedPlatform('facebook');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!channelInput.trim()) {
      setErrorMsg('Please paste a channel link or social handle.');
      return;
    }

    const { platform, handle } = parseChannelInput(channelInput);
    const platformToUse = channelInput.includes('http') ? platform : selectedPlatform;

    if (!handle) {
      setErrorMsg('Could not extract handle from URL.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onAddAccount({
        platform: platformToUse,
        handle: handle.replace(/^@/, ''),
        display_name: handle,
      });

      if (res) {
        setSuccessMsg(`Tracked @${handle} on ${platformToUse.toUpperCase()}`);
        setChannelInput('');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to track channel.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full rounded-3xl bg-[var(--card-bg-alt)] border border-[var(--border-color)] p-4 sm:p-6 shadow-sm flex flex-col gap-3">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Optional Platform Selector for bare handles */}
          {!channelInput.includes('http') && (
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value as SocialPlatform)}
              className="w-full sm:w-auto px-3.5 py-3.5 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] text-xs font-bold text-[var(--text-primary)] focus:outline-none cursor-pointer"
            >
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
              <option value="youtube">YouTube</option>
              <option value="x">X / Twitter</option>
              <option value="linkedin">LinkedIn</option>
              <option value="facebook">Facebook</option>
            </select>
          )}

          {/* Main Channel URL Input Field */}
          <div className="relative flex-1 w-full">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[var(--text-secondary)]">
              <LinkIcon className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={channelInput}
              onChange={handleInputChange}
              placeholder="Paste channel profile link (TikTok, Instagram, YouTube, X, LinkedIn)..."
              disabled={isSubmitting}
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] text-xs sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--border-color)] transition-all shadow-inner"
            />
            {channelInput && (
              <button
                type="button"
                onClick={() => setChannelInput('')}
                className="absolute inset-y-0 right-3.5 flex items-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Action Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !channelInput.trim()}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[var(--text-primary)] text-[var(--card-bg)] hover:opacity-90 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0 cursor-pointer shadow-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Tracking...</span>
              </>
            ) : (
              <>
                <span>Track Channel</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Error Feedback */}
        {errorMsg && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success Feedback */}
        {successMsg && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
      </form>
    </div>
  );
}
