// oshift/src/types/entities.ts
// Entity types matching backend FastAPI/Pydantic models in snake_case.

// ---------------------------------------------------------------------------
// Agent & Hermes Types
// ---------------------------------------------------------------------------

export interface AgentMessageCreate {
  content: string;
  conversation_id?: string | null;
}

export interface ConversationOut {
  id: string;
  workspace_id: string;
  user_id: string;
  title: string | null;
  model: string;
  created_at: string;
  updated_at: string;
}

export interface MessageOut {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export interface ConversationHistory {
  conversation: ConversationOut;
  messages: MessageOut[];
}

export interface ToolCallRecord {
  id: string;
  conversation_id: string;
  tool_name: string;
  args: Record<string, unknown>;
  result: Record<string, unknown> | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Automation Types
// ---------------------------------------------------------------------------

export interface TriggerPipelineRequest {
  workspace_id?: string | null;
  workflow_type?: string;
  verbose?: boolean;
  chain?: string[];
}

export interface TriggerResponse {
  run_id: string;
  status: 'running' | 'completed' | 'failed' | string;
}

export interface AutomationRun {
  id: string;
  workspace_id: string;
  status: 'running' | 'completed' | 'failed' | string;
  started_at: string;
  completed_at?: string | null;
  error?: string | null;
}

export interface AutomationStep {
  id: string;
  run_id: string;
  step_name: string;
  status: 'running' | 'completed' | 'failed' | string;
  started_at: string;
  completed_at?: string | null;
  duration_ms?: number | null;
  error?: string | null;
}

export interface AutomationSchedule {
  id: string;
  workspace_id: string;
  name: string;
  cron_expr: string;
  workflow_type: string;
  is_active: boolean;
  last_run_at?: string | null;
  next_run_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ScheduleCreate {
  name: string;
  cron_expr: string;
  workflow_type?: string;
  is_active?: boolean;
}

export interface ScheduleUpdate {
  name?: string | null;
  cron_expr?: string | null;
  is_active?: boolean | null;
}

// ---------------------------------------------------------------------------
// Export Types
// ---------------------------------------------------------------------------

export interface DestinationIn {
  destination_type: 'slack' | 'discord' | 'notion' | 'webhook' | string;
  name: string;
  config: Record<string, unknown>;
}

export interface DestinationOut {
  id: string;
  destination_type: 'slack' | 'discord' | 'notion' | 'webhook' | string;
  name: string;
  config: Record<string, unknown>;
}

export interface SlackExportIn {
  brief_id: string;
  destination_id: string;
}

export interface SlackExportOut {
  job_id: string;
  status: string;
  attempts: number;
}

export interface ExportJob {
  id: string;
  job_type: string;
  payload: Record<string, unknown>;
  destination_id: string;
  idempotency_key: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | string;
  attempts: number;
  error?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
}

export interface ExportLogEntry {
  id: string;
  job_id: string;
  event: string;
  error?: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Social Types
// ---------------------------------------------------------------------------

export type SocialPlatform = 'instagram' | 'tiktok' | 'linkedin' | 'x' | 'youtube' | 'facebook';

export interface SocialAccountCreate {
  platform: SocialPlatform;
  handle: string;
  competitor_id?: string | null;
  display_name?: string | null;
  follower_count?: number | null;
}

export interface SocialAccountUpdate {
  handle?: string | null;
  display_name?: string | null;
  follower_count?: number | null;
  is_active?: boolean | null;
}

export interface SocialAccount {
  id: string;
  workspace_id: string;
  platform: SocialPlatform;
  handle: string;
  competitor_id?: string | null;
  display_name?: string | null;
  follower_count?: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SocialPost {
  id: string;
  account_id: string;
  post_id: string;
  content: string;
  url?: string | null;
  likes_count?: number | null;
  comments_count?: number | null;
  shares_count?: number | null;
  views_count?: number | null;
  published_at?: string | null;
  captured_at: string;
}

export interface CollectTriggerResponse {
  accounts_processed: number;
  posts_new: number;
  posts_skipped: number;
  rate_limit_hits: number;
}

export interface CollectOneResponse {
  account_id: string;
  handle: string;
  platform: string;
  posts_new: number;
  posts_skipped: number;
}

// ---------------------------------------------------------------------------
// Video & Viral Analysis Types
// ---------------------------------------------------------------------------

export interface KeyMoment {
  timestamp_sec: number;
  description: string;
}

export interface VideoMetadata {
  brand_or_company_name?: string;
  country_or_region: string;
  language_and_dialect: string;
  genre: string;
  visible_creator_type: string;
}

export interface HookAnalysis {
  hook_strength_explanation: string;
  hook_types: string[];
  understandable_without_sound: boolean;
  hook_dependencies: string[];
}

export interface AttentionPattern {
  scene_changes_and_pacing: string;
  visual_novelty: string;
  text_overlays: string;
  audio_changes: string;
  emotional_peaks: string[];
  retention_risks: string[];
}

export interface EmotionalReactionPrediction {
  primary_emotions: string[];
}

export interface CulturalRegionalSignals {
  local_references: string[];
  humor_style: string;
  social_norms_observed: string;
  egyptian_arab_meme_references: string[];
  travels_outside_local_audience: boolean;
}

export interface FinalScores {
  hook_score: number;
  retention_score: number;
  emotional_intensity_score: number;
  shareability_score: number;
  cultural_specificity_score: number;
  cross_market_potential_score: number;
  overall_viral_pattern_similarity_score: number;
}

export interface VideoAnalysis {
  format: 'mp4' | 'mov' | 'webm' | 'unknown' | string;
  duration_seconds: number;
  hook: string;
  cta: string;
  key_moments: KeyMoment[];
  summary: string;
  video_metadata?: VideoMetadata | null;
  hook_analysis?: HookAnalysis | null;
  attention_pattern?: AttentionPattern | null;
  emotional_reaction_prediction?: EmotionalReactionPrediction | null;
  cultural_regional_signals?: CulturalRegionalSignals | null;
  viral_formula_tags?: string[];
  final_scores_out_of_100?: FinalScores | null;
}

export interface VideoAsset {
  id: string;
  workspace_id: string;
  competitor_id?: string | null;
  url: string;
  title?: string | null;
  duration_s?: number | null;
  platform?: string | null;
  captured_at: string;
  analysis?: VideoAnalysis | null;
  cost_usd?: number | null;
  analyzed_at?: string | null;
  competitor_name?: string | null;
}

export interface VideoCollectRequest {
  competitor_id?: string | null;
  video_url: string;
  api_key?: string | null;
  force_refresh?: boolean;
}

export interface VideoLookupResponse {
  exists: boolean;
  asset: VideoAsset | null;
  message?: string | null;
}

export interface VideoCollectResult {
  asset_id: string;
  status: 'ok' | 'cached' | 'failed' | string;
  analysis?: VideoAnalysis | null;
  cost_usd?: number | null;
  error?: string | null;
}

export interface VideoDownloadRequest {
  video_url: string;
}

export interface VideoDownloadResponse {
  video_url: string;
  local_path: string;
  title: string;
  duration_s: number;
  platform: string;
}
