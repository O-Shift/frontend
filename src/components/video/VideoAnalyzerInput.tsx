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
} from 'lucide-react';
import type { AnalysisStage } from '@/hooks/use-videos';
import type { VideoAsset, VideoCollectResult } from '@/types/entities';

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
  ) => Promise<VideoCollectResult | null>;
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
      setValidationMsg('Please enter a valid video URL (TikTok, Instagram Reel, or YouTube).');
      return;
    }

    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      setValidationMsg('Video URL must start with http:// or https://');
      return;
    }

    // 1. Check if an analysis already exists for this video URL
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
    <div className="w-full flex flex-col gap-3 p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-md relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[var(--accent)]/15 border border-[var(--accent)]/30 flex items-center justify-center text-[var(--accent)] shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                On-Demand Video Intelligence
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Multimodal Vision</span>
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Paste any TikTok, Instagram Reel, or YouTube link to inspect 3-second hooks, attention pacing, and viral formulas.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowApiKeyInput(!showApiKeyInput)}
          className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1.5 self-start sm:self-auto transition-colors cursor-pointer"
        >
          <Key className="w-3.5 h-3.5" />
          <span>{showApiKeyInput ? 'Hide Custom Key' : 'Custom API Key'}</span>
          <ChevronDown
            className={`w-3 h-3 transition-transform ${showApiKeyInput ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-1">
        {/* Main Input Row */}
        <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
          {/* URL Input */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-[var(--text-secondary)]">
              <LinkIcon className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="Paste public TikTok, Instagram Reel, or YouTube video link..."
              disabled={isAnalyzing}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg-alt)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] transition-colors disabled:opacity-50 shadow-inner"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isAnalyzing || isCheckingExisting || !videoUrl.trim()}
            className="px-6 py-3 rounded-xl bg-[var(--accent)] hover:bg-[#e04f00] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0 cursor-pointer shadow-md hover:shadow-lg hover:shadow-[var(--accent)]/20"
          >
            {isAnalyzing || isCheckingExisting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{isCheckingExisting ? 'Checking...' : 'Analyzing Video...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Run Viral Analysis</span>
              </>
            )}
          </button>
        </div>

        {/* Existing Analysis Prompt */}
        {existingAsset && !isAnalyzing && (
          <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 mt-0.5 sm:mt-0">
                <History className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[var(--text-primary)]">
                    Previous Analysis Found
                  </span>
                  {existingAsset.analysis?.final_scores_out_of_100?.hook_score ? (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      {existingAsset.analysis.final_scores_out_of_100.hook_score}/100 Hook Power
                    </span>
                  ) : null}
                  {existingAsset.platform && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-[var(--pill-bg)] text-[var(--text-secondary)] capitalize">
                      {existingAsset.platform}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 line-clamp-1">
                  {existingAsset.title || existingAsset.url}
                </p>
                <span className="text-[10px] text-[var(--text-secondary)] opacity-80">
                  {existingAsset.analyzed_at
                    ? `Analyzed on ${new Date(existingAsset.analyzed_at).toLocaleDateString()}`
                    : 'Saved in workspace library'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0 pt-1 sm:pt-0">
              <button
                type="button"
                onClick={handleViewExisting}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Film className="w-3.5 h-3.5" />
                <span>View Previous Analysis</span>
              </button>

              <button
                type="button"
                onClick={handleForceReanalyze}
                className="px-3 py-1.5 rounded-xl bg-[var(--accent)]/15 hover:bg-[var(--accent)]/25 text-[var(--accent)] border border-[var(--accent)]/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Re-run AI Analysis</span>
              </button>

              <button
                type="button"
                onClick={() => setExistingAsset(null)}
                className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--item-hover)] transition-colors cursor-pointer"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Optional Custom API Key */}
        {showApiKeyInput && (
          <div className="p-3 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg-alt)] flex flex-col sm:flex-row items-center gap-3">
            <span className="text-xs font-medium text-[var(--text-secondary)] shrink-0">
              Google AI Studio Key:
            </span>
            <input
              type="password"
              value={customApiKey}
              onChange={(e) => setCustomApiKey(e.target.value)}
              placeholder="AIzaSy... (leave blank to use workspace default)"
              disabled={isAnalyzing}
              className="flex-1 w-full px-3 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
        )}

        {/* Validation error message */}
        {validationMsg && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationMsg}</span>
          </div>
        )}

        {/* Live Analysis Progress Bar & Status */}
        {isAnalyzing && (
          <div className="flex flex-col gap-2 p-3.5 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 mt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 text-[var(--accent)] animate-spin" />
                {analysisProgress || 'Processing video analysis...'}
              </span>
              <span className="text-[11px] font-mono text-[var(--accent)] capitalize">
                {analysisStage} stage
              </span>
            </div>

            {/* Visual Step Progress */}
            <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] font-medium">
              <div
                className={`px-2 py-1 rounded-lg text-center border ${
                  analysisStage === 'validating' || analysisStage === 'downloading' || analysisStage === 'analyzing'
                    ? 'border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--text-primary)]'
                    : 'border-[var(--border-color)] text-[var(--text-secondary)]'
                }`}
              >
                1. Stream Download
              </div>
              <div
                className={`px-2 py-1 rounded-lg text-center border ${
                  analysisStage === 'analyzing'
                    ? 'border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--text-primary)]'
                    : 'border-[var(--border-color)] text-[var(--text-secondary)]'
                }`}
              >
                2. Gemini 3.7 Vision & Brand Inference
              </div>
              <div
                className={`px-2 py-1 rounded-lg text-center border ${
                  analysisStage === 'complete'
                    ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
                    : 'border-[var(--border-color)] text-[var(--text-secondary)]'
                }`}
              >
                3. Strategy Report
              </div>
            </div>
          </div>
        )}

        {/* Completed feedback */}
        {!isAnalyzing && analysisStage === 'complete' && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Analysis completed! Inspect the newly generated strategy report below.</span>
          </div>
        )}

        {/* Error feedback */}
        {!isAnalyzing && error && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </form>
    </div>
  );
}
