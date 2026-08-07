// oshift/src/types/schemas.ts
import { z } from 'zod';

export const socialAccountCreateSchema = z.object({
  platform: z.enum(['instagram', 'tiktok', 'linkedin', 'x', 'youtube', 'facebook'], {
    message: 'Please select a platform',
  }),
  handle: z
    .string()
    .min(1, 'Handle is required')
    .max(100, 'Handle is too long')
    .transform((val) => val.replace(/^@/, '').trim()),
  display_name: z.string().max(100).optional(),
  competitor_id: z.string().uuid().optional().or(z.literal('')),
  follower_count: z.coerce.number().min(0).optional(),
});

export const scheduleCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  cron_expr: z
    .string()
    .min(1, 'Cron expression is required')
    .regex(/^(\*|[0-9,\-\/]+)\s+(\*|[0-9,\-\/]+)\s+(\*|[0-9,\-\/]+)\s+(\*|[0-9,\-\/]+)\s+(\*|[0-9,\-\/]+)$/, {
      message: 'Invalid 5-field cron expression (e.g. "0 0 * * *")',
    }),
  workflow_type: z.string().default('oshift-pipeline-v1'),
  is_active: z.boolean().default(true),
});

export const destinationCreateSchema = z.object({
  destination_type: z.enum(['slack', 'notion', 'webhook'], {
    message: 'Destination type is required',
  }),
  name: z.string().min(1, 'Name is required').max(200),
  config_json: z.string().refine(
    (val) => {
      try {
        const parsed = JSON.parse(val);
        return typeof parsed === 'object' && parsed !== null;
      } catch {
        return false;
      }
    },
    { message: 'Config must be valid JSON object' }
  ),
});

export const slackExportSchema = z.object({
  brief_id: z.string().uuid('Please select a valid brief'),
  destination_id: z.string().uuid('Please select a Slack destination'),
});
