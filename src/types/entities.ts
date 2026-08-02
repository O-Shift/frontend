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
  next_run_at?: string | null;
  created_at: string;
  updated_at: string;
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
  destination_type: 'slack' | 'notion' | 'webhook';
  name: string;
  config: Record<string, unknown>;
}

export interface DestinationOut {
  id: string;
  destination_type: 'slack' | 'notion' | 'webhook';
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
