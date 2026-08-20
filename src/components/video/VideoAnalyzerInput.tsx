// oshift/src/components/video/VideoAnalyzerInput.tsx
'use client';

import React, { useState } from 'react';
import {
  Link as LinkIcon,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Key,
  ChevronDown,
  History,
  RotateCcw,
  Film,
  X,
  ArrowRight,
} from 'lucide-react';
import type { AnalysisStage } from '@/hooks/use-videos';
import type { VideoAsset } from '@/types/entities';

interface VideoAnalyzerInputProps {
  isAnalyzing: boolean;
  analysisStage: AnalysisStage;
  analysisProgress: string;
  error?: string | null;
  onAnalyze: (
    videoUrl: string,
    competitorId?: string,
    apiKey?: string,
    forceRefresh?: boolean
  ) => Promise<any>;
  checkExistingVideo?: (videoUrl: string) => Promise<VideoAsset | null>;
  onSelectExistingAsset?: (asset: VideoAsset) => void;
}

export default function VideoAnalyzerInput({
  isAnalyzing = false,
  analysisStage = 'idle',
  analysisProgress = '',
  error,
  onAnalyze,
  checkExistingVideo,
  onSelectExistingAsset,
}: VideoAnalyzerInputProps) {
  const [videoUrl, setVideoUrl] = useState('');
  const [customApiKey, setCustomApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [validationMsg, setValidationMsg] = useState<string | null>(null);
  const [existingAsset, setExistingAsset] = useState<VideoAsset | null>(null);
  const [isCheckingExisting, setIsCheckingExisting] = useState(false);

  React.useEffect(() => {
    if (
      error &&
      (error.toLowerCase().includes('google ai') ||
        error.toLowerCase().includes('api key') ||
        error.toLowerCase().includes('key'))
    ) {
      setShowApiKeyInput(true);
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationMsg(null);
    setExistingAsset(null);

    const cleanUrl = videoUrl.trim();
    if (!cleanUrl) {
      setValidationMsg('Please enter a video URL (TikTok, Instagram Reel, or YouTube).');
      return;
    }

    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      setValidationMsg('Video URL must start with http:// or https://');
      return;
    }

    if (checkExistingVideo) {
      setIsCheckingExisting(true);
      try {
        const found = await checkExistingVideo(cleanUrl);
        if (found && found.analysis) {
          setExistingAsset(found);
          setIsCheckingExisting(false);
          return;
        }
      } catch (_) {
        // Continue to fresh analysis
      } finally {
        setIsCheckingExisting(false);
      }
    }

    await executeAnalysis(cleanUrl, false);
  };

  const executeAnalysis = async (urlToAnalyze: string, forceRefresh: boolean) => {
    const keyToUse = customApiKey.trim() || undefined;
    const res = await onAnalyze(
      urlToAnalyze,
      undefined,
      keyToUse,
      forceRefresh
    );

    if (res) {
      setVideoUrl('');
      setExistingAsset(null);
    }
  };

  const handleViewExisting = () => {
    if (existingAsset && onSelectExistingAsset) {
      onSelectExistingAsset(existingAsset);
      setExistingAsset(null);
      setVideoUrl('');
    }
  };

  const handleForceReanalyze = () => {
    const url = existingAsset?.url || videoUrl.trim();
    setExistingAsset(null);
    if (url) {
      executeAnalysis(url, true);
    }
  };

  return (
    <div className="w-full rounded-3xl bg-[var(--card-bg-alt)] border border-[var(--border-color)] p-4 sm:p-6 shadow-sm flex flex-col gap-3">
      {/* Clean Single Form Row */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Main URL Input Field */}
          <div className="relative flex-1 w-full">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[var(--text-secondary)]">
              <LinkIcon className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="Paste video URL (TikTok, Instagram Reel, or YouTube)..."
              disabled={isAnalyzing}
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] text-xs sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--border-color)] transition-all shadow-inner"
            />
            {videoUrl && (
              <button
                type="button"
                onClick={() => setVideoUrl('')}
                className="absolute inset-y-0 right-3.5 flex items-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Action Submit Button */}
          <button
            type="submit"
            disabled={isAnalyzing || isCheckingExisting || !videoUrl.trim()}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[var(--text-primary)] text-[var(--card-bg)] hover:opacity-90 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0 cursor-pointer shadow-sm"
          >
            {isAnalyzing || isCheckingExisting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{isCheckingExisting ? 'Checking...' : 'Analyzing...'}</span>
              </>
            ) : (
              <>
                <span>Analyze</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Minimal API Key option toggle */}
        <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] px-1">
          <span className="text-[11px]">Powered by Gemini 3.7 Flash Vision</span>
          <button
            type="button"
            onClick={() => setShowApiKeyInput(!showApiKeyInput)}
            className="text-[11px] hover:text-[var(--text-primary)] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Key className="w-3 h-3" />
            <span>{showApiKeyInput ? 'Hide API Key' : 'Custom API Key'}</span>
          </button>
        </div>

        {/* Custom API Key input if toggled */}
        {showApiKeyInput && (
          <div className="p-3 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] flex flex-col sm:flex-row items-center gap-3 animate-in fade-in duration-150">
            <span className="text-xs font-medium text-[var(--text-secondary)] shrink-0">
              Custom Key:
            </span>
            <input
              type="password"
              value={customApiKey}
              onChange={(e) => setCustomApiKey(e.target.value)}
              placeholder="AIzaSy... (leave blank to use default)"
              disabled={isAnalyzing}
              className="flex-1 w-full px-3 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg-alt)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none"
            />
          </div>
        )}

        {/* Existing Analysis Alert */}
        {existingAsset && !isAnalyzing && (
          <div className="p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-150">
            <div className="flex items-center gap-2.5">
              <History className="w-4 h-4 text-[var(--text-secondary)]" />
              <div className="text-xs">
                <span className="font-bold text-[var(--text-primary)]">Previous analysis found: </span>
                <span className="text-[var(--text-secondary)]">{existingAsset.title || existingAsset.url}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
              <button
                type="button"
                onClick={handleViewExisting}
                className="px-3 py-1.5 rounded-xl bg-[var(--text-primary)] text-[var(--card-bg)] text-xs font-bold transition-all cursor-pointer"
              >
                View
              </button>
              <button
                type="button"
                onClick={handleForceReanalyze}
                className="px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg-alt)] text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--item-hover)] transition-all cursor-pointer"
              >
                Re-analyze
              </button>
              <button
                type="button"
                onClick={() => setExistingAsset(null)}
                className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Validation message */}
        {validationMsg && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationMsg}</span>
          </div>
        )}

        {/* Live Analysis Progress */}
        {isAnalyzing && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] text-xs">
            <Loader2 className="w-4 h-4 text-[var(--text-primary)] animate-spin shrink-0" />
            <span className="text-[var(--text-primary)] font-medium">
              {analysisProgress || 'Processing video analysis...'}
            </span>
          </div>
        )}

        {/* Error */}
        {!isAnalyzing && error && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </form>
    </div>
  );
}
